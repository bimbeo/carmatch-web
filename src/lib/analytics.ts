import { analyticsPagePath, createAnalyticsEventId, getAttributionSnapshot } from './attribution';

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
  'cm_partner_mode_select',
  'cm_partner_calculator_use',
  'cm_partner_document_open',
  'cm_partner_form_open',
  'cm_partner_calendar_start',
  'cm_partner_calendar_complete',
  'cm_web_vital',
  'cm_experiment_exposure',
  'monthly_audience_selected',
  'monthly_scenario_selected',
  'monthly_config_started',
  'monthly_config_changed',
  'monthly_quote_preview',
  'monthly_vehicle_selected_from_pricing',
  'monthly_print_a4',
  'monthly_quote_submit_attempt',
  'monthly_quote_submit_success',
  'monthly_quote_submit_error',
  'monthly_zalo_click',
  'monthly_phone_click',
  'filter_cars',
  'select_car_card',
  'apply_promo_code',
  'open_booking_drawer',
  'generate_lead_booking',
]);

function cleanPayload(payload: AnalyticsPayload): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter((entry) => entry[1] !== undefined),
  );
}

function ga4SafePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const safePayload = { ...payload };
  delete safePayload.booking_ref;
  const reservedAttributionKeys = ['source', 'medium', 'campaign', 'term', 'content'];
  for (const key of reservedAttributionKeys) {
    if (!(key in safePayload)) continue;
    const internalKey = `internal_${key}`;
    if (!(internalKey in safePayload)) safePayload[internalKey] = safePayload[key];
    delete safePayload[key];
  }
  return safePayload;
}

function recordFirstPartyEvent(eventName: string, eventPayload: Record<string, unknown>) {
  if (!FIRST_PARTY_EVENTS.has(eventName)) return;
  const attribution = getAttributionSnapshot();
  if (!attribution) return;

  const payload = {
    event_id: createAnalyticsEventId(),
    event_name: eventName,
    client_at: new Date().toISOString(),
    page_path: String(eventPayload.page_path || window.location.pathname),
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
    referrerPolicy: 'no-referrer',
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
    const sessionPayload = cleanPayload({
      event_category: DEFAULT_CATEGORY,
      page_path: window.location.pathname,
      page_location: window.location.origin + analyticsPagePath(window.location.pathname + window.location.search),
      landing_page: attribution.landing_page,
      traffic_source: attribution.traffic_source,
      traffic_medium: attribution.traffic_medium,
      is_returning_visitor: attribution.is_returning_visitor,
    });
    recordFirstPartyEvent('session_start', sessionPayload);
    window.dispatchEvent(new CustomEvent('carmatch:analytics', {
      detail: { event: 'session_start', ...sessionPayload },
    }));
  }
  trackEvent('page_view', payload);
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return;

  const eventPayload = cleanPayload({
    event_category: DEFAULT_CATEGORY,
    ...payload,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: analyticsPagePath(document.referrer),
    page_path: analyticsPagePath(String(payload.page_path ?? window.location.pathname)),
  });

  window.gtag?.('event', eventName, ga4SafePayload(eventPayload));
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

type LocalRentalEvent =
  | 'area_landing_view'
  | 'vehicle_select'
  | 'vehicle_list_view'
  | 'availability_check_result'
  | 'quote_view'
  | 'booking_confirmed'
  | 'pickup_option_select'
  | 'booking_start'
  | 'booking_request_success'
  | 'booking_error'
  | 'zalo_click';

export function trackLocalRentalEvent(
  event: LocalRentalEvent,
  areaSlug: string,
  vehicleId?: string,
  detail?: string,
  landingPath?: string,
) {
  if (typeof window === 'undefined') return;
  trackEvent(event, {
    area_slug: areaSlug,
    landing_area_id: areaSlug,
    landing_path: landingPath ?? window.location.pathname,
    vehicle_id: vehicleId ?? null,
    page_location: `${window.location.origin}${window.location.pathname}`,
    detail,
  });
}

export function rememberLocalRentalBooking(bookingRef: string, areaSlug: string, landingPath: string, vehicleId?: string) {
  if (!bookingRef) return;
  try {
    sessionStorage.setItem(`carmatch_local_booking_${bookingRef}`, JSON.stringify({ areaSlug, landingPath, vehicleId }));
  } catch {
    // Storage can be unavailable in privacy mode.
  }
}

export function isBookingConfirmedStatus(status: string) {
  return ['confirmed', 'converted', 'completed'].includes(status);
}

export function trackLocalRentalConfirmation(bookingRef: string, status: string) {
  if (!isBookingConfirmedStatus(status)) return;
  try {
    const key = `carmatch_local_booking_${bookingRef}`;
    const value = sessionStorage.getItem(key);
    if (!value) return;
    const { areaSlug, landingPath, vehicleId } = JSON.parse(value);
    sessionStorage.removeItem(key);
    trackLocalRentalEvent('booking_confirmed', areaSlug, vehicleId, status, landingPath);
  } catch {
    // Tracking must never interrupt booking lookup.
  }
}

export function trackZaloClick(source: string, payload: AnalyticsPayload = {}) {
  const contactPayload = {
    source,
    contact_channel: 'zalo',
    ...payload,
  };
  trackEvent('cm_zalo_click', contactPayload);
  trackEvent('click_zalo_support', contactPayload);
}

export function trackPhoneClick(source: string, payload: AnalyticsPayload = {}) {
  const contactPayload = {
    source,
    contact_channel: 'phone',
    ...payload,
  };
  trackEvent('cm_phone_click', contactPayload);
  trackEvent('click_phone_call', contactPayload);
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

export const CURRENT_BOOKING_FORM_VERSION = 'contact-only-v2';

export function trackBookingValidationError(reason: string, payload: AnalyticsPayload = {}) {
  trackEvent('cm_booking_validation_error', {
    ...payload,
    reason,
    form_version: CURRENT_BOOKING_FORM_VERSION,
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
