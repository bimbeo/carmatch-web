type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_CATEGORY = 'conversion';

function cleanPayload(payload: AnalyticsPayload): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter((entry) => entry[1] !== undefined),
  );
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

export function trackBookingSubmit(status: 'attempt' | 'success' | 'error', payload: AnalyticsPayload = {}) {
  trackEvent(`cm_booking_submit_${status}`, payload);
}

export function trackLeadSubmit(status: 'attempt' | 'success' | 'error', payload: AnalyticsPayload = {}) {
  trackEvent(`cm_lead_submit_${status}`, payload);
}
