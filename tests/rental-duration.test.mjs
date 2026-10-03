import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateRentalBillingDays,
  DEFAULT_PICKUP_HOUR,
  DEFAULT_RETURN_HOUR,
  formatRentalBillingDays,
} from '../src/lib/rentalDuration.ts';

test('calendar selection defaults to 08:00 pickup and 20:00 return', () => {
  assert.equal(DEFAULT_PICKUP_HOUR, 8);
  assert.equal(DEFAULT_RETURN_HOUR, 20);
});

test('same-day 08:00 through 20:00 counts one rental day', () => {
  const days = calculateRentalBillingDays('2026-10-04', 8, '2026-10-04', 20);
  assert.equal(days, 1);
  assert.equal(formatRentalBillingDays(days), '1 ngày');
});

test('same-day rental shorter than four hours is invalid', () => {
  assert.equal(calculateRentalBillingDays('2026-10-04', 17, '2026-10-04', 20), 0);
});

test('29/8 through 2/9 counts five days when pickup is 08:00', () => {
  const days = calculateRentalBillingDays('2026-08-29', 8, '2026-09-02', 20);
  assert.equal(days, 5);
  assert.equal(formatRentalBillingDays(days), '5 ngày');
});

test('the same dates recalculate to four days when pickup changes to 20:00', () => {
  const days = calculateRentalBillingDays('2026-08-29', 20, '2026-09-02', 20);
  assert.equal(days, 4);
  assert.equal(formatRentalBillingDays(days), '4 ngày');
});

test('an evening pickup on the previous date still counts five rental days', () => {
  const days = calculateRentalBillingDays('2026-08-28', 20, '2026-09-02', 20);
  assert.equal(days, 5);
});

test('afternoon pickup recalculates the half-day billing rule', () => {
  const days = calculateRentalBillingDays('2026-08-29', 13, '2026-09-02', 20);
  assert.equal(days, 4.5);
  assert.equal(formatRentalBillingDays(days), '4 ngày + nửa ngày');
});
