export type PartnerMode = 'monthly' | 'daily';

export interface PartnerModelConfig {
  monthlyTarget: number;
  dailyRate: number;
}
export interface PartnerCalculatorInput {
  mode: PartnerMode;
  monthlyTarget: number;
  months: number;
  dailyRate: number;
  rentalDays: number;
  ownerShare: number;
  fixedCost: number;
  loanPayment: number;
  variableCostPerDay: number;
}

export interface PartnerCalculatorResult {
  grossOwnerReceipts: number;
  cashflowAfterOperatingCost: number;
  cashflowAfterLoan: number;
  economicProfit: null;
  /** @deprecated Use cashflowAfterLoan. Kept for compatibility with existing callers. */
  monthlyCashflow: number;
  cashflowForPeriod: number;
  fixedCost: number;
  variableCostTotal: number;
  expenseCoverage: number | null;
  equivalentSelfRentalDays: number | null;
  breakEvenDays: number | null;
  contributionPerDay: number;
}

export const PARTNER_MODELS: Record<string, PartnerModelConfig> = {
  'VinFast VF3': { monthlyTarget: 6_000_000, dailyRate: 550_000 },
  'VinFast VF5': { monthlyTarget: 9_000_000, dailyRate: 800_000 },
  'VinFast VF6': { monthlyTarget: 12_000_000, dailyRate: 950_000 },
  'VinFast VF7 / VF8': { monthlyTarget: 16_000_000, dailyRate: 1_300_000 },
  'VinFast Fadil': { monthlyTarget: 6_500_000, dailyRate: 600_000 },
  'Mazda 3': { monthlyTarget: 9_500_000, dailyRate: 850_000 },
  'Mazda CX-5': { monthlyTarget: 13_000_000, dailyRate: 1_150_000 },
  'Hyundai Accent': { monthlyTarget: 7_800_000, dailyRate: 700_000 },
  'Toyota Vios': { monthlyTarget: 7_500_000, dailyRate: 680_000 },
  'Honda City': { monthlyTarget: 8_500_000, dailyRate: 750_000 },
  'Mitsubishi Xpander': { monthlyTarget: 12_000_000, dailyRate: 1_000_000 },
  'Kia Carnival': { monthlyTarget: 18_000_000, dailyRate: 1_550_000 },
};

export const PARTNER_QUICK_TIERS = [
  { key: 'low', label: 'Thấp', ratio: 0.8 },
  { key: 'normal', label: 'Tiêu chuẩn', ratio: 1 },
  { key: 'high', label: 'Cao', ratio: 1.25 },
] as const;

function nonNegative(value: number, max = 200_000_000) {
  return Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0));
}

function whole(value: number, max: number) {
  return Math.round(nonNegative(value, max));
}

export function sanitizePartnerInput(input: PartnerCalculatorInput): PartnerCalculatorInput {
  return {
    ...input,
    monthlyTarget: nonNegative(input.monthlyTarget),
    months: whole(input.months, 36),
    dailyRate: nonNegative(input.dailyRate),
    rentalDays: whole(input.rentalDays, 31),
    ownerShare: whole(input.ownerShare, 100),
    fixedCost: nonNegative(input.fixedCost),
    loanPayment: nonNegative(input.loanPayment),
    variableCostPerDay: nonNegative(input.variableCostPerDay),
  };
}

export function calculatePartnerScenario(rawInput: PartnerCalculatorInput): PartnerCalculatorResult {
  const input = sanitizePartnerInput(rawInput);
  const fixedCost = input.fixedCost + input.loanPayment;
  const isDaily = input.mode === 'daily';
  const grossOwnerReceipts = isDaily
    ? input.rentalDays * input.dailyRate * (input.ownerShare / 100)
    : input.monthlyTarget;
  const variableCostTotal = isDaily ? input.rentalDays * input.variableCostPerDay : 0;
  const cashflowAfterOperatingCost = grossOwnerReceipts - input.fixedCost - variableCostTotal;
  const cashflowAfterLoan = cashflowAfterOperatingCost - input.loanPayment;
  const cashflowForPeriod = cashflowAfterLoan * (isDaily ? 1 : input.months);
  const contributionPerDay = input.dailyRate * (input.ownerShare / 100) - input.variableCostPerDay;

  return {
    grossOwnerReceipts,
    cashflowAfterOperatingCost,
    cashflowAfterLoan,
    economicProfit: null,
    monthlyCashflow: cashflowAfterLoan,
    cashflowForPeriod,
    fixedCost,
    variableCostTotal,
    expenseCoverage: fixedCost > 0 ? (grossOwnerReceipts / fixedCost) * 100 : null,
    equivalentSelfRentalDays: !isDaily && input.dailyRate * (input.ownerShare / 100) > 0
      ? Math.ceil(input.monthlyTarget / (input.dailyRate * (input.ownerShare / 100)))
      : null,
    breakEvenDays: isDaily && contributionPerDay > 0 ? Math.ceil(fixedCost / contributionPerDay) : null,
    contributionPerDay,
  };
}

export function formatPartnerMoney(value: number) {
  return `${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('vi-VN')}đ`;
}

export function formatPartnerQuickValue(value: number) {
  return value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`
    : `${Math.round(value / 1_000).toLocaleString('vi-VN')}k`;
}
