import assert from 'node:assert/strict';
import test from 'node:test';
import { editSchedule, estimateIncome, leadSchedule, makeSchedule, scheduleText, summarizeSchedule, tetOwnerCampaign } from '../src/data/tetOwnerCampaign.ts';
import { isTrackedConversionEvent } from '../api/_conversion.js';
import { buildTetOwnerLeadInsert } from '../api/_tet-owner-lead.js';

const defaultInputs = { dailyRate: '900000', bookedDays: '7', sharePercent: '80', monthlyCost: '' };

test('civil date and lunar date map covers all twenty days around Tet 2027', () => {
  const expected = [
    '20 Chạp', '21 Chạp', '22 Chạp', '23 Chạp', '24 Chạp',
    '25 Chạp', '26 Chạp', '27 Chạp', '28 Chạp', '29 Chạp',
    'Mùng 1', 'Mùng 2', 'Mùng 3', 'Mùng 4', 'Mùng 5',
    'Mùng 6', 'Mùng 7', 'Mùng 8', 'Mùng 9', 'Mùng 10',
  ];
  const dayInMs = 24 * 60 * 60 * 1000;
  const start = Date.UTC(2027, 0, 27);
  assert.deepEqual(tetOwnerCampaign.days, expected.map((label, offset) => [
    new Date(start + offset * dayInMs).toISOString().slice(0, 10), label,
  ]));
  assert.equal(tetOwnerCampaign.newYear, '2027-02-06');
  assert.equal(tetOwnerCampaign.timeZone, 'Asia/Ho_Chi_Minh');
});

test('presets distinguish continuous availability, held dates, and unconfirmed dates', () => {
  const expected = {
    full: [9, 9, 7, 0, 11, 'full'],
    duxuan: [8, 8, 3, 2, 10, 'after'],
    before: [9, 9, 1, 0, 11, 'before'],
    family: [6, 4, 4, 3, 11, 'flexible'],
    clear: [0, 0, 0, 0, 20, 'consult'],
  };
  for (const [preset, counts] of Object.entries(expected)) {
    const stats = summarizeSchedule(makeSchedule(preset));
    assert.deepEqual([stats.free, stats.longest, stats.peak, stats.hold, stats.maybe, stats.option], counts, preset);
  }
  const family = summarizeSchedule(makeSchedule('family'));
  assert.deepEqual(family.segments.free, [
    { start: '2027-02-04', end: '2027-02-05', days: 2 },
    { start: '2027-02-09', end: '2027-02-12', days: 4 },
  ]);
  assert.match(family.insight, /ngắt quãng/);
});

test('manual changes split a continuous reservation and do not inflate longest range', () => {
  const schedule = makeSchedule('full');
  schedule['2027-02-06'] = 'hold';
  const stats = summarizeSchedule(schedule);
  assert.equal(stats.longest, 6);
  assert.equal(stats.free, 8);
  assert.equal(stats.hold, 1);
  assert.notEqual(stats.option, 'full');
});

test('calculator caps days and rate and keeps delivery assumptions separate from revenue', () => {
  const opening = estimateIncome(defaultInputs, 9);
  assert.equal(opening.gross, 6_300_000);
  assert.equal(opening.ownerShare, 5_040_000);
  const custom = estimateIncome({ dailyRate: '1000000', bookedDays: '24', sharePercent: '75', monthlyCost: '2500000' }, 6);
  assert.equal(custom.gross, 6_000_000);
  assert.equal(custom.ownerShare, 4_500_000);
  assert.equal(custom.ownerShare / custom.monthlyCost, 1.8);
  assert.equal(estimateIncome(defaultInputs, 0).ownerShare, 0);
  assert.equal(estimateIncome({ ...defaultInputs, dailyRate: 'NaN', sharePercent: '101' }, 9).gross, 0);
  const summary = scheduleText(summarizeSchedule(makeSchedule('family')), custom);
  assert.match(summary, /04\/02 \(28 Chạp\) → 05\/02 \(29 Chạp\); 09\/02 \(Mùng 4\) → 12\/02 \(Mùng 7\)/);
  assert.match(summary, /Ngày giữ xe gia đình: 06\/02 \(Mùng 1\) → 08\/02 \(Mùng 3\)/);
  assert.match(summary, /Ngày chưa quyết định:/);
  assert.match(summary, /4\.500\.000đ trước chi phí riêng\/thuế/);
  assert.match(summary, /2\.500\.000đ\/tháng/);
});

test('calendar funnel events are accepted by first-party analytics', () => {
  assert.equal(isTrackedConversionEvent('cm_partner_calendar_start'), true);
  assert.equal(isTrackedConversionEvent('cm_partner_calendar_complete'), true);
});

