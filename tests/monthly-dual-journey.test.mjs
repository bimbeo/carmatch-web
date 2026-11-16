import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  buildMonthlyLeadInsert,
  monthlyRequestRef,
  validateMonthlyLead,
} from '../api/_monthly-lead.js';

const PAGE_PATH = new URL('../src/app/pages/B2B.tsx', import.meta.url);
const ANALYTICS_PATH = new URL('../src/lib/analytics.ts', import.meta.url);
const CONVERSION_API_PATH = new URL('../api/_conversion.js', import.meta.url);

function payload(overrides = {}) {
  return {
    form_type: 'monthly_business_lead',
    customer_type: 'business',
    scenario: 'sales',
    vehicle_group: 'city',
    vehicle_id: null,
    quantity: '1',
    duration: '1',
    car_model: 'VinFast VF5',
    building: 'Cầu Giấy',
    expected_km_per_vehicle_month: 4000,
    days_plan: '30',
    operation_mode: 'self',
    invoice_required: true,
    formal_quote_required: true,
    company_name: 'Công ty ABC',
    tax_code: '',
    name: 'Nguyễn Văn A',
    phone: '0912345678',
    email: 'a@example.com',
    preferred_contact_channel: 'both',
    contract_sample_requested: false,
    source_page: '/thue-xe-thang',
    note: 'Cần xe đầu tháng',
    ...overrides,
  };
}

test('monthly lead validation separates business and personal requirements', () => {
  const key = 'monthly:12345678-1234-1234-1234-123456789012';
  assert.equal(validateMonthlyLead(payload(), key), null);
  assert.equal(validateMonthlyLead(payload({ company_name: '' }), key), 'missing_company_name');

  const personal = payload({
    form_type: 'monthly_personal_lead',
    customer_type: 'personal',
    scenario: 'family',
    company_name: undefined,
    tax_code: undefined,
    email: undefined,
    preferred_contact_channel: 'zalo',
    invoice_required: false,
    formal_quote_required: false,
  });
  assert.equal(validateMonthlyLead(personal, key), null);
  assert.equal(validateMonthlyLead({ ...personal, preferred_contact_channel: 'email' }, key), 'invalid_email');
  assert.equal(validateMonthlyLead({ ...personal, operation_mode: 'driver' }, key), 'invalid_operation_mode');
  assert.equal(validateMonthlyLead({ ...personal, days_plan: '22' }, key), 'invalid_days_plan');
  assert.equal(validateMonthlyLead({ ...personal, expected_km_per_vehicle_month: 2500 }, key), 'invalid_expected_km');
});

test('monthly lead idempotency is deterministic and maps only supported CRM columns', () => {
  const key = 'monthly:12345678-1234-1234-1234-123456789012';
  const requestRef = monthlyRequestRef(key);
  assert.equal(requestRef, monthlyRequestRef(key));
  assert.match(requestRef, /^CMTH-[A-F0-9]{12}$/);

  const insert = buildMonthlyLeadInsert(payload(), requestRef);
  assert.equal(insert.form_type, 'monthly_business_lead');
  assert.equal(insert.customer_type, 'business');
  assert.equal(insert.booking_ref, requestRef);
  assert.match(insert.note, /Kênh liên hệ: both/);
  assert.match(insert.note, /Doanh nghiệp: Công ty ABC/);
  assert.match(insert.note, /Km giới hạn: 4000 km\/xe\/tháng/);
  assert.match(insert.note, /VAT: 8% - có yêu cầu hóa đơn/);
  assert.deepEqual(Object.keys(insert).sort(), [
    'booking_ref', 'building', 'car_model', 'customer_type', 'duration', 'form_type',
    'name', 'note', 'phone', 'quantity', 'source',
  ].sort());
});

test('dual journey uses one audience state, two retained configs and no duplicate audience radio in form', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');
  assert.match(source, /useState<CustomerType>\('business'\)/);
  assert.match(source, /Record<CustomerType, AudienceConfig>/);
  assert.match(source, /initializedAudience/);
  assert.match(source, /monthly_business_lead/);
  assert.match(source, /monthly_personal_lead/);
  assert.match(source, /idempotencyRef/);
  assert.match(source, /Phương án đang chọn/);
  assert.doesNotMatch(source, /name="customer_type"/);
});

