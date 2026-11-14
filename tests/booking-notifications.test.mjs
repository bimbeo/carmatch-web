import assert from 'node:assert/strict';
import test from 'node:test';

import { getBookingScheduleNotice } from '../src/lib/bookingNotifications.ts';

const baseInput = {
  availabilityUnavailable: false,
  requiresConfirmation: false,
  hardConflicts: [],
  boundaryConflicts: [],
  pickupDate: '2026-11-17',
  pickupHour: 8,
  returnDate: '2026-11-18',
  returnHour: 20,
};

test('normal availability does not create a schedule notice', () => {
  assert.equal(getBookingScheduleNotice(baseInput), null);
});

test('hard conflict has the single blocking message and red tone', () => {
  assert.deepEqual(getBookingScheduleNotice({
    ...baseInput,
    hardConflicts: [{ from: '2026-11-17', to: '2026-11-18' }],
  }), {
    tone: 'danger',
    message: 'Xe không khả dụng trong khung giờ này. Vui lòng chọn thời gian hoặc xe khác.',
  });
});

test('same-day vehicle return asks Car Match to confirm the selected pickup hour', () => {
  assert.deepEqual(getBookingScheduleNotice({
    ...baseInput,
    boundaryConflicts: [{ from: '2026-11-16', to: '2026-11-17' }],
  }), {
    tone: 'warning',
    message: 'Xe có lịch về ngày 17/11. Giờ nhận 8:00 cần được Car Match xác nhận.',
  });
});

test('pickup from 21:00 after the prior rental uses the inspection handoff copy', () => {
  assert.deepEqual(getBookingScheduleNotice({
    ...baseInput,
    pickupHour: 21,
    boundaryConflicts: [{ from: '2026-11-16', to: '2026-11-17' }],
  }), {
    tone: 'warning',
    message: 'Xe có lịch về ngày 17/11. Giờ nhận từ 21:00 cần được xác nhận sau khi kiểm tra xe.',
  });
});

test('availability API error keeps booking request available for manual verification', () => {
  assert.deepEqual(getBookingScheduleNotice({
    ...baseInput,
    availabilityUnavailable: true,
  }), {
    tone: 'warning',
    message: 'Chưa kiểm tra được lịch xe. Bạn có thể gửi yêu cầu để Car Match xác minh.',
  });
});

test('backend manual-confirmation result still creates one conditional notice', () => {
  assert.deepEqual(getBookingScheduleNotice({
    ...baseInput,
    requiresConfirmation: true,
  }), {
    tone: 'warning',
    message: 'Lịch thuê cần được Car Match xác nhận trước khi hướng dẫn đặt cọc.',
  });
});
