import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateRentalBillingDays,
  calculateRentalPricingUnits,
  DEFAULT_PICKUP_HOUR,
  DEFAULT_RETURN_HOUR,
  formatRentalBillingDays,
} from '../src/lib/rentalDuration.ts';
import { calculateRentalPricingUnits as calculateServerPricingUnits } from '../api/_rental-duration.js';
import { calculateRentalAmount, deliveryFeeForMode } from '../api/bookings.js';

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

test('same-day half session is displayed as 0.5 day but charged at 70 percent', () => {
  const units = calculateRentalPricingUnits('2026-11-11', 7, '2026-11-11', 12);
  assert.deepEqual(units, { billingDays: 0.5, priceDays: 0.7 });
  assert.equal(formatRentalBillingDays(units.billingDays), 'Nửa ngày');
});

test('morning pickup through next morning counts and charges 1.5 days', () => {
  const units = calculateRentalPricingUnits('2026-11-11', 8, '2026-11-12', 8);
  assert.deepEqual(units, { billingDays: 1.5, priceDays: 1.5 });
  assert.equal(formatRentalBillingDays(units.billingDays), '1,5 ngày');
});

test('morning pickup through 20:00 next day counts two days', () => {
  assert.deepEqual(
    calculateRentalPricingUnits('2026-11-11', 8, '2026-11-12', 20),
    { billingDays: 2, priceDays: 2 },
  );
});

test('morning pickup through the morning two dates later counts 2.5 days', () => {
  const units = calculateRentalPricingUnits('2026-11-11', 8, '2026-11-13', 8);
  assert.deepEqual(units, { billingDays: 2.5, priceDays: 2.5 });
  assert.equal(formatRentalBillingDays(units.billingDays), '2,5 ngày');
});

test('weekday 13:00 pickup through 08:00 or 12:00 next day counts one day', () => {
  assert.deepEqual(
    calculateRentalPricingUnits('2026-11-11', 13, '2026-11-12', 8),
    { billingDays: 1, priceDays: 1 },
  );
  assert.deepEqual(
    calculateRentalPricingUnits('2026-11-11', 13, '2026-11-12', 12),
    { billingDays: 1, priceDays: 1 },
  );
});

test('weekday 16:00 pickup through 16:00 next day counts one day', () => {
  assert.deepEqual(
    calculateRentalPricingUnits('2026-11-11', 16, '2026-11-12', 16),
    { billingDays: 1, priceDays: 1 },
  );
});

test('afternoon weekday benefit is not applied when the range touches a weekend', () => {
  assert.deepEqual(
    calculateRentalPricingUnits('2026-11-13', 13, '2026-11-14', 12),
    { billingDays: 2, priceDays: 2 },
  );
});

test('19:00 pickup through noon next day is 0.5 billing day at 70 percent price', () => {
  const units = calculateRentalPricingUnits('2026-11-11', 19, '2026-11-12', 12);
  assert.deepEqual(units, { billingDays: 0.5, priceDays: 0.7 });
  assert.equal(formatRentalBillingDays(units.billingDays), 'Nửa ngày');
});

test('a longer evening rental uses its displayed 1.5-day multiplier', () => {
  assert.deepEqual(
    calculateRentalPricingUnits('2026-11-11', 19, '2026-11-13', 12),
    { billingDays: 1.5, priceDays: 1.5 },
  );
});

test('booking API charges the correct amount for the requested examples', () => {
  const dailyPrice = 1_000_000;
  assert.equal(calculateRentalAmount('2026-11-11', 8, '2026-11-12', 8, dailyPrice), 1_500_000);
  assert.equal(calculateRentalAmount('2026-11-11', 8, '2026-11-12', 20, dailyPrice), 2_000_000);
  assert.equal(calculateRentalAmount('2026-11-11', 13, '2026-11-12', 8, dailyPrice), 1_000_000);
  assert.equal(calculateRentalAmount('2026-11-11', 19, '2026-11-12', 12, dailyPrice), 700_000);
});

test('frontend and booking API use the same pricing matrix', () => {
  const cases = [
    ['2026-11-11', 8, '2026-11-12', 8],
    ['2026-11-11', 8, '2026-11-12', 20],
    ['2026-11-11', 13, '2026-11-12', 8],
    ['2026-11-11', 16, '2026-11-12', 16],
    ['2026-11-11', 19, '2026-11-12', 12],
    ['2026-11-13', 13, '2026-11-14', 12],
  ];
  for (const args of cases) {
    assert.deepEqual(calculateServerPricingUnits(...args), calculateRentalPricingUnits(...args));
  }
});

test('booking API prices each delivery mode consistently', () => {
  assert.equal(deliveryFeeForMode('self'), 0);
  assert.equal(deliveryFeeForMode('delivery', 'pickup'), 100_000);
  assert.equal(deliveryFeeForMode('delivery', 'return'), 100_000);
  assert.equal(deliveryFeeForMode('delivery', 'roundtrip'), 200_000);
  assert.equal(deliveryFeeForMode('delivery'), 200_000);
  assert.equal(deliveryFeeForMode('airport', 'pickup'), 250_000);
  assert.equal(deliveryFeeForMode('airport', 'return'), 250_000);
  assert.equal(deliveryFeeForMode('airport', 'roundtrip'), 500_000);
  assert.equal(deliveryFeeForMode('airport'), 500_000);
  assert.equal(deliveryFeeForMode('airport', 'invalid'), null);
  assert.equal(deliveryFeeForMode('unknown'), null);
});
