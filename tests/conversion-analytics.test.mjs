import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConversionEventInsert,
  buildLeadStatusUpdate,
  sanitizeAttribution,
  summarizeConversionData,
} from '../api/_conversion.js';

test('sanitizeAttribution keeps campaign fields and excludes unknown data', () => {
  assert.deepEqual(sanitizeAttribution({
    session_id: 'cms_123456789012',
    first_seen_at: '2026-10-04T01:00:00.000Z',
    landing_page: '/xe/vinfast-vf3-2025?utm_source=google',
    referrer_host: 'google.com',
    traffic_source: 'google',
    traffic_medium: 'organic',
    traffic_campaign: 'vf3',
    device_type: 'mobile',
    customer_phone: '0900000000',
  }), {
    session_id: 'cms_123456789012',
    first_seen_at: '2026-10-04T01:00:00.000Z',
    landing_page: '/xe/vinfast-vf3-2025?utm_source=google',
    referrer_host: 'google.com',
    traffic_source: 'google',
    traffic_medium: 'organic',
    traffic_campaign: 'vf3',
    traffic_term: null,
    traffic_content: null,
    gclid: null,
    fbclid: null,
    device_type: 'mobile',
  });
});

test('buildConversionEventInsert accepts funnel/contact events and strips invalid vehicle ids', () => {
  const insert = buildConversionEventInsert({
    companyId: '11111111-1111-4111-8111-111111111111',
    receivedAt: new Date('2026-10-04T02:00:00.000Z'),
    body: {
      event_id: 'cme_123456789012',
      event_name: 'view_item',
      page_path: '/xe/vf3',
      vehicle_id: 'not-a-uuid',
      attribution: {
        session_id: 'cms_123456789012',
        traffic_source: 'google',
        traffic_medium: 'organic',
      },
      metadata: { rental_days: 2, customer_phone: { unsafe: true } },
    },
  });
  assert.equal(insert.event_name, 'view_item');
  assert.equal(insert.vehicle_id, null);
  assert.deepEqual(insert.metadata, { rental_days: 2 });
  assert.equal(buildConversionEventInsert({
    companyId: '11111111-1111-4111-8111-111111111111',
    body: {
      event_id: 'cme_123456789013',
      event_name: 'cm_zalo_click',
      attribution: { session_id: 'cms_123456789012' },
      metadata: { source: 'booking_widget_contact' },
    },
  }).event_name, 'cm_zalo_click');
  assert.throws(() => buildConversionEventInsert({
    companyId: '11111111-1111-4111-8111-111111111111',
    body: {
      event_id: 'cme_123456789012',
      event_name: 'page_view',
      attribution: { session_id: 'cms_123456789012' },
    },
  }), /Unsupported event/);
});

test('buildLeadStatusUpdate preserves first response and records lost reason', () => {
  const now = new Date('2026-10-04T02:10:00.000Z');
  assert.deepEqual(buildLeadStatusUpdate(
    { first_response_at: null },
    'lost',
    { now, outcomeReason: 'Hết xe' },
  ), {
    status: 'lost',
    last_status_at: now.toISOString(),
    first_response_at: now.toISOString(),
    outcome_reason: 'Hết xe',
  });

  const existingResponse = '2026-10-04T02:05:00.000Z';
  assert.deepEqual(buildLeadStatusUpdate(
    { first_response_at: existingResponse },
    'converted',
    { now },
  ), {
    status: 'converted',
    last_status_at: now.toISOString(),
    outcome_reason: null,
  });
});

test('summarizeConversionData calculates funnel, sources and response SLA', () => {
  const events = [
    { event_name: 'view_item', session_id: 'a' },
    { event_name: 'view_item', session_id: 'a' },
    { event_name: 'view_item', session_id: 'b' },
    { event_name: 'begin_checkout', session_id: 'a' },
    { event_name: 'generate_lead', session_id: 'a', booking_ref: 'CM1' },
    { event_name: 'cm_phone_click', session_id: 'a' },
    { event_name: 'cm_phone_click', session_id: 'a' },
    { event_name: 'cm_zalo_click', session_id: 'b' },
    { event_name: 'cm_cta_click', session_id: 'a' },
  ];
  const bookings = [
    {
      booking_ref: 'CM1',
      status: 'converted',
      created_at: '2026-10-04T02:00:00.000Z',
      first_response_at: '2026-10-04T02:08:00.000Z',
      total_amount: 1_200_000,
      attribution: { traffic_source: 'google' },
    },
    {
      booking_ref: 'CM2',
      status: 'new',
      created_at: '2026-10-04T01:30:00.000Z',
      first_response_at: null,
      total_amount: 800_000,
      attribution: { traffic_source: 'direct' },
    },
  ];
  const summary = summarizeConversionData(events, bookings, new Date('2026-10-04T02:30:00.000Z'));
  assert.deepEqual(summary.funnel, {
    vehicle_views: 2,
    checkout_starts: 1,
    lead_submits: 1,
    converted_bookings: 1,
    view_to_checkout_rate: 50,
    checkout_to_lead_rate: 100,
    lead_to_converted_rate: 100,
  });
  assert.deepEqual(summary.contact, {
    phone_sessions: 1,
    zalo_sessions: 1,
    cta_sessions: 1,
    contact_sessions: 2,
    view_to_contact_rate: 100,
  });
  assert.equal(summary.sla.average_response_minutes, 8);
  assert.equal(summary.sla.within_10_minutes_rate, 100);
  assert.equal(summary.sla.overdue_open_count, 1);
  assert.deepEqual(summary.sources.map((source) => source.source), ['google', 'direct']);
});
