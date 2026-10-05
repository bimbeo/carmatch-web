const TRACKED_EVENT_NAMES = new Set([
  'view_item',
  'begin_checkout',
  'cm_booking_validation_error',
  'cm_booking_submit_attempt',
  'cm_booking_submit_success',
  'cm_booking_submit_error',
  'generate_lead',
  'cm_phone_click',
  'cm_zalo_click',
  'cm_cta_click',
]);

const RESPONDED_STATUSES = new Set(['contacted', 'converted', 'lost']);
const OPEN_STATUSES = new Set(['new', 'partner_pending']);

function cleanText(value, maxLength = 200) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function safeTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function isTrackedConversionEvent(eventName) {
  return TRACKED_EVENT_NAMES.has(String(eventName || ''));
}

export function sanitizeAttribution(value) {
  const attribution = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    session_id: cleanText(attribution.session_id, 100),
    first_seen_at: safeTimestamp(attribution.first_seen_at),
    landing_page: cleanText(attribution.landing_page, 500),
    referrer_host: cleanText(attribution.referrer_host, 200),
    traffic_source: cleanText(attribution.traffic_source, 120) || 'direct',
    traffic_medium: cleanText(attribution.traffic_medium, 120) || '(none)',
    traffic_campaign: cleanText(attribution.traffic_campaign, 200),
    traffic_term: cleanText(attribution.traffic_term, 200),
    traffic_content: cleanText(attribution.traffic_content, 200),
    gclid: cleanText(attribution.gclid, 200),
    fbclid: cleanText(attribution.fbclid, 200),
    device_type: ['mobile', 'tablet', 'desktop'].includes(attribution.device_type)
      ? attribution.device_type
      : 'unknown',
  };
}

export function buildConversionEventInsert({ companyId, body, receivedAt = new Date() }) {
  const eventName = cleanText(body?.event_name, 80);
  const eventId = cleanText(body?.event_id, 100);
  const attribution = sanitizeAttribution(body?.attribution);
  if (!isTrackedConversionEvent(eventName)) throw new Error('Unsupported event');
  if (!eventId || !/^[a-zA-Z0-9_-]{12,100}$/.test(eventId)) throw new Error('Invalid event_id');
  if (!attribution.session_id || !/^[a-zA-Z0-9_-]{12,100}$/.test(attribution.session_id)) {
    throw new Error('Invalid session_id');
  }

  const rawMetadata = body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {};
  const metadata = Object.fromEntries(
    Object.entries(rawMetadata)
      .filter(([key, value]) => key.length <= 80 && ['string', 'number', 'boolean'].includes(typeof value))
      .slice(0, 30)
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 500) : value]),
  );
  const vehicleId = cleanText(body?.vehicle_id || metadata.vehicle_id, 80);

  return {
    company_id: companyId,
    event_id: eventId,
    session_id: attribution.session_id,
    event_name: eventName,
    event_at: safeTimestamp(body?.client_at) || receivedAt.toISOString(),
    page_path: cleanText(body?.page_path, 500),
    landing_page: attribution.landing_page,
    traffic_source: attribution.traffic_source,
    traffic_medium: attribution.traffic_medium,
    traffic_campaign: attribution.traffic_campaign,
    traffic_term: attribution.traffic_term,
    traffic_content: attribution.traffic_content,
    referrer_host: attribution.referrer_host,
    car_slug: cleanText(body?.car_slug || metadata.car_slug, 200),
    vehicle_id: vehicleId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vehicleId)
      ? vehicleId
      : null,
    booking_ref: cleanText(body?.booking_ref || metadata.booking_ref, 100),
    device_type: attribution.device_type,
    metadata,
  };
}

export function buildLeadStatusUpdate(existing, nextStatus, { now = new Date(), outcomeReason = null } = {}) {
  if (!RESPONDED_STATUSES.has(nextStatus)) throw new Error('Invalid status');
  const timestamp = now.toISOString();
  const update = {
    status: nextStatus,
    last_status_at: timestamp,
  };
  if (!existing?.first_response_at) update.first_response_at = timestamp;
  if (nextStatus === 'lost') {
    update.outcome_reason = cleanText(outcomeReason, 200) || 'Không xác định';
  } else if (nextStatus === 'converted') {
    update.outcome_reason = null;
  }
  return update;
}

function uniqueCount(rows, eventName, keySelector = (row) => row.session_id) {
  return new Set(
    rows.filter((row) => row.event_name === eventName).map(keySelector).filter(Boolean),
  ).size;
}

function percentage(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

export function summarizeConversionData(events = [], bookings = [], now = new Date()) {
  const vehicleViews = uniqueCount(events, 'view_item');
  const checkoutStarts = uniqueCount(events, 'begin_checkout');
  const leadSubmits = uniqueCount(
    events,
    'generate_lead',
    (row) => row.booking_ref || row.session_id,
  );
  const convertedBookings = bookings.filter((booking) => booking.status === 'converted').length;
  const phoneSessions = uniqueCount(events, 'cm_phone_click');
  const zaloSessions = uniqueCount(events, 'cm_zalo_click');
  const ctaSessions = uniqueCount(events, 'cm_cta_click');
  const contactSessions = new Set(
    events
      .filter((event) => ['cm_phone_click', 'cm_zalo_click'].includes(event.event_name))
      .map((event) => event.session_id)
      .filter(Boolean),
  ).size;

  const responded = bookings.filter((booking) => booking.first_response_at && booking.created_at);
  const responseMinutes = responded.map((booking) => Math.max(
    0,
    (new Date(booking.first_response_at).getTime() - new Date(booking.created_at).getTime()) / 60_000,
  ));
  const withinTen = responseMinutes.filter((minutes) => minutes <= 10).length;
  const overdueOpen = bookings.filter((booking) => (
    OPEN_STATUSES.has(booking.status)
    && now.getTime() - new Date(booking.created_at).getTime() > 10 * 60_000
  )).length;

  const sourceMap = new Map();
  for (const booking of bookings) {
    const attribution = booking.attribution && typeof booking.attribution === 'object'
      ? booking.attribution
      : {};
    const source = cleanText(attribution.traffic_source, 120) || 'direct';
    const current = sourceMap.get(source) || { source, bookings: 0, converted: 0, value: 0 };
    current.bookings += 1;
    if (booking.status === 'converted') current.converted += 1;
    current.value += Number(booking.total_amount || 0);
    sourceMap.set(source, current);
  }

  return {
    funnel: {
      vehicle_views: vehicleViews,
      checkout_starts: checkoutStarts,
      lead_submits: leadSubmits,
      converted_bookings: convertedBookings,
      view_to_checkout_rate: percentage(checkoutStarts, vehicleViews),
      checkout_to_lead_rate: percentage(leadSubmits, checkoutStarts),
      lead_to_converted_rate: percentage(convertedBookings, leadSubmits || bookings.length),
    },
    contact: {
      phone_sessions: phoneSessions,
      zalo_sessions: zaloSessions,
      cta_sessions: ctaSessions,
      contact_sessions: contactSessions,
      view_to_contact_rate: percentage(contactSessions, vehicleViews),
    },
    sla: {
      responded_count: responded.length,
      average_response_minutes: responseMinutes.length
        ? Math.round((responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length) * 10) / 10
        : 0,
      within_10_minutes_count: withinTen,
      within_10_minutes_rate: percentage(withinTen, responseMinutes.length),
      overdue_open_count: overdueOpen,
    },
    sources: [...sourceMap.values()].sort((left, right) => right.bookings - left.bookings),
  };
}
