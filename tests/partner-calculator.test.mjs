import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARTNER_MODELS,
  calculatePartnerScenario,
  sanitizePartnerInput,
} from '../src/app/pages/partnerCalculator.ts';

const base = {
  mode: 'monthly', monthlyTarget: 9_000_000, months: 3, dailyRate: 800_000,
  rentalDays: 15, ownerShare: 80, fixedCost: 2_500_000, loanPayment: 0, variableCostPerDay: 0,
};

test('monthly scenario calculates cashflow and period total', () => {
  const result = calculatePartnerScenario(base);
  assert.equal(result.grossOwnerReceipts, 9_000_000);
  assert.equal(result.cashflowAfterOperatingCost, 6_500_000);
  assert.equal(result.cashflowAfterLoan, 6_500_000);
  assert.equal(result.economicProfit, null);
  assert.equal(result.monthlyCashflow, 6_500_000);
  assert.equal(result.cashflowForPeriod, 19_500_000);
  assert.equal(result.expenseCoverage, 360);
  assert.equal(result.equivalentSelfRentalDays, 15);
});

test('separates operating cashflow from cashflow after loan payment', () => {
  const result = calculatePartnerScenario({ ...base, loanPayment: 3_000_000 });
  assert.equal(result.cashflowAfterOperatingCost, 6_500_000);
  assert.equal(result.cashflowAfterLoan, 3_500_000);
  assert.equal(result.monthlyCashflow, 3_500_000);
  assert.equal(result.economicProfit, null);
});

test('daily scenario honours share, variable costs and break-even', () => {
  const result = calculatePartnerScenario({
    ...base, mode: 'daily', dailyRate: 1_000_000, rentalDays: 15,
    ownerShare: 80, variableCostPerDay: 100_000,
  });
  assert.equal(result.grossOwnerReceipts, 12_000_000);
  assert.equal(result.variableCostTotal, 1_500_000);
  assert.equal(result.monthlyCashflow, 8_000_000);
  assert.equal(result.breakEvenDays, 4);
});

test('sanitizes invalid and out-of-range inputs before calculation', () => {
  const sanitized = sanitizePartnerInput({
    ...base, monthlyTarget: -1, months: 99, rentalDays: -4,
    ownerShare: 130, fixedCost: Number.NaN, loanPayment: -2, variableCostPerDay: 999_999_999,
  });
  assert.equal(sanitized.monthlyTarget, 0);
  assert.equal(sanitized.months, 36);
  assert.equal(sanitized.rentalDays, 0);
  assert.equal(sanitized.ownerShare, 100);
  assert.equal(sanitized.fixedCost, 0);
  assert.equal(sanitized.loanPayment, 0);
  assert.equal(sanitized.variableCostPerDay, 200_000_000);
});

test('model quick-select data includes supported Carnival defaults', () => {
  assert.deepEqual(PARTNER_MODELS['Kia Carnival'], { monthlyTarget: 18_000_000, dailyRate: 1_550_000 });
});
