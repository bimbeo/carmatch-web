const options = new Set(['full', 'before', 'after', 'flexible', 'multi', 'consult']);
const scopes = new Set(['reference_vehicle_only', 'same_for_all_vehicles', 'single_vehicle']);
const presets = new Set(['full', 'duxuan', 'before', 'family', 'clear', 'custom']);
const date = /^\d{4}-\d{2}-\d{2}$/;
const dateTime = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function validDate(value) {
  if (typeof value !== 'string' || !date.test(value)) return false;
  const timestamp = new Date(value + 'T00:00:00Z');
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString().slice(0, 10) === value;
}

function dateSpanDays(segment, year) {
  if (!validDate(segment?.start) || !validDate(segment?.end) ||
      !segment.start.startsWith(year + '-') || !segment.end.startsWith(year + '-') || segment.end < segment.start) return 0;
  return 1 + (Date.parse(segment.end) - Date.parse(segment.start)) / 86_400_000;
}

export function buildTetOwnerLeadInsert(payload, idempotencyKey) {
  const draft = payload.tet_owner;
  const campaign = /^partner_tet_(20\d{2})$/.exec(draft?.campaign);
  const car = clean(payload.car_model, 150);
  const name = clean(payload.name, 100);
  const phone = clean(payload.phone, 18);
  const quantity = Number(payload.quantity);
  const reject = () => ({ error: 'Kiểm tra lại thông tin xe, lịch và sự đồng ý liên hệ.' });
  if (!campaign || payload.source !== 'partner' || !idempotencyKey || draft.version !== 2 ||
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
    if (all.some((segment) => dateSpanDays(segment, campaign[1]) !== segment?.days || !segment.days)) return reject();
    all.sort((a, b) => a.start.localeCompare(b.start));
    if (all.some((segment, index) => index > 0 && all[index - 1].end >= segment.start)) return reject();
    const available = free.reduce((sum, segment) => sum + segment.days, 0);
    if (all.reduce((sum, segment) => sum + segment.days, 0) > 20) return reject();
    const earliest = draft.earliest_handover_at_local;
    const latest = draft.latest_return_at_local;
    const validTime = (value) => value == null || (typeof value === 'string' && dateTime.test(value) && validDate(value.slice(0, 10)));
    if (!validTime(earliest) || !validTime(latest) || (earliest && latest && earliest > latest)) return reject();

    const differentSchedules = draft.schedule_scope === 'reference_vehicle_only';
    const fleetNotes = clean(draft.fleet_notes, 700);
    if (differentSchedules && !fleetNotes) return reject();
    Object.assign(details, {
      preset: draft.preset,
      declared_option: draft.declared_option,
      schedule_class: !differentSchedules && options.has(draft.schedule_class) ? draft.schedule_class : null,
      schedule_scope: draft.schedule_scope,
      segments: {
        free: free.map(({ start, end, days }) => ({ start, end, days })),
        hold: hold.map(({ start, end, days }) => ({ start, end, days })),
      },
      earliest_handover_at_local: earliest ?? null,
      latest_return_at_local: latest ?? null,
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
    scheduleLine = differentSchedules ? 'Lịch xe: Mỗi xe có lịch riêng, cần đối chiếu ghi chú.' : 'Lịch xe: Chủ xe đã chủ động chọn lịch để trao đổi.';
  } else if (draft.schedule_status !== 'unknown') {
    return reject();
  }

  return { insert: {
    source: 'partner', form_type: 'daily', name, phone, car_model: car, building: building || null,
    quantity: String(quantity), duration,
    note: [
      `lead_source=${draft.campaign}`,
      'source_page=https://www.carmatch.vn/hop-tac-chu-xe-cho-thue-tet',
      scheduleLine,
      clean(payload.note, 3000),
      '[TET_OWNER_V2]',
      JSON.stringify(details),
    ].join('\n'),
  } };
}