test('monthly analytics events are first-party allowlisted without PII fields', async () => {
  const [page, analytics, conversionApi] = await Promise.all([
    readFile(PAGE_PATH, 'utf8'),
    readFile(ANALYTICS_PATH, 'utf8'),
    readFile(CONVERSION_API_PATH, 'utf8'),
  ]);
  for (const event of [
    'monthly_audience_selected', 'monthly_scenario_selected', 'monthly_config_started',
    'monthly_config_changed', 'monthly_quote_preview', 'monthly_print_a4',
    'monthly_vehicle_selected_from_pricing',
    'monthly_quote_submit_attempt', 'monthly_quote_submit_success', 'monthly_quote_submit_error',
    'monthly_zalo_click', 'monthly_phone_click',
  ]) {
    assert.match(page + analytics, new RegExp(event));
    assert.match(conversionApi, new RegExp(event));
  }
  const trackingBlock = page.slice(page.indexOf('const trackingPayload'), page.indexOf("trackEvent('monthly_quote_submit_attempt"));
  assert.doesNotMatch(trackingBlock, /contactName|phone|email|companyName|deliveryArea/);
});

test('scenario presets, pricing CRO and customer-facing copy follow the monthly V2.2 polish spec', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');

  for (const preset of [
    /sales: \{ vehicleGroup: 'city'.*months: 1, expectedKm: 4000/,
    /project: \{ vehicleGroup: 'mpv'.*months: 1, expectedKm: 4000/,
    /manager: \{ vehicleGroup: 'sedan'.*months: 1, expectedKm: 4000/,
    /fleet: \{ vehicleGroup: 'flex'.*quantity: 2, months: 1, expectedKm: 4000/,
    /commute: \{ vehicleGroup: 'city'.*months: 1, expectedKm: 4000/,
    /family: \{ vehicleGroup: 'mpv'.*months: 1, expectedKm: 4000/,
    /expert: \{ vehicleGroup: 'sedan'.*months: 1, expectedKm: 4000/,
    /temporary: \{ vehicleGroup: 'city'.*months: 1, expectedKm: 4000/,
  ]) assert.match(source, preset);

  assert.match(source, /Chọn tính dự toán ↑/);
  assert.match(source, /monthly_vehicle_selected_from_pricing/);
  assert.match(source, /function monthlyCarFamily/);
  assert.match(source, /function uniqueMonthlyCars/);
  assert.match(source, /uniqueMonthlyCars\(cars\)/);
  assert.match(source, /representativePriority\(car\) > representativePriority\(current\)/);
  assert.match(source, /approvedMonthlyPrice \+ year - variantPenalty/);
  assert.match(source, /const pricingTableCars/);
  assert.match(source, /pricingTableCars\.map/);
  assert.match(source, /Liên hệ/);
  assert.doesNotMatch(source, /Cần xác nhận giá tháng/);
  assert.match(source, /Chọn để tư vấn ↑/);
  assert.doesNotMatch(source, /Các dòng xe khác có thể tư vấn thuê tháng/);
  assert.match(source, /4\.000 km\/tháng/);
  assert.match(source, /return 15000000/);
  assert.match(source, /return 20000000/);
  assert.match(source, /return 25000000/);
  assert.match(source, /return 30000000/);
  assert.match(source, /\['VAT', config\.invoiceRequired \? '8%' : 'Không yêu cầu'\]/);
  assert.doesNotMatch(source, /aria-label="Số ngày sử dụng"|aria-label="Hình thức vận hành"/);
  assert.doesNotMatch(source, /\['Gói sử dụng'/);
  assert.doesNotMatch(source, /Mức dự toán trên áp dụng cho gói tự lái trọn tháng cơ bản/);
  assert.match(source, /nguyenvanminh@gmail\.com/);
  assert.match(source, /fuelToVf3Percent/);
  assert.match(source, /Bảo dưỡng theo phạm vi hợp đồng/);
  assert.match(source, /Chưa gửi được yêu cầu\. Vui lòng thử lại hoặc liên hệ Car Match qua Zalo\./);
  assert.match(source, /const audienceDefault = nextType === 'business' \? businessDefault : personalDefault/);
  assert.match(source, /findPreferredCar\(sortedMonthlyCars, preset\)/);
  assert.doesNotMatch(source, />[^<{]*(?:CRM|Sales\/Ops|Giá từ catalog|máy chủ trả mã yêu cầu)[^<{]*</i);
});

test('successful monthly lead submission stays disabled until the audience changes', async () => {
  const source = await readFile(PAGE_PATH, 'utf8');
  assert.match(source, /submitState\.status === 'loading' \|\| submitState\.status === 'success'/);
  assert.match(source, /idempotencyRef\.current = '';\s+setSubmitState\(\{ status: 'idle' \}\)/);
  assert.doesNotMatch(source, /idempotencyRef\.current = '';\s+setSubmitState\(\{ status: 'success'/);
});
