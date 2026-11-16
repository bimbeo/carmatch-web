import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, BriefcaseBusiness, Building2, CalendarDays, Car, Check, CheckCircle2,
  Copy, Gauge, Home, Mail, MessageCircle, Printer, RefreshCw, Send, ShieldCheck, Sparkles, Users, Wrench, Zap,
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { submitLead } from '@/hooks/useLeads';
import { formatPrice, type Car as CarModel } from '@/data/cars';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import { useSEO } from '@/hooks/useSEO';
import { trackEvent, trackPhoneClick, trackZaloClick } from '@/lib/analytics';
import { optimizedImageSrcSet, optimizedImageUrl } from '@/lib/imageUrl';

const ZALO_LINK = 'https://zalo.me/0971163290';
const PHONE_LINK = 'tel:0971163290';

type CustomerType = 'business' | 'personal';
type Scenario = 'sales' | 'project' | 'manager' | 'fleet' | 'commute' | 'family' | 'expert' | 'temporary';
type VehicleGroup = 'city' | 'sedan' | 'mpv' | 'premium' | 'flex';
type PreferredChannel = 'zalo' | 'email' | 'both';

interface AudienceConfig {
  scenario: Scenario;
  vehicleGroup: VehicleGroup;
  vehicleId: string;
  months: number;
  expectedKm: number;
  deliveryArea: string;
  notes: string;
  quantity: number;
  invoiceRequired: boolean;
  formalQuoteRequired: boolean;
  contractSampleRequested: boolean;
  preferredChannel: PreferredChannel;
}

interface ContactForm {
  companyName: string;
  taxCode: string;
  contactName: string;
  phone: string;
  email: string;
}

interface ScenarioPreset {
  vehicleGroup: VehicleGroup;
  preferredModels: string[];
  quantity: number;
  months: number;
  expectedKm: number;
}

const groupLabels: Record<VehicleGroup, string> = {
  city: 'Xe đô thị / xe điện nhỏ',
  sedan: 'Sedan / CUV 5 chỗ',
  mpv: 'MPV / xe 7 chỗ',
  premium: 'SUV / MPV cao cấp',
  flex: 'Chưa chắc — cần tư vấn',
};

const scenarioItems: Record<CustomerType, Array<{ id: Scenario; icon: typeof Car; title: string; description: string; recommendedGroup: VehicleGroup }>> = {
  business: [
    { id: 'sales', icon: BriefcaseBusiness, title: 'Nhân viên gặp khách, đối tác', description: 'Di chuyển nội thành, gặp khách nhiều điểm, lịch dùng liên tục.', recommendedGroup: 'city' },
    { id: 'project', icon: Gauge, title: 'Kỹ thuật, khảo sát, công trình', description: 'Đi tỉnh, chở thiết bị và cần chốt rõ km dự kiến.', recommendedGroup: 'mpv' },
    { id: 'manager', icon: ShieldCheck, title: 'Xe phục vụ quản lý, lãnh đạo', description: 'Ưu tiên hình ảnh, lịch sử dụng riêng và yêu cầu cao.', recommendedGroup: 'sedan' },
    { id: 'fleet', icon: Users, title: 'Thuê nhiều xe cho phòng ban', description: 'Cần hợp đồng, đối soát và ngân sách tập trung.', recommendedGroup: 'flex' },
  ],
  personal: [
    { id: 'commute', icon: ArrowRight, title: 'Đi làm hằng ngày', description: 'Có xe riêng đi làm, đi lại nội thành, chủ động lịch cá nhân.', recommendedGroup: 'city' },
    { id: 'family', icon: Home, title: 'Gia đình sử dụng dài hạn', description: 'Đưa đón con, đi chơi cuối tuần, về quê và đi tỉnh.', recommendedGroup: 'mpv' },
    { id: 'expert', icon: Sparkles, title: 'Chuyên gia lưu trú tại Hà Nội', description: 'Cần phương tiện trong vài tháng làm việc hoặc sinh sống.', recommendedGroup: 'sedan' },
    { id: 'temporary', icon: CalendarDays, title: 'Cần xe tạm thời', description: 'Trong thời gian chờ mua xe, sửa xe hoặc chưa muốn sở hữu.', recommendedGroup: 'city' },
  ],
};

const scenarioLabels = Object.fromEntries(
  Object.values(scenarioItems).flat().map((item) => [item.id, item.title]),
) as Record<Scenario, string>;

const scenarioPresets: Record<Scenario, ScenarioPreset> = {
  sales: { vehicleGroup: 'city', preferredModels: ['vf5 2025', 'vf5'], quantity: 1, months: 1, expectedKm: 4000 },
  project: { vehicleGroup: 'mpv', preferredModels: ['xpander 2023', 'xpander'], quantity: 1, months: 1, expectedKm: 4000 },
  manager: { vehicleGroup: 'sedan', preferredModels: ['vf6', 'vf7s 2025', 'vf7'], quantity: 1, months: 1, expectedKm: 4000 },
  fleet: { vehicleGroup: 'flex', preferredModels: [], quantity: 2, months: 1, expectedKm: 4000 },
  commute: { vehicleGroup: 'city', preferredModels: ['vf3 2025', 'vf3'], quantity: 1, months: 1, expectedKm: 4000 },
  family: { vehicleGroup: 'mpv', preferredModels: ['xpander 2023', 'xpander', 'vf6'], quantity: 1, months: 1, expectedKm: 4000 },
  expert: { vehicleGroup: 'sedan', preferredModels: ['vf6'], quantity: 1, months: 1, expectedKm: 4000 },
  temporary: { vehicleGroup: 'city', preferredModels: ['vf3 2025', 'vf3'], quantity: 1, months: 1, expectedKm: 4000 },
};

const businessFaqs = [
  { question: 'Có thể yêu cầu hóa đơn VAT theo tên và mã số thuế công ty không?', answer: 'Có. VAT áp dụng là 8%. Doanh nghiệp cung cấp tên, mã số thuế và thông tin nhận hóa đơn để Car Match ghi nhận trong báo giá chính thức.' },
  { question: 'Báo giá chính thức để trình duyệt cần những thông tin gì?', answer: 'Doanh nghiệp nên gửi số xe, nhóm xe, thời hạn, địa điểm bàn giao, nhu cầu hóa đơn và người phụ trách. Gói thuê áp dụng trọn 30 ngày, tự lái và định mức 4.000 km/xe/tháng.' },
  { question: 'Thuê dài hạn hoặc nhiều xe có được chiết khấu không?', answer: 'Car Match ghi nhận số tháng và số lượng để lập phương án. Không có mức giảm mặc định trên trang; mọi ưu đãi chỉ có hiệu lực khi được ghi trong báo giá chính thức.' },
];

const personalFaqs = [
  { question: 'Tôi chỉ cần thuê xe một tháng, Car Match có nhận không?', answer: 'Có thể nhận nhu cầu 1 tháng nếu có mẫu xe và lịch phù hợp. Car Match sẽ kiểm tra lịch xe trước khi gửi báo giá và hướng dẫn cọc.' },
  { question: 'Thuê xe tháng cá nhân cần đặt cọc bao nhiêu?', answer: 'Mức cọc niêm yết theo dòng xe từ 15–30 triệu đồng và được hiển thị trong bảng giá. Số tiền áp dụng cho mẫu xe đã chọn sẽ được ghi lại trong báo giá hoặc hợp đồng.' },
  { question: 'Tôi có được nhận xe tại chung cư hoặc khu đô thị không?', answer: 'Bạn có thể gửi khu vực nhận xe mong muốn tại Hà Nội. Điểm hẹn, thời gian và phí giao nhận nếu có sẽ được xác nhận trước khi bàn giao.' },
  { question: 'Thuê xe theo tháng có giới hạn km và đi tỉnh được không?', answer: 'Gói thuê tháng áp dụng định mức 4.000 km/xe/tháng. Phạm vi đi tỉnh và phí vượt km được xác nhận trong báo giá và hợp đồng trước khi nhận xe.' },
  { question: 'Có thể gia hạn hoặc đổi mẫu xe sau tháng đầu không?', answer: 'Có thể đề nghị gia hạn hoặc đổi nhóm xe, nhưng còn phụ thuộc lịch xe và điều kiện hợp đồng. Car Match sẽ xác nhận lại trước kỳ tiếp theo.' },
  { question: 'Chuyên gia nước ngoài có thể thuê xe tháng không?', answer: 'Có thể gửi nhu cầu để kiểm tra hồ sơ người thuê và người lái. Giấy phép lái xe, giấy tờ lưu trú và điều kiện sử dụng phải được đối chiếu trước khi ký.' },
];

