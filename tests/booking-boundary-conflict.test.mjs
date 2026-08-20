import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOCKING_SCHEDULE_TYPES,
  classifyScheduleConflicts,
  isBoundaryScheduleConflict,
  scheduleEventCalendarRange,
} from '../api/bookings.js';

test('only sends valid database enum values in the blocking schedule query', () => {
  assert.deepEqual(BLOCKING_SCHEDULE_TYPES, [
    'rental',
    'blocked',
    'maintenance',
    'cleaning',
    'inspection',
    'transfer',
    'charging',
  ]);
});

const activeRental = {
  event_type: 'rental',
  status: 'confirmed',
  starts_at: '2026-08-01T00:00:00+07:00',
  ends_at: '2026-08-29T00:00:00+07:00',
};

test('converts an exclusive schedule end into the last occupied calendar day', () => {
  assert.deepEqual(scheduleEventCalendarRange(activeRental), {
    from: '2026-08-01',
    to: '2026-08-28',
  });
});

test('allows the previous schedule last day to enter manual confirmation', () => {
  assert.equal(isBoundaryScheduleConflict(activeRental, '2026-08-28', '2026-08-30'), true);
});

test('does not downgrade a middle-of-schedule overlap to a boundary conflict', () => {
  assert.equal(isBoundaryScheduleConflict(activeRental, '2026-08-27', '2026-08-30'), false);
});

test('treats a following schedule start date as a return boundary', () => {
  const followingRental = {
    ...activeRental,
    starts_at: '2026-08-30T00:00:00+07:00',
    ends_at: '2026-09-02T00:00:00+07:00',
  };

  assert.equal(isBoundaryScheduleConflict(followingRental, '2026-08-28', '2026-08-30'), true);
});

test('keeps zero-length legacy schedule rows on their start date', () => {
  const legacyEvent = {
    ...activeRental,
    starts_at: '2026-08-28T09:00:00+07:00',
    ends_at: '2026-08-28T09:00:00+07:00',
  };

  assert.deepEqual(scheduleEventCalendarRange(legacyEvent), {
    from: '2026-08-28',
    to: '2026-08-28',
  });
});

test('classifies boundary-only rows separately from hard overlaps', () => {
  const boundaryOnly = classifyScheduleConflicts(
    [activeRental],
    '2026-08-28',
    '2026-08-30',
  );
  assert.equal(boundaryOnly.blocking.length, 1);
  assert.equal(boundaryOnly.boundary.length, 1);
  assert.equal(boundaryOnly.hasHardConflict, false);

  const hardOverlap = classifyScheduleConflicts(
    [activeRental],
    '2026-08-27',
    '2026-08-30',
  );
  assert.equal(hardOverlap.blocking.length, 1);
  assert.equal(hardOverlap.boundary.length, 0);
  assert.equal(hardOverlap.hasHardConflict, true);
});

test('ignores schedule rows that availability also treats as non-blocking', () => {
  const expenseRow = {
    ...activeRental,
    location_text: 'Chi phí',
  };
  const cancelledRow = {
    ...activeRental,
    status: 'cancelled',
  };

  const conflicts = classifyScheduleConflicts(
    [expenseRow, cancelledRow],
    '2026-08-27',
    '2026-08-30',
  );
  assert.equal(conflicts.blocking.length, 0);
  assert.equal(conflicts.hasHardConflict, false);
});
