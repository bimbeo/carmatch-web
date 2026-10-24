export interface AttributionSnapshot {
  visitor_id: string;
  session_id: string;
  first_seen_at: string;
  landing_page: string;
  referrer_host: string | null;
  traffic_source: string;
  traffic_medium: string;
  traffic_campaign: string | null;
  traffic_term: string | null;
  traffic_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  device_type: 'mobile' | 'tablet' | 'desktop';
  is_returning_visitor: boolean;
}

type StoredSession = {
  attribution: AttributionSnapshot;
  last_activity_at: string;
};

const VISITOR_KEY = 'carmatch_visitor_v1';
const SESSION_KEY = 'carmatch_session_v2';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function safeValue(value: string | null, maxLength = 200) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function createId(prefix: string) {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

function getReferrerHost() {
  if (!document.referrer) return null;
  try {
    const referrer = new URL(document.referrer);
    return referrer.host === window.location.host ? null : referrer.host.slice(0, 200);
  } catch {
    return null;
  }
}

function classifyTraffic(params: URLSearchParams, referrerHost: string | null) {
  const utmSource = safeValue(params.get('utm_source'), 120);
  const utmMedium = safeValue(params.get('utm_medium'), 120);
  if (utmSource) return { source: utmSource, medium: utmMedium || 'campaign' };
  if (params.get('gclid')) return { source: 'google', medium: 'cpc' };
  if (params.get('fbclid')) return { source: 'facebook', medium: 'social' };
  if (!referrerHost) return { source: 'direct', medium: '(none)' };
  if (/google\./i.test(referrerHost)) return { source: 'google', medium: 'organic' };
  if (/facebook\.|instagram\./i.test(referrerHost)) return { source: 'meta', medium: 'social' };
  if (/zalo\./i.test(referrerHost)) return { source: 'zalo', medium: 'referral' };
  return { source: referrerHost, medium: 'referral' };
}

function getDeviceType(): AttributionSnapshot['device_type'] {
  if (window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet';
  return 'desktop';
}

export function getAttributionSnapshot(): AttributionSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const now = new Date();
    const visitorStored = localStorage.getItem(VISITOR_KEY);
    const visitorId = visitorStored || createId('cmv');
    if (!visitorStored) localStorage.setItem(VISITOR_KEY, visitorId);

    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredSession;
      const lastActivity = new Date(parsed.last_activity_at).getTime();
      if (
        parsed.attribution?.session_id
        && Number.isFinite(lastActivity)
        && now.getTime() - lastActivity <= SESSION_TIMEOUT_MS
      ) {
        const attribution = { ...parsed.attribution, device_type: getDeviceType() };
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          attribution,
          last_activity_at: now.toISOString(),
        } satisfies StoredSession));
        return attribution;
      }
    }

    const params = new URLSearchParams(window.location.search);
    const referrerHost = getReferrerHost();
    const traffic = classifyTraffic(params, referrerHost);
    const snapshot: AttributionSnapshot = {
      visitor_id: visitorId,
      session_id: createId('cms'),
      first_seen_at: now.toISOString(),
      landing_page: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      referrer_host: referrerHost,
      traffic_source: traffic.source,
      traffic_medium: traffic.medium,
      traffic_campaign: safeValue(params.get('utm_campaign')),
      traffic_term: safeValue(params.get('utm_term')),
      traffic_content: safeValue(params.get('utm_content')),
      gclid: safeValue(params.get('gclid')),
      fbclid: safeValue(params.get('fbclid')),
      device_type: getDeviceType(),
      is_returning_visitor: Boolean(visitorStored),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      attribution: snapshot,
      last_activity_at: now.toISOString(),
    } satisfies StoredSession));
    return snapshot;
  } catch {
    return null;
  }
}

export function createAnalyticsEventId() {
  return createId('cme');
}