const businessProcess = [
  ['01 / Gửi nhu cầu', 'Cho biết xe dùng làm gì', 'Số xe, thời hạn, km, địa điểm và người phụ trách.'],
  ['02 / Kiểm tra xe', 'Đối chiếu phương án', 'Xác minh xe, lịch, giá tháng và điều kiện giao nhận.'],
  ['03 / Trình duyệt', 'Nhận báo giá & hồ sơ', 'Gửi báo giá chính thức, thông tin hợp đồng và VAT nếu đủ điều kiện.'],
  ['04 / Triển khai', 'Ký và bàn giao', 'Thống nhất người lái, thanh toán, tài sản bảo đảm và thời gian sử dụng.'],
];

const personalProcess = [
  ['01 / Gửi nhu cầu', 'Chọn nhu cầu', 'Nhập thời hạn, loại xe, km dự kiến và điểm nhận.'],
  ['02 / Kiểm tra xe', 'Kiểm tra xe & lịch', 'Car Match đối chiếu xe, lịch thuê tháng và điều kiện áp dụng.'],
  ['03 / Chuẩn bị', 'Nhận báo giá & chuẩn bị', 'Thống nhất tiền thuê, cọc, giấy tờ và phạm vi sử dụng.'],
  ['04 / Sử dụng', 'Bàn giao & sử dụng', 'Hẹn nhận xe, kiểm tra hiện trạng và hoàn tất thủ tục.'],
];

const monthlyGuides = [
  ['/blog/thue-xe-thang-cho-doanh-nghiep-nho', 'Thuê xe tháng cho doanh nghiệp nhỏ'],
  ['/blog/thue-xe-thang-cho-chuyen-gia-nuoc-ngoai', 'Xe tháng cho chuyên gia nước ngoài'],
  ['/blog/thue-xe-thang-cho-nhan-vien-di-cong-tac', 'Xe tháng cho nhân viên công tác'],
  ['/blog/thue-xe-thang-co-xuat-hoa-don-khong', 'Hóa đơn khi thuê xe tháng'],
  ['/blog/hop-dong-thue-xe-thang-can-dieu-khoan-gi', 'Điều khoản hợp đồng xe tháng'],
  ['/blog/thue-xe-thang-co-gioi-han-km-khong', 'Giới hạn km và phí vượt km'],
  ['/blog/xe-thay-the-khi-bao-duong-xu-ly-the-nao', 'Xe thay thế khi bảo dưỡng'],
  ['/blog/thue-xe-thang-hay-mua-xe', 'Thuê xe tháng hay mua xe?'],
  ['/blog/thue-xe-thang-co-bao-gom-bao-duong-khong', 'Bảo dưỡng trong kỳ thuê'],
] as const;

const businessDefault: AudienceConfig = {
  scenario: 'sales', vehicleGroup: 'city', vehicleId: '', months: 1, expectedKm: 4000,
  deliveryArea: '', notes: '', quantity: 1,
  invoiceRequired: true, formalQuoteRequired: true, contractSampleRequested: false, preferredChannel: 'both',
};

const personalDefault: AudienceConfig = {
  scenario: 'commute', vehicleGroup: 'city', vehicleId: '', months: 1, expectedKm: 4000,
  deliveryArea: '', notes: '', quantity: 1,
  invoiceRequired: false, formalQuoteRequired: false, contractSampleRequested: false, preferredChannel: 'zalo',
};

function groupForCar(car: CarModel): VehicleGroup {
  const name = car.name.toLowerCase();
  if (name.includes('vf8') || name.includes('carnival')) return 'premium';
  if (car.seats >= 7) return 'mpv';
  if (name.includes('vf3') || name.includes('vf5') || name.includes('fadil')) return 'city';
  return 'sedan';
}

function carFitsGroup(car: CarModel, group: VehicleGroup) {
  return group === 'flex' || groupForCar(car) === group;
}

function displayVehicleName(name: string) {
  return name.replace(/\bVinfast\b/gi, 'VinFast');
}

