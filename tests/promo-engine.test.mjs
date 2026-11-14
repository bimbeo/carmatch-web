import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chooseBestDiscount,
  evaluatePromoTargeting,
  promoDiscountAmount,
  sortPromosForCustomer,
} from '../api/_promo-engine.js';

test('percentage promotion rounds to 10,000 VND and respects its cap', () => {
  assert.equal(promoDiscountAmount({ discount_type: 'percent', discount_value: 8 }, 1_500_000), 120_000);
  assert.equal(
    promoDiscountAmount({ discount_type: 'percent', discount_value: 10, max_discount: 80_000 }, 1_500_000),
    80_000,
  );
});

test('duration, weekday, advance booking and season rules are evaluated together', () => {
  const promo = {
    min_order: 500_000,
    min_rental_days: 3,
    max_rental_days: 7,
    applicable_weekdays: [1, 2, 3, 4, 5],
    min_advance_days: 2,
    starts_at: '2026-11-01T00:00:00.000Z',
    expires_at: '2026-12-31T23:59:59.000Z',
  };
  assert.equal(evaluatePromoTargeting(promo, {
    totalAmount: 1_800_000,
    rentalDays: 3,
    pickupDate: '2026-11-16',
    now: '2026-11-13T00:00:00.000Z',
  }), null);
  assert.match(evaluatePromoTargeting(promo, {
    totalAmount: 1_200_000,
    rentalDays: 2,
    pickupDate: '2026-11-16',
    now: '2026-11-13T00:00:00.000Z',
  }), /từ 3 ngày/);
  assert.match(evaluatePromoTargeting(promo, {
    totalAmount: 1_800_000,
    rentalDays: 3,
    pickupDate: '2026-11-15',
    now: '2026-11-13T00:00:00.000Z',
  }), /ngày nhận xe/);
});

test('only the better of loyalty and promo discounts is applied', () => {
  assert.deepEqual(chooseBestDiscount({ loyaltyAmount: 100_000, promoAmount: 80_000 }), {
    source: 'loyalty',
    loyaltyDiscount: 100_000,
    promoDiscount: 0,
    amount: 100_000,
  });
  assert.deepEqual(chooseBestDiscount({ loyaltyAmount: 50_000, promoAmount: 80_000 }), {
    source: 'promo',
    loyaltyDiscount: 0,
    promoDiscount: 80_000,
    amount: 80_000,
  });
});

test('applicable automatic promotions are ordered by saving then priority', () => {
  const sorted = sortPromosForCustomer([
    { code: 'MANUAL', applicable: true, auto_apply: false, discount_amount: 150_000, priority: 0 },
    { code: 'AUTO50', applicable: true, auto_apply: true, discount_amount: 50_000, priority: 10 },
    { code: 'AUTO80', applicable: true, auto_apply: true, discount_amount: 80_000, priority: 0 },
    { code: 'BLOCKED', applicable: false, auto_apply: true, discount_amount: 200_000, priority: 99 },
  ]);
  assert.deepEqual(sorted.map((item) => item.code), ['AUTO80', 'AUTO50', 'MANUAL', 'BLOCKED']);
});