test('manual selection starts with an empty calendar when the only dates were a sample', () => {
  const schedule = makeSchedule('full');
  for (const day of ['2027-01-27', '2027-02-05']) {
    const edited = summarizeSchedule(editSchedule(schedule, 'sample', day, 'free'));
    assert.equal(edited.free, 1);
    assert.equal(edited.segments.free[0].start, day);
  }
});

const approved = {
  stats: summarizeSchedule(makeSchedule('full')),
  estimate: estimateIncome(defaultInputs, 9),
  earliest: '2027-02-04T09:15', latest: '2027-02-12T18:30',
  fleet: '', fleetNotes: '', option: 'full', preset: 'full', modelGroup: 'Sedan 5 chỗ',
  withDates: true, origin: 'selected',
};
const payload = {
  source: 'partner', name: 'QA Chủ xe', phone: '0900000001', car_model: 'Xe mẫu',
  quantity: '1', building: 'Cầu Giấy', note: '[LEAD CONTEXT]\nUTM: utm_campaign=qa',
};
const toCRM = (draft, overrides = {}) => buildTetOwnerLeadInsert({ ...payload, ...overrides, tet_owner: draft }, 'partner-tet-test-key');
const crmDetails = (insert) => JSON.parse(insert.note.split('[TET_OWNER_V2]\n')[1]);

test('sample and consultation cannot be serialized as across-Tet supply', () => {
  for (const inputs of [{ origin: 'sample' }, { withDates: false }, { origin: 'empty' }]) {
    const result = leadSchedule({ ...approved, ...inputs });
    assert.equal(result.schedule_status, 'unknown');
    assert.equal(result.segments, null);
    assert.equal(result.calculator, null);
    assert.equal(result.earliest_handover_at_local, null);
    assert.equal(result.declared_option, 'consult');
    const { insert } = toCRM({ ...result, segments: approved.stats.segments, calculator: approved.estimate }, { building: undefined });
    assert.equal(insert.duration, null);
    assert.equal(crmDetails(insert).schedule_class, null);
    assert.equal(crmDetails(insert).segments, null);
    assert.match(insert.note, /lead_source=partner_tet_2027/);
    assert.match(insert.note, /utm_campaign=qa/);
  }
});

test('a chosen schedule writes ranges, timestamps and assumptions, with no calculator required', () => {
  const { insert } = toCRM(leadSchedule(approved));
  const details = crmDetails(insert);
  assert.equal(insert.duration, '9 ngày rảnh');
  assert.equal(details.schedule_status, 'owner_selected');
  assert.equal(details.schedule_class, 'full');
  assert.equal(details.earliest_handover_at_local, approved.earliest);
  assert.equal(details.latest_return_at_local, approved.latest);
  assert.equal(details.calculator.ownerShare, 5_040_000);
  assert.equal(details.segments.free[0].end, '2027-02-12');
  assert.equal(crmDetails(toCRM(leadSchedule({ ...approved, estimate: null })).insert).calculator, null);
});

test('mixed fleet dates do not multiply supply and require the individual schedules', () => {
  const details = leadSchedule({ ...approved, fleet: 'different', fleetNotes: 'Xe A 04–05/02. Xe B 09–12/02.' });
  assert.equal(details.schedule_scope, 'reference_vehicle_only');
  assert.equal(details.schedule_class, null);
  const { insert } = toCRM(details, { quantity: '2' });
  assert.equal(insert.duration, null);
  assert.equal(crmDetails(insert).fleet_notes, details.fleet_notes);
  assert.ok(toCRM({ ...details, fleet_notes: '' }, { quantity: '2' }).error);
  const same = toCRM(leadSchedule({ ...approved, fleet: 'same' }), { quantity: '2' }).insert;
  assert.equal(crmDetails(same).schedule_scope, 'same_for_all_vehicles');
});

test('the lead handler rejects invalid dates, unordered windows and out-of-bounds calculator values', () => {
  const valid = leadSchedule(approved);
  for (const invalid of [
    { schedule_input: 'sample_ignored' },
    { earliest_handover_at_local: '2027-02-30T12:00' },
    { latest_return_at_local: '2027-02-02T12:00' },
    { segments: { free: [{ start: '2027-02-04', end: '2027-02-05', days: 2 }], hold: [{ start: '2027-02-05', end: '2027-02-06', days: 2 }] } },
    { calculator: { ...valid.calculator, bookedDays: 10 } },
    { calculator: { ...valid.calculator, sharePercent: 101 } },
    { contact_consent: false },
  ]) assert.ok(toCRM({ ...valid, ...invalid }).error);
  assert.ok(toCRM(valid, { building: '' }).error);
});
