import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateHolidaySurcharge } from '../api/bookings.js';

const rules = [{
  id: 'holiday-rule',
  name: 'Lễ Quốc khánh 2/9',
  start_date: '2026-08-29',
  end_date: '2026-09-02',
  adjustment_type: 'fixed',
  adjustment_value: 100_000,
  booking_windows: [
    {
      pickup_date: '2026-08-29',
      return_date: '2026-09-02',
      label: 'Gói 5 ngày lễ 29/8–2/9',
      adjustment_value: 100_000,
    },
    {
      pickup_date: '2026-08-29',
      return_date: '2026-08-30',
      label: 'Gói 2 ngày lễ 29/8–30/8',
      adjustment_value: 200_000,
    },
    {
      pickup_date: '2026-08-31',
      return_date: '2026-09-02',
      label: 'Gói 3 ngày lễ 31/8–2/9',
      adjustment_value: 300_000,
    },
  ],
}];

test('combo 5 ngày tăng 100.000đ/ngày và tính đủ 5 ngày', () => {
  const surcharge = calculateHolidaySurcharge(rules, ['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'], 600_000, {
    pickupDate: '2026-08-29',
    pickupHour: 20,
    returnDate: '2026-09-02',
    returnHour: 20,
    baseAmount: 2_400_000,
  });

  assert.equal(surcharge, 1_100_000);
  assert.equal(2_400_000 + surcharge, 3_500_000);
});

test('combo 2 ngày tăng 200.000đ/ngày và áp dụng chung cho mọi xe', () => {
  const surcharge = calculateHolidaySurcharge(rules, ['2026-08-30'], 800_000, {
    pickupDate: '2026-08-29',
    pickupHour: 20,
    returnDate: '2026-08-30',
    returnHour: 20,
    baseAmount: 800_000,
  });

  assert.equal(surcharge, 1_200_000);
  assert.equal(800_000 + surcharge, 2_000_000);
});

test('combo 3 ngày tăng 300.000đ/ngày', () => {
  const surcharge = calculateHolidaySurcharge(rules, ['2026-09-01', '2026-09-02'], 1_100_000, {
    pickupDate: '2026-08-31',
    pickupHour: 20,
    returnDate: '2026-09-02',
    returnHour: 20,
    baseAmount: 2_200_000,
  });

  assert.equal(surcharge, 2_000_000);
  assert.equal(2_200_000 + surcharge, 4_200_000);
});

test('phụ phí trả muộn vẫn được giữ ngoài giá combo', () => {
  const surcharge = calculateHolidaySurcharge(rules, ['2026-08-30'], 800_000, {
    pickupDate: '2026-08-29',
    pickupHour: 20,
    returnDate: '2026-08-30',
    returnHour: 21,
    baseAmount: 900_000,
  });

  assert.equal(surcharge, 1_200_000);
  assert.equal(900_000 + surcharge, 2_100_000);
});

test('ngoài combo chính xác thì dùng mức tăng mặc định theo ngày của đợt giá', () => {
  const surcharge = calculateHolidaySurcharge(rules, ['2026-08-30', '2026-08-31'], 600_000, {
    pickupDate: '2026-08-30',
    pickupHour: 20,
    returnDate: '2026-08-31',
    returnHour: 20,
    baseAmount: 600_000,
  });

  assert.equal(surcharge, 200_000);
});
