import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateIncome, makeSchedule, scheduleText, summarizeSchedule, tetOwnerCampaign } from '../src/data/tetOwnerCampaign.ts';
import { isTrackedConversionEvent } from '../api/_conversion.js';

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
