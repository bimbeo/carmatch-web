import { createHash } from 'node:crypto';

const CUSTOMER_TYPES = new Set(['business', 'personal']);
const SCENARIOS = new Set(['sales', 'project', 'manager', 'fleet', 'commute', 'family', 'expert', 'temporary']);
const VEHICLE_GROUPS = new Set(['city', 'sedan', 'mpv', 'premium', 'flex']);
const CHANNELS = new Set(['zalo', 'email', 'both']);

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function boolLabel(value) {
  return value === true ? 'Có' : 'Không';
}

export function isMonthlyLead(payload) {
  return payload?.form_type === 'monthly_business_lead' || payload?.form_type === 'monthly_personal_lead';
}

export function monthlyRequestRef(idempotencyKey) {
  const digest = createHash('sha256').update(clean(idempotencyKey, 200)).digest('hex').slice(0, 12).toUpperCase();
  return `CMTH-${digest}`;
}

export function validateMonthlyLead(payload, idempotencyKey) {
  if (!CUSTOMER_TYPES.has(payload?.customer_type)) return 'invalid_customer_type';
  if (!SCENARIOS.has(payload?.scenario)) return 'invalid_scenario';
  if (!VEHICLE_GROUPS.has(payload?.vehicle_group)) return 'invalid_vehicle_group';
  if (!CHANNELS.has(payload?.preferred_contact_channel)) return 'invalid_contact_channel';
  if (!/^[a-zA-Z0-9:_-]{16,200}$/.test(clean(idempotencyKey, 220))) return 'invalid_idempotency_key';
  if (clean(payload.name, 120).length < 1) return 'missing_contact_name';
  if (clean(payload.phone, 32).length < 8) return 'invalid_phone';
  if (payload.customer_type === 'business' && !clean(payload.company_name, 180)) return 'missing_company_name';
  if ((payload.preferred_contact_channel === 'email' || payload.preferred_contact_channel === 'both') && !/^\S+@\S+\.\S+$/.test(clean(payload.email, 180))) return 'invalid_email';
  const quantity = Number(payload.quantity);
  const duration = Number(payload.duration);
  const expectedKm = Number(payload.expected_km_per_vehicle_month);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) return 'invalid_vehicle_count';
  if (![1, 3, 6, 12].includes(duration)) return 'invalid_duration';
  if (expectedKm !== 4000) return 'invalid_expected_km';
  if (String(payload.days_plan) !== '30') return 'invalid_days_plan';
  if (payload.operation_mode !== 'self') return 'invalid_operation_mode';
  if (payload.customer_type === 'personal' && quantity !== 1) return 'invalid_personal_configuration';
  return null;
}

export function buildMonthlyLeadInsert(payload, requestRef) {
  const noteLines = [
    `[MONTHLY RENTAL ${payload.customer_type === 'business' ? 'BUSINESS' : 'PERSONAL'}]`,
    `Mã yêu cầu: ${requestRef}`,
    `Kịch bản: ${clean(payload.scenario, 40)}`,
    `Nhóm xe: ${clean(payload.vehicle_group, 40)}`,
    `Vehicle ID: ${clean(payload.vehicle_id, 80) || 'Chưa chọn'}`,
    `Số xe: ${clean(payload.quantity, 10)}`,
    `Thời hạn: ${clean(payload.duration, 10)} tháng`,
    'Gói thuê: Trọn 30 ngày',
    'Vận hành: Tự lái',
    `Km giới hạn: ${clean(payload.expected_km_per_vehicle_month, 20)} km/xe/tháng`,
    `Kênh liên hệ: ${clean(payload.preferred_contact_channel, 20)}`,
    `Email: ${clean(payload.email, 180) || 'Không cung cấp'}`,
    `Doanh nghiệp: ${payload.customer_type === 'business' ? clean(payload.company_name, 180) : 'Không áp dụng'}`,
    `Mã số thuế: ${payload.customer_type === 'business' ? clean(payload.tax_code, 40) || 'Không cung cấp' : 'Không áp dụng'}`,
    `VAT: ${payload.invoice_required === true ? '8% - có yêu cầu hóa đơn' : 'Không yêu cầu hóa đơn'}`,
    `Cần báo giá chính thức: ${boolLabel(payload.formal_quote_required)}`,
    `Yêu cầu mẫu hợp đồng: ${boolLabel(payload.contract_sample_requested)}`,
    `Nguồn: ${clean(payload.source_page, 80) || '/thue-xe-thang'}`,
    clean(payload.note, 2000) ? `Ghi chú khách: ${clean(payload.note, 2000)}` : '',
  ].filter(Boolean);

  return {
    source: 'b2b',
    name: clean(payload.name, 120),
    phone: clean(payload.phone, 32),
    customer_type: payload.customer_type,
    form_type: payload.customer_type === 'business' ? 'monthly_business_lead' : 'monthly_personal_lead',
    quantity: clean(payload.quantity, 20),
    duration: `${clean(payload.duration, 10)} tháng`,
    car_model: clean(payload.car_model, 180) || clean(payload.vehicle_group, 40),
    building: clean(payload.building, 240),
    note: noteLines.join('\n').slice(0, 5900),
    booking_ref: requestRef,
  };
}
