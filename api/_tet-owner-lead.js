import { createHash } from 'node:crypto';
import { classifyAvailability, tetOwnerWindow, validateHandoverTimes } from '../src/data/tetOwnerAvailability.mjs';

const options = new Set(['full', 'across_new_year', 'before', 'after', 'flexible', 'multi', 'consult']);
const scopes = new Set(['reference_vehicle_only', 'same_for_all_vehicles', 'single_vehicle']);
const presets = new Set(['full', 'duxuan', 'before', 'family', 'clear', 'custom']);
const scheduleLabels = {
  full: 'rảnh toàn bộ giai đoạn cao điểm',
  across_new_year: 'rảnh qua giao thừa, bao phủ một phần cao điểm',
  before: 'rảnh trước Tết',
  after: 'rảnh từ mùng 1 trở đi',
  flexible: 'lịch linh hoạt hoặc ngắt quãng',
};
const date = /^\d{4}-\d{2}-\d{2}$/;
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function validDate(value) {
  if (typeof value !== 'string' || !date.test(value)) return false;
  const timestamp = new Date(value + 'T00:00:00Z');
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString().slice(0, 10) === value;
}

function dateSpanDays(segment) {
  if (!validDate(segment?.start) || !validDate(segment?.end) ||
      segment.start < tetOwnerWindow.start || segment.end > tetOwnerWindow.end || segment.end < segment.start) return 0;
  return 1 + (Date.parse(segment.end) - Date.parse(segment.start)) / 86_400_000;
}

function normalizeSegments(input) {
  const segments = [];
  for (const { start, end, days } of [...input].sort((a, b) => a.start.localeCompare(b.start))) {
    const previous = segments[segments.length - 1];
    if (previous && Date.parse(start) - Date.parse(previous.end) === 86_400_000) {
      previous.end = end;
      previous.days += days;
    } else {
      segments.push({ start, end, days });
    }
  }
  return segments;
}

export function buildTetOwnerLeadInsert(payload, idempotencyKey) {
  const draft = payload.tet_owner;
  const car = clean(payload.car_model, 150);
  const name = clean(payload.name, 100);
  const phone = clean(payload.phone, 18);
  const quantity = Number(payload.quantity);
  const reject = () => ({ error: 'Kiểm tra lại thông tin xe, lịch và sự đồng ý liên hệ.' });
  if (draft?.campaign !== `partner_tet_${tetOwnerWindow.newYear.slice(0, 4)}` || payload.source !== 'partner' || !idempotencyKey || draft.version !== 2 ||
      draft.contact_consent !== true || !name || !car || !/^0\d{9}$/.test(phone) ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return reject();

  const withDates = draft.schedule_status === 'owner_selected';
  const building = clean(payload.building, 120);
  const details = {
    version: 2, campaign: draft.campaign, contact_consent: true,
    schedule_status: withDates ? 'owner_selected' : 'unknown',
    schedule_input: withDates ? 'owner_selected' : draft.schedule_input === 'sample_ignored' ? 'sample_ignored' : 'not_set',
    declared_option: 'consult', schedule_class: null, schedule_scope: null, preset: null,
    time_zone: 'Asia/Ho_Chi_Minh', segments: null,
    earliest_handover_at_local: null, latest_return_at_local: null, fleet_notes: null, calculator: null,
  };
  let duration = null;
  let scheduleLine = 'Lịch xe: Chủ xe chưa xác định hoặc chưa gửi lịch.';
  if (withDates) {
    if (!building || draft.schedule_input !== 'owner_selected' || !presets.has(draft.preset) || !options.has(draft.declared_option) ||
        !scopes.has(draft.schedule_scope) || (quantity === 1) !== (draft.schedule_scope === 'single_vehicle')) return reject();
    const { free, hold } = draft.segments ?? {};
    if (!Array.isArray(free) || !free.length || !Array.isArray(hold) || free.length + hold.length > 20) return reject();
    const all = [...free, ...hold];
    if (all.some((segment) => dateSpanDays(segment) !== segment?.days || !segment.days)) return reject();
    all.sort((a, b) => a.start.localeCompare(b.start));
    if (all.some((segment, index) => index > 0 && all[index - 1].end >= segment.start)) return reject();
    const available = free.reduce((sum, segment) => sum + segment.days, 0);
    if (all.reduce((sum, segment) => sum + segment.days, 0) > 20) return reject();
    const earliest = draft.earliest_handover_at_local;
    const latest = draft.latest_return_at_local;
    const freeSegments = normalizeSegments(free);
    if ((earliest != null && typeof earliest !== 'string') || (latest != null && typeof latest !== 'string') ||
        validateHandoverTimes(freeSegments, earliest, latest)) return reject();

    const differentSchedules = draft.schedule_scope === 'reference_vehicle_only';
    const fleetNotes = clean(draft.fleet_notes, 700);
    if (differentSchedules && !fleetNotes) return reject();
    Object.assign(details, {
      preset: draft.preset,
      declared_option: draft.declared_option,
      schedule_class: differentSchedules ? null : classifyAvailability(freeSegments, earliest, latest),
      schedule_scope: draft.schedule_scope,
      segments: {
        free: freeSegments,
        hold: normalizeSegments(hold),
      },
      earliest_handover_at_local: earliest || null,
      latest_return_at_local: latest || null,
      fleet_notes: differentSchedules ? fleetNotes : null,
    });
    const calc = draft.calculator;
    if (calc) {
      const inBounds = (value, max) => Number.isFinite(value) && value >= 0 && value <= max;
      const { dailyRate, bookedDays, sharePercent, monthlyCost } = calc;
      if (!inBounds(dailyRate, 100_000_000) || !inBounds(bookedDays, available) || !Number.isInteger(bookedDays) ||
          !inBounds(sharePercent, 100) || !inBounds(monthlyCost, 200_000_000)) return reject();
      const gross = dailyRate * bookedDays;
      details.calculator = { dailyRate, bookedDays, sharePercent, monthlyCost, gross, ownerShare: gross * sharePercent / 100,
        vehicle_group: clean(calc.vehicle_group, 100) };
    }
    duration = differentSchedules ? null : `${available} ngày rảnh`;
    scheduleLine = differentSchedules
      ? 'Phân loại lịch: Mỗi xe có lịch riêng, cần đối chiếu ghi chú. Lịch và giờ bên dưới dùng cho xe tham khảo.'
      : `Phân loại lịch đề xuất: ${scheduleLabels[details.schedule_class]}.`;
  } else if (draft.schedule_status !== 'unknown') {
    return reject();
  }

  const requestRef = 'TET-' + createHash('sha256').update(`${phone}:${idempotencyKey}`).digest('hex').slice(0, 12).toUpperCase();
  return { requestRef, insert: {
    source: 'partner', form_type: 'daily', name, phone, car_model: car, building: building || null,
    quantity: String(quantity), duration,
    note: [
      `lead_source=${draft.campaign}`,
      `lead_request_ref=${requestRef}`,
      'source_page=https://www.carmatch.vn/hop-tac-chu-xe-cho-thue-tet',
      scheduleLine,
      clean(payload.note, 3000),
      '[TET_OWNER_V2]',
      JSON.stringify(details),
    ].join('\n'),
  } };
}