function monthlyCarFamily(car: CarModel) {
  const name = displayVehicleName(car.name).toLowerCase();
  for (const family of ['vf3', 'fadil', 'vf5', 'xpander', 'vf6', 'creta', 'vf7', 'vf8', 'carnival']) {
    if (name.includes(family)) return family;
  }
  return name
    .replace(/\b(?:19|20)\d{2}\b/g, '')
    .replace(/\b(?:plus|premium|luxury|standard|base)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim() || car.id;
}

function representativePriority(car: CarModel) {
  const name = displayVehicleName(car.name).toLowerCase();
  const year = Number(name.match(/\b(20\d{2})\b/)?.[1] || 0);
  const variantPenalty = /\b(?:plus|premium|luxury)\b/.test(name) ? 10000 : 0;
  const approvedMonthlyPrice = typeof car.priceMonth === 'number' && car.priceMonth > 0 ? 100000 : 0;
  return approvedMonthlyPrice + year - variantPenalty;
}

function uniqueMonthlyCars(cars: CarModel[]) {
  const representatives = new Map<string, CarModel>();
  for (const car of cars) {
    const family = monthlyCarFamily(car);
    const current = representatives.get(family);
    if (!current || representativePriority(car) > representativePriority(current)) {
      representatives.set(family, car);
    }
  }
  return [...representatives.values()];
}

function monthlyDepositForCar(car: CarModel) {
  const name = displayVehicleName(car.name).toLowerCase();
  if (name.includes('vf3') || name.includes('fadil')) return 15000000;
  if (name.includes('vf5')) return 20000000;
  if (name.includes('vf6') || name.includes('xpander')) return 25000000;
  if (name.includes('vf7') || name.includes('creta')) return 30000000;
  return null;
}

function findPreferredCar(cars: CarModel[], preset: ScenarioPreset) {
  for (const model of preset.preferredModels) {
    const match = cars.find((car) => displayVehicleName(car.name).toLowerCase().includes(model));
    if (match) return match;
  }
  return cars.find((car) => carFitsGroup(car, preset.vehicleGroup)) || null;
}

function representativeCars(cars: CarModel[]) {
  const selected: CarModel[] = [];
  const pick = (terms: string[]) => terms.map((term) => cars.find((car) => displayVehicleName(car.name).toLowerCase().includes(term))).find(Boolean);
  [pick(['vf3 2025', 'vf3']), pick(['vf5 2025', 'vf5 plus', 'vf5']), pick(['xpander 2023', 'xpander']), pick(['vf6'])]
    .forEach((car) => { if (car && !selected.some((item) => monthlyCarFamily(item) === monthlyCarFamily(car))) selected.push(car); });
  for (const car of cars) {
    if (selected.length >= 4) break;
    if (!selected.some((item) => monthlyCarFamily(item) === monthlyCarFamily(car))) selected.push(car);
  }
  return selected;
}

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `monthly:${crypto.randomUUID()}`;
  return `monthly:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function channelLabel(channel: PreferredChannel) {
  if (channel === 'both') return 'Zalo và Email';
  return channel === 'email' ? 'Email' : 'Zalo';
}

function formatBudget(value: number | null) {
  return value ? formatPrice(value) : 'Cần báo riêng';
}

export default function B2B() {
  useSEO({
    title: 'Thuê Xe Tự Lái Theo Tháng Hà Nội Cho Công Ty & Cá Nhân',
    description: 'Thuê xe tự lái theo tháng tại Hà Nội cho doanh nghiệp, cá nhân, gia đình và chuyên gia. Xem bảng giá theo xe, lập dự toán và gửi yêu cầu báo giá.',
    canonical: 'https://www.carmatch.vn/thue-xe-thang',
  });

  const { cars } = useVehicles();
  const [customerType, setCustomerType] = useState<CustomerType>('business');
  const [configs, setConfigs] = useState<Record<CustomerType, AudienceConfig>>({ business: businessDefault, personal: personalDefault });
  const [initializedAudience, setInitializedAudience] = useState<Record<CustomerType, boolean>>({ business: true, personal: false });
  const [contact, setContact] = useState<ContactForm>({ companyName: '', taxCode: '', contactName: '', phone: '', email: '' });
  const [gasCalculator, setGasCalculator] = useState({ km: 3000, consumption: 7.5, price: 24000 });
  const [submitState, setSubmitState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message?: string; requestId?: string }>({ status: 'idle' });
  const idempotencyRef = useRef('');
  const configStartedRef = useRef<Set<CustomerType>>(new Set());

  const config = configs[customerType];
  const updateConfig = (patch: Partial<AudienceConfig>, track = true) => {
    setConfigs((current) => ({ ...current, [customerType]: { ...current[customerType], ...patch } }));
    if (track) {
      if (!configStartedRef.current.has(customerType)) {
        configStartedRef.current.add(customerType);
        trackEvent('monthly_config_started', { customer_type: customerType });
      }
      trackEvent('monthly_config_changed', { customer_type: customerType, changed_fields: Object.keys(patch).join(',') });
    }
  };

  const uniqueCatalogCars = useMemo(() => uniqueMonthlyCars(cars), [cars]);
  const sortedMonthlyCars = useMemo(
    () => uniqueCatalogCars
      .filter((car) => typeof car.priceMonth === 'number' && car.priceMonth > 0)
      .sort((a, b) => (a.priceMonth || 0) - (b.priceMonth || 0)),
    [uniqueCatalogCars],
  );
  const advisoryCars = useMemo(
    () => uniqueCatalogCars
      .filter((car) => !car.priceMonth || car.priceMonth <= 0)
      .sort((a, b) => (a.price || 0) - (b.price || 0)),
    [uniqueCatalogCars],
  );
  const pricingTableCars = useMemo(
    () => [...sortedMonthlyCars, ...advisoryCars],
    [sortedMonthlyCars, advisoryCars],
  );
  const groupCars = [...sortedMonthlyCars, ...advisoryCars].filter((car) => carFitsGroup(car, config.vehicleGroup));
  const selectedCar = uniqueCatalogCars.find((car) => car.id === config.vehicleId) || groupCars[0] || null;
  const baseMonthlyPrice = selectedCar?.priceMonth || null;
  const baseBudget = baseMonthlyPrice
    ? baseMonthlyPrice * config.quantity * config.months
    : null;
  const startingPrice = sortedMonthlyCars[0]?.priceMonth || null;
  const heroCar = sortedMonthlyCars.find((car) => car.images[0]) || cars.find((car) => car.images[0]) || null;
  const fuelBudget = Math.max(0, gasCalculator.km * gasCalculator.consumption / 100 * gasCalculator.price);
  const vf3MonthlyPrice = sortedMonthlyCars.find((car) => displayVehicleName(car.name).toLowerCase().includes('vf3'))?.priceMonth || 10000000;
  const fuelToVf3Percent = Math.round((fuelBudget / vf3MonthlyPrice) * 100);
  const featuredCars = useMemo(() => representativeCars(sortedMonthlyCars), [sortedMonthlyCars]);

  useEffect(() => {
    if (!config.vehicleId || groupCars.some((car) => car.id === config.vehicleId)) return;
    setConfigs((current) => ({ ...current, [customerType]: { ...current[customerType], vehicleId: '' } }));
  }, [config.vehicleGroup, config.vehicleId, customerType, groupCars]);

  const selectCustomerType = (nextType: CustomerType) => {
    if (nextType === customerType) return;
    if (!initializedAudience[nextType]) {
      const shared = configs[customerType];
      const audienceDefault = nextType === 'business' ? businessDefault : personalDefault;
      const preset = scenarioPresets[audienceDefault.scenario];
      const preferredCar = findPreferredCar(sortedMonthlyCars, preset);
      setConfigs((current) => ({
        ...current,
        [nextType]: {
          ...audienceDefault,
          vehicleGroup: preset.vehicleGroup,
          vehicleId: preferredCar?.id || '',
          quantity: nextType === 'personal' ? 1 : preset.quantity,
          months: preset.months,
          expectedKm: preset.expectedKm,
          deliveryArea: shared.deliveryArea, notes: shared.notes,
        },
      }));
      setInitializedAudience((current) => ({ ...current, [nextType]: true }));
    }
    setCustomerType(nextType);
    idempotencyRef.current = '';
    setSubmitState({ status: 'idle' });
    trackEvent('monthly_audience_selected', { customer_type: nextType });
  };

  const selectScenario = (scenario: Scenario, scroll = true) => {
    const preset = scenarioPresets[scenario];
    const preferredCar = findPreferredCar(sortedMonthlyCars, preset);
    updateConfig({
      scenario,
      vehicleGroup: preset.vehicleGroup,
      vehicleId: preferredCar?.id || '',
      quantity: customerType === 'personal' ? 1 : preset.quantity,
      months: preset.months,
      expectedKm: preset.expectedKm,
    }, false);
    trackEvent('monthly_scenario_selected', { customer_type: customerType, scenario, vehicle_group: preset.vehicleGroup });
    if (!scroll) return;
    document.getElementById('monthly-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseCarForEstimate = (car: CarModel) => {
    const vehicleGroup = groupForCar(car);
    updateConfig({ vehicleGroup, vehicleId: car.id });
    trackEvent('monthly_vehicle_selected_from_pricing', { customer_type: customerType, vehicle_id: car.id, vehicle_group: vehicleGroup });
    document.getElementById('monthly-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePrint = () => {
    trackEvent('monthly_print_a4', { customer_type: customerType, scenario: config.scenario, vehicle_group: config.vehicleGroup });
    document.body.classList.add('cm-monthly-printing');
    const cleanup = () => document.body.classList.remove('cm-monthly-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1200);
  };

  const copySummary = async () => {
    const summary = [
      `Nhóm khách: ${customerType === 'business' ? 'Doanh nghiệp / Công ty' : 'Cá nhân / Gia đình / Chuyên gia'}`,
      `Nhu cầu: ${scenarioLabels[config.scenario]}`,
      `Nhóm xe: ${groupLabels[config.vehicleGroup]}`,
      `Mẫu xe cơ sở: ${selectedCar ? displayVehicleName(selectedCar.name) : 'Cần chuyên viên tư vấn'}`,
      `Thời hạn: ${config.months} tháng`,
      `Km dự kiến: ${config.expectedKm.toLocaleString('vi-VN')} km/xe/tháng`,
      `Dự toán tiền thuê cơ sở: ${formatBudget(baseBudget)}`,
      'VAT 8%, cọc, phí giao nhận và ưu đãi dài hạn: xác nhận trong báo giá chính thức.',
    ].join('\n');
    await navigator.clipboard?.writeText(summary);
    trackEvent('monthly_quote_preview', { customer_type: customerType, vehicle_group: config.vehicleGroup, duration_months: config.months });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState.status === 'loading') return;
    const emailRequired = config.preferredChannel === 'email' || config.preferredChannel === 'both';
    if (emailRequired && !contact.email.trim()) {
      setSubmitState({ status: 'error', message: 'Vui lòng nhập email để nhận báo giá qua Email hoặc Cả hai.' });
      return;
    }
    if (customerType === 'business' && !contact.companyName.trim()) {
      setSubmitState({ status: 'error', message: 'Vui lòng nhập tên doanh nghiệp.' });
      return;
    }

    if (!idempotencyRef.current) idempotencyRef.current = newIdempotencyKey();
    setSubmitState({ status: 'loading' });
    const trackingPayload = {
      customer_type: customerType, scenario: config.scenario, vehicle_group: config.vehicleGroup,
      vehicle_count: config.quantity, duration_months: config.months, days_plan: '30',
      operation_mode: 'self', preferred_contact_channel: config.preferredChannel,
    };
    trackEvent('monthly_quote_submit_attempt', trackingPayload);
    const result = await submitLead({
      source: 'b2b',
      form_type: customerType === 'business' ? 'monthly_business_lead' : 'monthly_personal_lead',
      customer_type: customerType,
      name: contact.contactName,
      phone: contact.phone,
      email: contact.email || undefined,
      company_name: customerType === 'business' ? contact.companyName : undefined,
      tax_code: customerType === 'business' ? contact.taxCode || undefined : undefined,
      scenario: config.scenario,
      vehicle_group: config.vehicleGroup,
      vehicle_id: selectedCar?.id || undefined,
      quantity: String(config.quantity),
      duration: String(config.months),
      car_model: selectedCar ? displayVehicleName(selectedCar.name) : groupLabels[config.vehicleGroup],
      building: config.deliveryArea,
      expected_km_per_vehicle_month: config.expectedKm,
      days_plan: '30',
      operation_mode: 'self',
      invoice_required: config.invoiceRequired,
      formal_quote_required: config.formalQuoteRequired,
      preferred_contact_channel: config.preferredChannel,
      contract_sample_requested: customerType === 'business' && config.contractSampleRequested,
      note: config.notes,
      source_page: '/thue-xe-thang',
      idempotency_key: idempotencyRef.current,
    });
    if (!result.ok) {
      const customerMessage = result.errorCode === 'timeout' || result.errorCode === 'network_error'
        ? result.error
        : 'Chưa gửi được yêu cầu. Vui lòng thử lại hoặc liên hệ Car Match qua Zalo.';
      setSubmitState({ status: 'error', message: customerMessage });
      trackEvent('monthly_quote_submit_error', { ...trackingPayload, error_code: result.errorCode || 'unknown' });
      return;
    }
    setSubmitState({ status: 'success', requestId: result.requestId, message: `Car Match đã ghi nhận yêu cầu qua ${channelLabel(config.preferredChannel)}.` });
    trackEvent('monthly_quote_submit_success', { ...trackingPayload, duplicate_replay: Boolean(result.duplicate) });
  };

  const activeScenarios = scenarioItems[customerType];
  const processSteps = customerType === 'business' ? businessProcess : personalProcess;
  const emailRequired = config.preferredChannel === 'email' || config.preferredChannel === 'both';

  return (
    <div className="min-h-screen bg-[#f7f5ef] pb-20 text-[#101936] lg:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <main>
        <section className="relative overflow-hidden bg-[#0d1934] px-4 pb-16 pt-28 text-white sm:pb-20 sm:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(10,132,111,0.34),transparent_34%),linear-gradient(120deg,transparent_55%,rgba(8,93,82,0.18))]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8cf0d3]">Thuê xe tự lái theo tháng · Hà Nội</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-6xl">Thuê xe tự lái theo tháng tại Hà Nội.<span className="mt-2 block text-[#93f2d5]">Cho công việc và cuộc sống.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Lựa chọn xe tháng cho công ty, cá nhân, gia đình và chuyên gia tại Hà Nội. Xem bảng giá niêm yết theo dòng xe, tự lập dự toán 1–12 tháng và nhận phương án tối ưu.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href="#monthly-audience" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#91f0d2] px-6 text-sm font-black text-[#0d1934] hover:bg-white">Chọn nhu cầu thuê tháng <ArrowRight className="h-4 w-4" /></a><a href="#monthly-pricing" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-black text-[#0d1934] hover:bg-[#eefaf6]">Xem bảng giá theo xe</a></div>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-slate-200">{['Xe tháng cho công ty & cá nhân', 'Thuê từ 1–12 tháng', 'Giá, cọc & điều kiện rõ ràng'].map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-2">✓ {item}</span>)}</div>
            </div>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#122446] shadow-2xl">
              {heroCar?.images[0] ? <img src={optimizedImageUrl(heroCar.images[0], 1100, 70)} srcSet={optimizedImageSrcSet(heroCar.images[0], [640, 960, 1280], 70)} sizes="(min-width: 1024px) 560px, 100vw" alt={`${displayVehicleName(heroCar.name)} (${heroCar.seats} chỗ, ${heroCar.fuel}) cho thuê theo tháng tại Hà Nội`} className="h-72 w-full object-cover sm:h-[390px]" width={1280} height={720} loading="eager" decoding="async" fetchPriority="high" /> : <div className="flex h-72 items-center justify-center sm:h-[390px]"><Car className="h-20 w-20 text-white/20" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071126] via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-white/60">Phương án xe tháng</p><p className="mt-1 text-xl font-black">Chủ động công việc. Rõ ngân sách.</p></div><span className="rounded-full border border-white/25 bg-[#071126]/65 px-3 py-2 text-xs font-black">01–12 tháng</span></div>
              <div className="absolute right-5 top-5 max-w-52 rounded-2xl bg-white p-4 text-[#101936] shadow-xl"><p className="text-[10px] font-black uppercase tracking-widest text-[#07856e]">Giá thuê tháng chỉ từ</p><p className="mt-1 text-lg font-black">{startingPrice ? `${formatPrice(startingPrice)}/tháng` : 'Liên hệ để nhận giá'}</p><p className="mt-1 text-xs leading-5 text-slate-500">Đơn giá tiêu chuẩn • Minh bạch theo từng dòng xe</p></div>
            </div>
          </div>
        </section>

        <section id="monthly-audience" className="scroll-mt-24 border-b border-slate-200 bg-white px-4 py-14">
          <div className="mx-auto max-w-7xl">
            <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">Chọn nhu cầu thuê xe</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Bạn muốn thuê xe theo tháng cho ai?</h2><p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-500">Chọn đúng đối tượng sử dụng để xem gợi ý dòng xe, bảng tính ngân sách và thủ tục thuê phù hợp nhất với bạn.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">{([
              ['business', Building2, 'Doanh nghiệp / Công ty', 'Xe nhân viên, công tác, công trình, phục vụ lãnh đạo và đội xe'],
              ['personal', Home, 'Cá nhân / Gia đình / Chuyên gia', 'Đi làm, đưa đón gia đình, lưu trú vài tháng hoặc cần xe tạm thời'],
            ] as const).map(([type, Icon, title, description]) => {
              const active = customerType === type;
              return <button key={type} type="button" aria-pressed={active} onClick={() => selectCustomerType(type)} className={`group flex min-h-28 items-start gap-4 rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-4 focus:ring-[#91f0d2]/45 ${active ? 'border-[#159c83] bg-[#effcf7]' : 'border-slate-200 bg-white hover:border-[#159c83]/50'}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e4f7f0] text-[#07856e]"><Icon className="h-5 w-5" /></span><span className="flex-1"><strong className="block text-lg font-black">{title}</strong><span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span><span className="mt-2 block text-xs font-black text-[#07856e]">{type === 'business' ? 'Lập phương án cho công ty' : 'Xem phương án thuê riêng'} →</span></span><span className="mt-1 text-[#07856e]">{active ? <Check className="h-5 w-5" /> : '○'}</span></button>;
            })}</div>
            <div className="mt-4 rounded-xl bg-[#e9f8f2] px-5 py-4 text-sm font-bold text-[#145d50]">{customerType === 'business' ? 'Phương án theo công việc doanh nghiệp — báo giá, hợp đồng và chứng từ được xác nhận theo cấu hình.' : 'Thuê xe riêng theo nhịp sống — không yêu cầu tên công ty hoặc mã số thuế.'}</div>
          </div>
        </section>

        <section className="bg-[#fbfaf6] px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:grid-cols-[1fr_0.55fr] sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">01 / Nhu cầu {customerType === 'business' ? 'doanh nghiệp' : 'cá nhân'}</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Công ty đang cần xe cho nhiệm vụ nào?' : 'Bạn cần xe tháng để làm gì?'}</h2></div><p className="text-sm leading-6 text-slate-500">Chọn tình huống sát nhất để nhận gợi ý nhóm xe. Bạn luôn có thể đổi xe và thời hạn thuê.</p></div>
            {(['business', 'personal'] as CustomerType[]).map((type) => <div key={type} hidden={customerType !== type} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{scenarioItems[type].map((item) => { const active = config.scenario === item.id; const Icon = item.icon; return <button key={item.id} type="button" aria-pressed={active} onClick={() => selectScenario(item.id)} className={`min-h-56 rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-4 focus:ring-[#91f0d2]/45 ${active ? 'border-[#159c83] bg-white shadow-lg' : 'border-slate-200 bg-white hover:border-[#159c83]/50'}`}><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf8f4]"><Icon className="h-5 w-5" /></span>{active && <Check className="h-5 w-5 text-[#07856e]" />}</div><h3 className="mt-7 font-black">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p><span className="mt-6 block text-xs font-black text-[#07856e]">Chọn nhu cầu →</span></button>; })}</div>)}
          </div>
        </section>

        <section id="monthly-builder" className="scroll-mt-24 bg-[#eef3ef] px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:grid-cols-[1fr_0.55fr] sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">02 / Cấu hình phương án</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Biết trước ngân sách. Gửi đúng yêu cầu báo giá.' : 'Chọn xe tháng. Ước tính chi phí dễ dàng.'}</h2></div><p className="text-sm leading-6 text-slate-500">Công cụ ước tính ngân sách dựa trên đơn giá thuê trọn tháng tiêu chuẩn của từng dòng xe.</p></div>
            <div className="mt-8 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#07856e]">Bước 01 / Nhu cầu sử dụng</p><h3 className="mt-1 text-xl font-black">Lập phương án xe tháng</h3></div><span className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold">Không cần đăng nhập</span></div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-sm font-bold">Mục đích sử dụng xe<select aria-label="Mục đích sử dụng xe" value={config.scenario} onChange={(event) => selectScenario(event.target.value as Scenario, false)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium">{activeScenarios.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
                  <label className="text-sm font-bold">Nhóm xe mong muốn<select aria-label="Nhóm xe mong muốn" value={config.vehicleGroup} onChange={(event) => updateConfig({ vehicleGroup: event.target.value as VehicleGroup, vehicleId: '' })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium">{Object.entries(groupLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="text-sm font-bold">Mẫu xe làm cơ sở<select aria-label="Mẫu xe làm cơ sở" value={config.vehicleId} onChange={(event) => updateConfig({ vehicleId: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium"><option value="">Tự chọn giá thấp nhất trong nhóm</option>{groupCars.map((car) => <option key={car.id} value={car.id}>{displayVehicleName(car.name)} — {car.priceMonth ? `${formatPrice(car.priceMonth)}/tháng` : 'Cần tư vấn giá tháng'}</option>)}</select></label>
                  {customerType === 'business' && <label className="text-sm font-bold">Số lượng xe<input aria-label="Số lượng xe" type="number" min={1} max={50} value={config.quantity} onChange={(event) => updateConfig({ quantity: Math.max(1, Number(event.target.value) || 1) })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-medium" /></label>}
                  <label className="text-sm font-bold">Thời hạn thuê<select aria-label="Thời hạn thuê" value={config.months} onChange={(event) => updateConfig({ months: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium">{[1, 3, 6, 12].map((months) => <option key={months} value={months}>{String(months).padStart(2, '0')} tháng</option>)}</select></label>
                  <label className="text-sm font-bold">Km dự kiến / xe / tháng<input aria-label="Km dự kiến mỗi xe mỗi tháng" type="text" value="4.000 km" readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700" /></label>
                  <label className="text-sm font-bold">Địa điểm bàn giao<input aria-label="Địa điểm bàn giao" value={config.deliveryArea} onChange={(event) => updateConfig({ deliveryArea: event.target.value })} placeholder={customerType === 'business' ? 'Văn phòng / công trình tại Hà Nội' : 'Khu đô thị / chung cư tại Hà Nội'} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-medium" /></label>
                  <label className="sm:col-span-2 text-sm font-bold">Yêu cầu riêng (không bắt buộc)<textarea aria-label="Yêu cầu riêng" rows={3} value={config.notes} onChange={(event) => updateConfig({ notes: event.target.value })} placeholder="Lịch dùng, đi tỉnh, địa điểm giao nhận, yêu cầu thay xe khi bảo dưỡng…" className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 font-medium" /></label>
                </div>
                <div className="mt-5 space-y-3 text-sm"><label className="flex items-start gap-3"><input type="checkbox" checked={config.invoiceRequired} onChange={(event) => updateConfig({ invoiceRequired: event.target.checked })} className="mt-1 accent-[#07856e]" /><span>{customerType === 'business' ? 'Cần hóa đơn VAT 8%/chứng từ theo thông tin doanh nghiệp.' : 'Cần hóa đơn VAT 8% (nếu có nhu cầu).'}</span></label>{customerType === 'business' && <label className="flex items-start gap-3"><input type="checkbox" checked={config.formalQuoteRequired} onChange={(event) => updateConfig({ formalQuoteRequired: event.target.checked })} className="mt-1 accent-[#07856e]" /><span>Cần báo giá chính thức có điều khoản để trình quản lý phê duyệt.</span></label>}</div>
              </div>

              <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="bg-[#101936] p-6 text-white"><p className="text-[10px] font-black uppercase tracking-widest text-[#91f0d2]">Bước 02 / Xem bản tóm tắt</p><span className="mt-3 inline-block rounded bg-white/10 px-2 py-1 text-xs font-bold text-[#91f0d2]">{customerType === 'business' ? 'Doanh nghiệp / Công ty' : 'Cá nhân / Gia đình / Chuyên gia'}</span><h3 className="mt-3 text-2xl font-black">{customerType === 'business' ? 'Phương án để trình duyệt' : 'Phương án thuê xe của bạn'}</h3></div>
                <div className="p-6"><dl className="space-y-3 text-sm">{[['Mục đích sử dụng', scenarioLabels[config.scenario]], ['Nhóm xe', groupLabels[config.vehicleGroup]], ['Mẫu xe cơ sở', selectedCar ? displayVehicleName(selectedCar.name) : 'Cần chuyên viên tư vấn'], ['Số xe / thời hạn', `${String(config.quantity).padStart(2, '0')} xe · ${String(config.months).padStart(2, '0')} tháng`], ['Km dự kiến', `${config.expectedKm.toLocaleString('vi-VN')} km/xe/tháng`], ['VAT', config.invoiceRequired ? '8%' : 'Không yêu cầu']].map(([term, value]) => <div key={term} className="flex justify-between gap-5 border-b border-slate-100 pb-3"><dt className="text-slate-500">{term}</dt><dd className="text-right font-bold">{value}</dd></div>)}</dl>
                  <div className="mt-5 rounded-2xl bg-[#e8f7f0] p-5"><p className="text-xs font-bold text-[#317466]">Ngân sách thuê cơ sở</p><p className="mt-1 text-3xl font-black text-[#087462]">{formatBudget(baseBudget)}</p><p className="mt-2 text-xs leading-5 text-[#47776f]">{baseMonthlyPrice ? `${formatPrice(baseMonthlyPrice)}/xe/tháng × ${config.quantity} xe × ${config.months} tháng.` : 'Chưa có đơn giá tháng cho nhóm xe này.'} Chưa gồm các khoản cần báo riêng.</p></div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500"><span className="rounded bg-slate-100 px-2 py-1">Đơn giá tiêu chuẩn</span><span className="rounded bg-slate-100 px-2 py-1">Chưa trừ ưu đãi dài hạn</span><span className="rounded bg-slate-100 px-2 py-1">Chưa gồm VAT 8%</span></div>
                  <a href="#monthly-lead-form" onClick={() => trackEvent('monthly_quote_preview', { customer_type: customerType, vehicle_group: config.vehicleGroup })} className="mt-5 flex min-h-12 items-center justify-center rounded-xl bg-[#101936] px-4 text-center text-sm font-black text-white">{customerType === 'business' ? 'Yêu cầu báo giá doanh nghiệp' : 'Kiểm tra giá & gửi yêu cầu thuê tháng'} ↗</a>
                  <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={copySummary} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold"><Copy className="h-4 w-4" /> Sao chép tóm tắt</button><button type="button" onClick={handlePrint} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold"><Printer className="h-4 w-4" /> In phiếu A4</button></div><p className="mt-4 text-xs leading-5 text-slate-500">Số liệu tóm tắt phục vụ tham khảo ngân sách và trình duyệt nội bộ.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="monthly-pricing" className="scroll-mt-24 bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:grid-cols-[1fr_0.55fr] sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">03 / Đội xe và giá tháng</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Bảng giá thuê xe tự lái theo tháng tại Hà Nội</h2></div><p className="text-sm leading-6 text-slate-500">Đơn giá niêm yết theo từng mẫu xe tại Hà Nội, đồng bộ trực tiếp với công cụ lập dự toán bên trên.</p></div>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm" role="region" aria-label="Bảng giá thuê xe theo tháng" tabIndex={0}><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#10483f] text-white"><tr><th className="px-5 py-4">Mẫu xe</th><th className="px-5 py-4">Nhóm xe</th><th className="px-5 py-4">Giá trọn tháng</th><th className="px-5 py-4">Km & cọc</th><th className="px-5 py-4">Điều kiện</th></tr></thead><tbody className="divide-y divide-slate-200">{pricingTableCars.length > 0 ? pricingTableCars.map((car) => { const deposit = monthlyDepositForCar(car); const hasApprovedMonthlyPrice = Boolean(car.priceMonth && car.priceMonth > 0); return <tr key={car.id} className={hasApprovedMonthlyPrice ? 'odd:bg-white even:bg-[#f5f8f6]' : 'bg-[#fffaf0]'}><td className="px-5 py-4 font-black">{displayVehicleName(car.name)}</td><td className="px-5 py-4">{groupLabels[groupForCar(car)]}</td><td className="px-5 py-4 font-black text-[#07856e]">{hasApprovedMonthlyPrice ? `${formatPrice(car.priceMonth || 0)}/tháng` : 'Liên hệ'}</td><td className="px-5 py-4 text-slate-600"><span>4.000 km/tháng • {deposit ? `Cọc ${formatPrice(deposit)}` : 'Liên hệ'}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-x-4 gap-y-2"><Link to={`/xe/${car.slug}`} className="font-bold text-[#07856e] hover:underline">Xem xe →</Link><button type="button" onClick={() => chooseCarForEstimate(car)} className="font-black text-[#101936] hover:text-[#07856e] hover:underline">{hasApprovedMonthlyPrice ? 'Chọn tính dự toán ↑' : 'Chọn để tư vấn ↑'}</button></div></td></tr>; }) : <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Chưa tải được danh sách xe tháng. Vui lòng gửi yêu cầu để chuyên viên Car Match hỗ trợ.</td></tr>}</tbody></table></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">Đơn giá niêm yết áp dụng cho gói thuê tự lái trọn 30 ngày, định mức 4.000 km/xe/tháng và chưa bao gồm VAT 8%. Các dòng ghi “Liên hệ” chưa có giá tháng hoặc mức cọc được duyệt; Car Match sẽ kiểm tra lịch, giá và cọc trước khi gửi báo giá chính thức.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featuredCars.map((car) => <article key={car.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{car.images[0] ? <img src={optimizedImageUrl(car.images[0], 640, 68)} alt={`${displayVehicleName(car.name)} giá thuê theo tháng`} width={640} height={360} loading="lazy" decoding="async" className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-slate-100"><Car className="h-10 w-10 text-slate-300" /></div>}<div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-wider text-[#07856e]">{groupLabels[groupForCar(car)]}</p><span className="rounded-full bg-[#edf8f4] px-2.5 py-1 text-[10px] font-black text-[#087462]">Phù hợp thuê tháng</span></div><h3 className="mt-2 text-lg font-black">{displayVehicleName(car.name)}</h3><p className="mt-2 text-sm text-slate-500">{car.seats} chỗ · {car.fuel} · {car.transmission}</p><p className="mt-5 border-t border-slate-100 pt-4 font-black text-[#07856e]">{formatPrice(car.priceMonth || 0)}/tháng</p><button type="button" onClick={() => chooseCarForEstimate(car)} className="mt-3 text-sm font-black text-[#101936] hover:text-[#07856e]">Chọn tính dự toán ↑</button></div></article>)}</div>
          </div>
        </section>

        <section className="bg-[#eaf3ef] px-4 py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">04 / Xe điện & ngân sách nhiên liệu</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Chạy nhiều km mỗi tháng? Hãy so chi phí xăng.' : 'Đi lại thường xuyên? Thử tính chi phí xăng.'}</h2><p className="mt-5 max-w-xl leading-7 text-slate-600">Nhập số km, mức tiêu hao và giá xăng để hình dung ngân sách xăng của xe tương đương. Đây không phải khoản tiết kiệm ròng và không tự cộng chi phí sạc ngoài hợp đồng.</p><div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><Zap className="h-6 w-6 text-[#07856e]" /><p className="mt-3 font-black">Xe điện cho hành trình đều đặn</p><p className="mt-2 text-sm leading-6 text-slate-500">So giá thuê, phạm vi sạc, thời gian dừng và lịch đi tỉnh — không chỉ tiền xăng.</p><Link to="/thue-xe-dien-ha-noi" className="mt-3 inline-block text-sm font-black text-[#07856e]">Xem xe điện tự lái →</Link></div></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-black">Tính nhanh cho 1 xe / tháng</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Quãng đường (km/tháng)<input type="number" min={0} value={gasCalculator.km} onChange={(event) => setGasCalculator((current) => ({ ...current, km: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-xs font-bold">Xe xăng (lít/100 km)<input type="number" min={0} step="0.1" value={gasCalculator.consumption} onChange={(event) => setGasCalculator((current) => ({ ...current, consumption: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-xs font-bold sm:col-span-2">Giá xăng giả định (đồng/lít)<input type="number" min={0} step={100} value={gasCalculator.price} onChange={(event) => setGasCalculator((current) => ({ ...current, price: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label></div><div className="mt-5 rounded-2xl bg-[#e7f7ef] p-5"><p className="text-xs text-slate-500">Ngân sách xăng tham khảo của xe xăng tương đương</p><p className="mt-2 text-3xl font-black text-[#087462]">{formatPrice(Math.round(fuelBudget))}/tháng</p><p className="mt-4 border-t border-[#b9e5d6] pt-4 text-sm font-bold leading-6 text-[#145d50]">💡 Với mức di chuyển này, riêng chi phí đổ xăng mỗi tháng đã tương đương {fuelToVf3Percent}% tiền thuê trọn tháng một chiếc VinFast VF3 ({formatPrice(vf3MonthlyPrice)}/tháng). Chuyển sang thuê xe điện có thể giúp tối ưu đáng kể ngân sách vận hành.</p></div><p className="mt-4 text-xs leading-5 text-slate-500">Không phải mức tiết kiệm ròng. Cần cộng chênh lệch tiền thuê xe, phí cầu đường, sạc ngoài phạm vi chính sách và thời gian dừng sạc nếu có.</p></div>
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">05 / Điều kiện thuê dài hạn</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Thuê lâu hơn. Thương lượng một phương án rõ hơn.' : 'Thuê theo tháng dễ hiểu. Chọn xe đúng nhu cầu.'}</h2>
            <div hidden={customerType !== 'business'} className="mt-8 grid gap-4 md:grid-cols-3"><InfoCard kicker="01–02 tháng" title="Thử nghiệm / dự án ngắn" text="Xem giá, cọc, gói km, thời gian giao xe và điều kiện đổi xe." /><InfoCard dark kicker="03–06 tháng" title="Gói doanh nghiệp" text="Có thể đề xuất đơn giá tốt hơn theo số tháng và số lượng; không tự áp chiết khấu." /><InfoCard kicker="06–12 tháng / nhiều xe" title="Đội xe theo dự án" text="Đàm phán đối soát, phụ lục người lái và thanh toán theo kỳ." /></div>
            <div hidden={customerType !== 'personal'} className="mt-8 grid gap-4 md:grid-cols-3"><InfoCard kicker="01–02 tháng" title="Cần xe ngay trong thời gian ngắn" text="Cho công việc, gia đình hoặc chờ xe riêng. Xem giá, cọc và khả năng gia hạn." /><InfoCard dark kicker="03–06 tháng" title="Đi làm hoặc lưu trú dài hạn" text="Chọn xe theo quãng đường mỗi tháng, nơi đỗ và khu vực nhận xe." /><InfoCard kicker="Gia đình / chuyên gia" title="Chọn xe theo người sử dụng" text="Cân nhắc chỗ ngồi, người lái đủ điều kiện và nhu cầu đi tỉnh." /></div>
            <div className="mt-12 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#10483f] text-white"><tr><th className="px-5 py-4">Tiêu chí</th><th className="px-5 py-4">Thuê xe tháng</th><th className="px-5 py-4">Tự mua xe</th><th className="px-5 py-4">Gọi xe theo chuyến</th></tr></thead><tbody className="divide-y divide-slate-200">{[['Vốn ban đầu', 'Cọc và kỳ thuê theo thỏa thuận', 'Vốn mua hoặc khoản trả trước', 'Không cần mua xe'], ['Kiểm soát ngân sách', 'Tiền thuê theo hợp đồng; phát sinh đối soát', 'Khấu hao, bảo dưỡng, bảo hiểm', 'Chi phí theo từng chuyến'], ['Mức linh hoạt', 'Phù hợp nhu cầu có thời hạn', 'Sở hữu lâu dài, chịu rủi ro tài sản', 'Phù hợp nhu cầu không thường xuyên']].map((row) => <tr key={row[0]} className="odd:bg-white even:bg-[#f5f8f6]">{row.map((cell, index) => <td key={cell} className={`px-5 py-4 ${index === 0 ? 'font-black' : 'text-slate-600'}`}>{cell}</td>)}</tr>)}</tbody></table></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[#b9e5d6] bg-[#effaf6] p-5"><Wrench className="h-6 w-6 text-[#07856e]" /><h3 className="mt-4 font-black">Bảo dưỡng theo phạm vi hợp đồng</h3><p className="mt-2 text-sm leading-6 text-slate-600">Lịch bảo dưỡng định kỳ, đăng kiểm và bảo hiểm bắt buộc được phân định rõ trong báo giá và hợp đồng của từng phương án.</p></article>
              <article className="rounded-2xl border border-[#b9e5d6] bg-[#effaf6] p-5"><Car className="h-6 w-6 text-[#07856e]" /><h3 className="mt-4 font-black">Phương án xe thay thế</h3><p className="mt-2 text-sm leading-6 text-slate-600">Có thể thỏa thuận phương án bố trí xe tương đương khi xe cần nằm xưởng, tùy nguyên nhân, lịch xe và điều kiện hợp đồng.</p></article>
              <article className="rounded-2xl border border-[#b9e5d6] bg-[#effaf6] p-5"><RefreshCw className="h-6 w-6 text-[#07856e]" /><h3 className="mt-4 font-black">Linh hoạt đổi dòng xe theo kỳ</h3><p className="mt-2 text-sm leading-6 text-slate-600">Có thể đề nghị nâng cấp hoặc chuyển đổi mẫu xe ở kỳ tiếp theo khi nhu cầu thay đổi, tùy lịch xe và phụ lục được xác nhận.</p></article>
            </div>
          </div>
        </section>

        <section className={`${customerType === 'business' ? 'bg-[#0d1934] text-white' : 'bg-[#f0f5f2]'} px-4 py-16`}>
          <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#20a98e]">06 / {customerType === 'business' ? 'Hồ sơ để trình duyệt' : 'Chuẩn bị thuê xe'}</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Báo giá không chỉ có một con số.' : 'Trước khi nhận xe bạn cần biết gì?'}</h2><p className={`mt-5 leading-7 ${customerType === 'business' ? 'text-slate-300' : 'text-slate-600'}`}>{customerType === 'business' ? 'Người duyệt cần nhìn thấy chi phí, phạm vi phục vụ, điều kiện vận hành, VAT và chứng từ. Phiếu A4 chỉ là tóm tắt dự toán để tham khảo nội bộ.' : 'Không cần thông tin doanh nghiệp. Car Match trao đổi rõ giấy tờ, tiền cọc, điều kiện sử dụng, giao nhận và gia hạn.'}</p><button type="button" onClick={handlePrint} className={`mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-black ${customerType === 'business' ? 'bg-[#91f0d2] text-[#0d1934]' : 'bg-[#101936] text-white'}`}><Printer className="h-4 w-4" /> {customerType === 'business' ? 'In phiếu đề xuất A4' : 'In phiếu tóm tắt A4'}</button></div>
            <div hidden={customerType !== 'business'} className="grid gap-4 sm:grid-cols-2">{['Danh sách mẫu xe, số lượng', 'Ngày nhận và số tháng thuê', 'Đơn giá và ưu đãi áp dụng', 'Định mức km và phí vượt', 'Hợp đồng, hóa đơn điện tử GTGT', 'Cọc, thanh toán, công nợ', 'Phụ lục người lái đủ điều kiện', 'Bảo dưỡng, VETC, phạt nguội'].map((item) => <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#91f0d2]" /><span>{item}</span></div>)}</div>
            <div hidden={customerType !== 'personal'} className="grid gap-4 sm:grid-cols-2"><InfoCard kicker="01" title="Giấy tờ người thuê" text="CCCD, giấy phép lái xe và thông tin người trực tiếp lái theo điều kiện áp dụng." /><InfoCard kicker="02" title="Tiền thuê & khoản cọc" text="Tách rõ tiền thuê, tiền cọc và tài sản bảo đảm; xác nhận hoàn trả, khấu trừ khi có phát sinh." /><InfoCard kicker="03" title="Số km & đi tỉnh" text="Chọn định mức km/tháng theo lộ trình và xác nhận phụ phí vượt km nếu có." /><InfoCard kicker="04" title="Giao nhận & gia hạn" text="Hẹn điểm nhận tại Hà Nội, xem lịch gia hạn và trách nhiệm khi phát sinh sự cố." /></div>
          </div>
        </section>

        <section className="bg-[#fbfaf6] px-4 py-16"><div className="mx-auto max-w-7xl"><div className="grid gap-4 sm:grid-cols-[1fr_0.55fr] sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">07 / Quy trình theo nhóm khách</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Rõ người duyệt. Rõ điều kiện sử dụng.' : 'Gửi nhu cầu nhanh. Nhận xe đúng hẹn.'}</h2></div><p className="text-sm leading-6 text-slate-500">Ngay khi tiếp nhận yêu cầu, chuyên viên Car Match sẽ kiểm tra lịch xe thực tế và phản hồi phương án chi tiết qua kênh bạn đã chọn.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{processSteps.map(([kicker, title, text]) => <div key={kicker} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[#07856e]">{kicker}</p><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}</div></div></section>

        <section className="bg-white px-4 py-16"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#07856e]">08 / Giải đáp {customerType === 'business' ? 'doanh nghiệp' : 'khách cá nhân'}</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{customerType === 'business' ? 'Điều cần làm rõ trước khi trình ký.' : 'Thuê xe tháng: bạn cần biết gì?'}</h2><p className="mt-5 leading-7 text-slate-500">VAT 8%, cọc, định mức 4.000 km/tháng, giao nhận và ưu đãi đều được đối chiếu theo phương án thực tế.</p></div><div>{(['business', 'personal'] as CustomerType[]).map((type) => <div key={type} hidden={customerType !== type}>{(type === 'business' ? businessFaqs : personalFaqs).map((faq) => <details key={faq.question} className="group border-b border-slate-200 py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black"><span>{faq.question}</span><span className="text-xl text-[#07856e] group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{faq.answer}</p></details>)}</div>)}</div></div></section>

        <section id="monthly-lead-form" className="scroll-mt-24 bg-[#eaf3ef] px-4 py-16">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.88fr_1.12fr]">
            <div className="bg-[#101936] p-7 text-white sm:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#91f0d2]">09 / Nhận báo giá chi tiết</p><h2 className="mt-5 text-3xl font-black tracking-[-0.035em]">{customerType === 'business' ? 'Nhận báo giá để trình quản lý.' : 'Chọn xe tháng phù hợp với bạn.'}</h2><p className="mt-5 leading-7 text-slate-300">{customerType === 'business' ? 'Gửi một yêu cầu, nhận phương án thuê theo công việc. Car Match kiểm tra xe, giá và chuẩn bị các điều kiện để doanh nghiệp đối chiếu.' : 'Để lại nhu cầu và số điện thoại. Car Match kiểm tra mẫu xe, lịch, giá tháng và điều kiện để bạn cân nhắc trước khi thuê.'}</p><ul className="mt-8 space-y-4 text-sm text-slate-200">{['Chọn nhóm xe, số tháng và km dự kiến', 'Kiểm tra xe và giá thuê tháng', 'Tách rõ cọc, VAT, phí và điều kiện', 'Nhận báo giá chính thức & giữ lịch xe thực tế từ chuyên viên'].map((item) => <li key={item} className="flex gap-3"><Check className="h-5 w-5 shrink-0 text-[#91f0d2]" />{item}</li>)}</ul></div>
            <form onSubmit={handleSubmit} className="p-6 sm:p-9">
              <h3 className="text-2xl font-black">{customerType === 'business' ? 'Nhận phương án báo giá cho công ty' : 'Gửi yêu cầu thuê xe theo tháng'}</h3><p className="mt-2 text-sm text-slate-500">{customerType === 'business' ? 'Nhập thông tin công ty và người phụ trách.' : 'Chỉ cần thông tin liên hệ và khu vực nhận xe; không cần tên công ty hay mã số thuế.'}</p>
              <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#b9e5d6] bg-[#effaf6] p-4 text-sm"><span><small className="block text-slate-500">Phương án đang chọn</small><strong className="text-[#087462]">{customerType === 'business' ? 'Doanh nghiệp / Công ty' : 'Cá nhân / Gia đình / Chuyên gia'}</strong></span><a href="#monthly-audience" className="rounded-lg bg-white px-3 py-2 text-xs font-black text-[#07856e] shadow-sm">Đổi nhu cầu ↗</a></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {customerType === 'business' && <><label className="text-sm font-bold sm:col-span-2">Tên doanh nghiệp *<input required value={contact.companyName} onChange={(event) => setContact((current) => ({ ...current, companyName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="VD: Công ty TNHH ABC" /></label><label className="text-sm font-bold">Mã số thuế (không bắt buộc)<input value={contact.taxCode} onChange={(event) => setContact((current) => ({ ...current, taxCode: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Để trao đổi về hóa đơn" /></label></>}
                <label className="text-sm font-bold">{customerType === 'business' ? 'Người phụ trách *' : 'Họ tên người thuê *'}<input required value={contact.contactName} onChange={(event) => setContact((current) => ({ ...current, contactName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="VD: Nguyễn Văn Minh" /></label>
                <label className="text-sm font-bold">Số điện thoại *<input required type="tel" minLength={8} value={contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="09xx xxx xxx" /></label>
                <label className="text-sm font-bold">Email {emailRequired ? '*' : '(không bắt buộc khi chọn Zalo)'}<input required={emailRequired} type="email" value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder={customerType === 'business' ? 'ten@congty.vn' : 'nguyenvanminh@gmail.com'} /></label>
                <label className="text-sm font-bold sm:col-span-2">Khu vực nhận xe dự kiến<input value={config.deliveryArea} onChange={(event) => updateConfig({ deliveryArea: event.target.value }, false)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="VD: Cầu Giấy, Ocean Park, Hà Nội" /></label>
              </div>
              <fieldset className="mt-5"><legend className="text-sm font-bold">Bạn muốn nhận báo giá qua đâu?</legend><div className="mt-3 flex flex-wrap gap-3">{(['zalo', 'email', 'both'] as PreferredChannel[]).map((channel) => <label key={channel} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold ${config.preferredChannel === channel ? 'border-[#159c83] bg-[#e9f8f2] text-[#087462]' : 'border-slate-200'}`}><input type="radio" name="preferred-channel" value={channel} checked={config.preferredChannel === channel} onChange={() => updateConfig({ preferredChannel: channel })} className="mr-2 accent-[#07856e]" />{channel === 'both' ? 'Cả hai' : channel === 'email' ? 'Email' : 'Zalo'}</label>)}</div></fieldset>
              {customerType === 'business' && <label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={config.contractSampleRequested} onChange={(event) => updateConfig({ contractSampleRequested: event.target.checked })} className="mt-1 accent-[#07856e]" /><span>Đề nghị gửi dự thảo hợp đồng phù hợp với phương án thuê.</span></label>}
              {submitState.status === 'error' && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{submitState.message} Dữ liệu bạn nhập vẫn được giữ nguyên.</div>}
              {submitState.status === 'success' && <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><strong className="block">Yêu cầu đã được tiếp nhận.</strong><span className="mt-1 block">{submitState.message} Mã yêu cầu: <b>{submitState.requestId}</b>.</span></div>}
              <button type="submit" disabled={submitState.status === 'loading' || submitState.status === 'success'} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#101936] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" />{submitState.status === 'loading' ? 'Đang gửi yêu cầu…' : submitState.status === 'success' ? 'Đã gửi yêu cầu' : 'Gửi yêu cầu báo giá'}</button>
              <div className="mt-3 grid gap-3 sm:grid-cols-2"><a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" onClick={() => { trackEvent('monthly_zalo_click', { customer_type: customerType, source: 'monthly_form' }); trackZaloClick('monthly_form', { customer_type: customerType }); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold"><MessageCircle className="h-4 w-4" /> Mở Zalo 0971 163 290</a><a href="mailto:info@carmatch.vn" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold"><Mail className="h-4 w-4" /> info@carmatch.vn</a></div>
              <p className="mt-5 text-xs leading-5 text-slate-500">Hệ thống sẽ cấp mã tiếp nhận ngay sau khi gửi. Chuyên viên Car Match sẽ đối chiếu lịch xe và gửi báo giá chính thức, kèm dự thảo hợp đồng nếu phù hợp, qua Zalo hoặc Email của bạn.</p>
            </form>
          </div>
        </section>

        <section className="bg-white px-4 py-12"><div className="mx-auto max-w-7xl"><h2 className="text-xl font-black">Tìm hiểu thêm trước khi thuê xe tháng</h2><div className="mt-5 flex flex-wrap gap-3">{monthlyGuides.map(([to, label]) => <Link key={to} to={to} className="rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-2 text-sm font-bold hover:border-[#159c83]">{label}</Link>)}<Link to="/xe" className="rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-2 text-sm font-bold">Danh sách xe</Link><Link to="/thue-xe-7-cho-tu-lai-ha-noi" className="rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-2 text-sm font-bold">Xe 7 chỗ</Link><Link to="/chinh-sach" className="rounded-full border border-slate-200 bg-[#fbfaf6] px-4 py-2 text-sm font-bold">Giấy tờ & điều kiện</Link></div></div></section>
      </main>

      <div id="monthly-print-sheet" aria-hidden="true" className="hidden">
        <div className="flex items-start justify-between border-b-2 border-[#101936] pb-5"><div><p className="text-sm font-black text-[#07856e]">CAR MATCH · MONTHLY RENTAL</p><h2 className="mt-2 text-2xl font-black">{customerType === 'business' ? 'PHIẾU ĐỀ XUẤT PHƯƠNG ÁN THUÊ XE' : 'PHIẾU TÓM TẮT NHU CẦU THUÊ XE THÁNG'}</h2></div><span className="border border-[#07856e] px-3 py-2 text-xs font-black text-[#07856e]">DỰ TOÁN THAM KHẢO</span></div>
        <p className="mt-4 text-sm leading-6">Phiếu tự lập từ nhu cầu đã chọn, không phải báo giá, hợp đồng hay hóa đơn chính thức. Mọi giá, xe, VAT, cọc và điều kiện cần được Car Match xác nhận.</p>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">{customerType === 'business' && <><dt className="font-bold">Khách hàng</dt><dd>{contact.companyName || 'Chưa nhập'}</dd></>}<dt className="font-bold">Người liên hệ</dt><dd>{contact.contactName || 'Chưa nhập'} · {contact.phone || 'Chưa nhập'}</dd><dt className="font-bold">Mục đích</dt><dd>{scenarioLabels[config.scenario]}</dd><dt className="font-bold">Phương án xe</dt><dd>{selectedCar ? displayVehicleName(selectedCar.name) : groupLabels[config.vehicleGroup]}</dd><dt className="font-bold">Số xe / thời hạn</dt><dd>{config.quantity} xe · {config.months} tháng</dd><dt className="font-bold">Km dự kiến</dt><dd>{config.expectedKm.toLocaleString('vi-VN')} km/xe/tháng</dd><dt className="font-bold">VAT</dt><dd>{config.invoiceRequired ? '8%' : 'Không yêu cầu'}</dd><dt className="font-bold">Nơi nhận</dt><dd>{config.deliveryArea || 'Chưa nhập'}</dd><dt className="font-bold">Ngân sách thuê cơ sở</dt><dd className="font-black text-[#07856e]">{formatBudget(baseBudget)}</dd></dl>
        <div className="mt-6 rounded-xl bg-[#eef8f4] p-5"><h2 className="font-black">Cần xác nhận trước khi thuê</h2><ul className="mt-3 grid grid-cols-2 gap-2 text-sm"><li>• Xe và lịch thực tế</li><li>• Phí vượt 4.000 km</li><li>• Khoản cọc theo dòng xe</li><li>• VAT 8%/chứng từ</li><li>• Giao nhận và đi tỉnh</li><li>• Ưu đãi dài hạn nếu có</li></ul></div>
        {customerType === 'business' ? <div className="mt-10 grid grid-cols-2 gap-16 text-center text-sm"><div className="border-t border-slate-400 pt-3 font-bold">Người lập phương án</div><div className="border-t border-slate-400 pt-3 font-bold">Người phê duyệt</div></div> : <div className="mt-8 rounded-xl border border-slate-200 p-5 text-sm"><strong>Liên hệ Car Match:</strong> Zalo/Điện thoại 0971 163 290 · info@carmatch.vn</div>}
        <p className="absolute bottom-8 left-10 right-10 border-t border-slate-200 pt-3 text-center text-xs text-slate-500">Car Match · Thuê xe tự lái theo tháng tại Hà Nội · Phiếu dự toán tham khảo</p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-2 gap-3"><a href="#monthly-lead-form" className="flex min-h-11 items-center justify-center rounded-xl bg-[#101936] text-sm font-black text-white">Gửi yêu cầu</a><a href={PHONE_LINK} onClick={() => { trackEvent('monthly_phone_click', { customer_type: customerType, source: 'monthly_sticky' }); trackPhoneClick('monthly_sticky', { customer_type: customerType }); }} className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-black">Gọi 0971 163 290</a></div></div>
      <Footer />
    </div>
  );
}

function InfoCard({ kicker, title, text, dark = false }: { kicker: string; title: string; text: string; dark?: boolean }) {
  return <article className={`rounded-2xl border p-6 ${dark ? 'border-[#10483f] bg-[#10483f] text-white' : 'border-slate-200 bg-[#f5f8f6]'}`}><p className={`text-xs font-black uppercase tracking-wider ${dark ? 'text-[#91f0d2]' : 'text-[#07856e]'}`}>{kicker}</p><h3 className="mt-4 text-lg font-black">{title}</h3><p className={`mt-3 text-sm leading-6 ${dark ? 'text-white/75' : 'text-slate-600'}`}>{text}</p></article>;
}
