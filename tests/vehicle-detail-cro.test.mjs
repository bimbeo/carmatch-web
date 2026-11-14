import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const CAR_DETAIL_PATH = new URL('../src/app/pages/CarDetail.tsx', import.meta.url);
const BOOKING_WIDGET_PATH = new URL('../src/app/components/BookingWidget.tsx', import.meta.url);

test('mobile vehicle CTA opens the booking flow directly', async () => {
  const carDetail = await readFile(CAR_DETAIL_PATH, 'utf8');
  const bookingWidget = await readFile(BOOKING_WIDGET_PATH, 'utf8');

  assert.match(carDetail, /onClick=\{openMobileBooking\}/);
  assert.match(carDetail, /source: 'car_detail_mobile_sticky'/);
  assert.match(carDetail, /vehicleId: car\.id/);
  assert.match(carDetail, /externalOpenRequest=\{bookingOpenRequest\}/);
  assert.match(bookingWidget, /externalOpenRequest\?\.vehicleId !== vehicleId/);
  assert.match(bookingWidget, /openBookingForm\(externalOpenRequest\?\.source \|\| 'external'\)/);
  assert.match(bookingWidget, /openBookingForm\('booking_widget_primary'\)/);
});

test('external booking CTA falls back to the calendar for invalid or blocked dates', async () => {
  const source = await readFile(BOOKING_WIDGET_PATH, 'utf8');

  assert.match(source, /!result\.valid \|\| hardConflicts\.length > 0 \|\| holidayBookingBlocked/);
  assert.match(source, /trackCtaClick\('booking_widget_open_calendar'/);
  assert.match(source, /setShowCalModal\(true\)/);
});

test('availability retries use a fresh timeout and preserve actionable error metadata', async () => {
  const source = await readFile(BOOKING_WIDGET_PATH, 'utf8');
  const retryLoop = source.slice(
    source.indexOf('while (attempts < 2 && !data)'),
    source.indexOf("if (!data) {\n        throw Object.assign"),
  );

  assert.match(retryLoop, /const controller = new AbortController\(\)/);
  assert.match(retryLoop, /controller\.abort\(\), 4_500/);
  assert.match(retryLoop, /cache: 'no-store'/);
  assert.match(retryLoop, /code: 'invalid_json'/);
  assert.match(retryLoop, /await new Promise\(\(resolve\) => window\.setTimeout\(resolve, 250\)\)/);
  assert.match(source, /error_name: errorName/);
  assert.match(source, /error_message: errorMessage/);
  assert.match(source, /attempt_timeout_ms: 4_500/);
});

test('vehicle detail keeps default verified pickup locations after widget reuse on local landing', async () => {
  const carDetail = await readFile(CAR_DETAIL_PATH, 'utf8');
  const bookingWidget = await readFile(BOOKING_WIDGET_PATH, 'utf8');

  assert.match(bookingWidget, /pickupLocations = DEFAULT_PICKUP_LOCATIONS/);
  assert.match(bookingWidget, /initialDeliveryMode[\s\S]*initialDeliverySelection\.mode/);
  assert.match(bookingWidget, /pickupLocations\.some\(\(location\) => location\.id === initialDeliverySelection\.location\)/);
  assert.match(bookingWidget, /pickupLocations\[0\]\?\.id \?\? ''/);
  assert.doesNotMatch(carDetail, /pickupLocations=/);
});
