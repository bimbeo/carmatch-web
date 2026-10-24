import { createAnalyticsEventId, getAttributionSnapshot } from './attribution';

type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_CATEGORY = 'conversion';
const FIRST_PARTY_EVENTS = new Set([
  'session_start',
  'page_view',
  'view_item',
  'begin_checkout',
  'cm_booking_validation_error',
  'cm_booking_submit_attempt',
  'cm_booking_submit_success',
  'cm_booking_submit_error',
  'cm_availability_check_start',
  'cm_availability_check_success',
  'cm_availability_check_error',
  'generate_lead',
  'cm_phone_click',
  'cm_zalo_click',
  'cm_cta_click',
  'cm_vehicle_click',
  'cm_lead_submit_attempt',
  'cm_lead_submit_success',
  'cm_lead_submit_error',
]);

function cleanPayload(payload: AnalyticsPayload): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter((entry) => entry[1] !== undefined),
  );
}

function recordFirstPartyEvent(eventName: string, eventPayload: Record<string, unknown>) {
  if (!FIRST_PARTY_EVENTS.has(eventName)) return;
  const attribution = getAttributionSnapshot();
  if (!attribution) return;

  const payload = {
    event_id: createAnalyticsEventId(),
    event_name: eventName,
    client_at: new Date().toISOString(),
    page_path: String(eventPayload.page_path || `${window.location.pathname}${window.location.search}`),
    vehicle_id: eventPayload.vehicle_id,
    car_slug: eventPayload.car_slug,
    booking_ref: eventPayload.booking_ref,
    attribution,
    metadata: {
      ...eventPayload,
      visitor_id: attribution.visitor_id,
      is_returning_visitor: attribution.is_returning_visitor,
    },
  };
  void fetch('/api/conversion-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt the booking flow.
  });
}

export function trackPageView(payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return;
  const attribution = getAttributionSnapshot();
  if (!attribution) return;
  const sessionStartKey = `carmatch_session_start_${attribution.session_id}`;
  if (!sessionStorage.getItem(sessionStartKey)) {
    sessionStorage.setItem(sessionStartKey, '1');
    trackEvent('session_start', {
      landing_page: attribution.landing_page,
      traffic_source: attribution.traffic_source,
      traffic_medium: attribution.traffic_medium,
      is_returning_visitor: attribution.is_returning_visitor,
    });
  }
  trackEvent('page_view', payload);
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return;

  const eventPayload = cleanPayload({
    event_category: DEFAULT_CATEGORY,
    page_path: window.location.pathname,
    page_location: window.location.href,
    ...payload,
  });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventPayload,
  });

  window.gtag?.('event', eventName, eventPayload);
  recordFirstPartyEvent(eventName, eventPayload);
  window.dispatchEvent(new CustomEvent('carmatch:analytics', {
    detail: {
      event: eventName,
      ...eventPayload,
    },
  }));
}

export function trackCtaClick(cta: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_cta_click', {
    cta,
    ...payload,
  });
}

export function trackZaloClick(source: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_zalo_click', {
    source,
    contact_channel: 'zalo',
    ...payload,
  });
}

export function trackPhoneClick(source: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_phone_click', {
    source,
    contact_channel: 'phone',
    ...payload,
  });
}

export function trackVehicleClick(action: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_vehicle_click', {
    action,
    ...payload,
  });
}

export function trackVehicleDetailView(payload: AnalyticsPayload = {}) {
  trackEvent('cm_vehicle_detail_view', payload);
  trackEvent('view_item', payload);
}

export function trackBookingStart(payload: AnalyticsPayload = {}) {
  trackEvent('cm_booking_start', payload);
  trackEvent('begin_checkout', payload);
}

export function trackBookingValidationError(reason: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_booking_validation_error', {
    reason,
    ...payload,
  });
}

export function trackBookingSubmit(status: 'attempt' | 'success' | 'error', payload: AnalyticsPayload = {}) {
  trackEvent(`cm_booking_submit_${status}`, payload);
  if (status === 'success') {
    trackEvent('generate_lead', payload);
  }
}

export function trackAvailabilityCheck(status: 'start' | 'success' | 'error', payload: AnalyticsPayload = {}) {
  trackEvent(`cm_availability_check_${status}`, payload);
}

export function trackLeadSubmit(status: 'attempt' | 'success' | 'error', payload: AnalyticsPayload = {}) {
  trackEvent(`cm_lead_submit_${status}`, payload);
}
