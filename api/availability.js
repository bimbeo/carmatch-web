import { createClient } from '@supabase/supabase-js';
import { applyCors, isPreflightAllowed, rateLimit } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

const ACTIVE_EVENT_STATUSES = ['planned', 'confirmed', 'in_progress', 'completed'];
const BLOCKING_EVENT_TYPES = new Set([
  'rental', 'reserved', 'blocked', 'unavailable', 'maintenance', 'cleaning', 'inspection', 'transfer', 'charging',
]);
const INACTIVE_ASSIGNMENT_STATUSES = new Set(['cancelled', 'ignored', 'needs_review', 'rejected', 'declined']);
const VIETNAM_OFFSET = '+07:00';

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeText(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateStartAt(dateString) {
  return `${dateString}T00:00:00${VIETNAM_OFFSET}`;
}

function dateExclusiveEndAt(dateString) {
  return `${addDays(dateString, 1)}T00:00:00${VIETNAM_OFFSET}`;
}

function parseDateTimePart(value) {
  const raw = clean(value);
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (isoMatch) {
    const [, y, m, d, hh = '20', mm = '00'] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
  }
  const vnMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (vnMatch) {
    const [, d, m, y, hh = '20', mm = '00'] = vnMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDuration(duration) {
  const [fromRaw, toRaw] = String(duration || '').split('→').map((part) => part.trim());
  if (!fromRaw || !toRaw) return null;
  const from = parseDateTimePart(fromRaw);
  const to = parseDateTimePart(toRaw);
  return from && to ? { from, to } : null;
}

function requestedDateAt(dateString, hourValue, fallbackHour = 20) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ''))) return null;
  const parsedHour = Number(hourValue);
  const hour = Number.isInteger(parsedHour) && parsedHour >= 7 && parsedHour <= 23
    ? parsedHour
    : fallbackHour;
  return parseDateTimePart(`${dateString} ${String(hour).padStart(2, '0')}:00`);
}

function isGeneratedAssignment(assignment) {
  return clean(assignment?.note).includes('Auto-linked by schedule-events-job');
}

function selectCurrentAssignments(assignments = []) {
  const byBooking = new Map();
  assignments
    .filter((assignment) => !INACTIVE_ASSIGNMENT_STATUSES.has(clean(assignment.assignment_status)))
    .forEach((assignment) => {
      const rows = byBooking.get(assignment.booking_id) || [];
      rows.push(assignment);
      byBooking.set(assignment.booking_id, rows);
    });

  const pickLatest = (rows) => rows.slice().sort((a, b) => {
    const createdOrder = clean(b.created_at).localeCompare(clean(a.created_at));
    return createdOrder || clean(b.id).localeCompare(clean(a.id));
  })[0];

  return [...byBooking.values()]
    .map((rows) => {
      const manualRows = rows.filter((assignment) => !isGeneratedAssignment(assignment));
      return pickLatest(manualRows.length ? manualRows : rows);
    })
    .filter(Boolean);
}

function isNonRentalBooking(booking = {}) {
  const serviceType = normalizeText(booking.service_type);
  const purpose = normalizeText(booking.purpose);
  const bookingCode = normalizeText(booking.booking_code).replace(/\s+/g, '');
  const requestedVehicle = normalizeText(booking.requested_vehicle_text);
  return serviceType.includes('chi phi') ||
    purpose === 'chi phi' ||
    bookingCode.startsWith('cmotcpx') ||
    bookingCode.startsWith('cmotcpe') ||
    /^etc\b/.test(requestedVehicle) ||
    /^vetc\b/.test(requestedVehicle);
}

export default async function handler(req, res) {
  applyCors(req, res, { methods: 'GET,OPTIONS' });
  if (req.method === 'OPTIONS') return isPreflightAllowed(req) ? res.status(204).end() : res.status(403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { id: 'availability:get', windowMs: 60_000, max: 120 })) return;

  const pickup = clean(req.query.pickup);
  const returnDate = clean(req.query.return);
  const requestedPickup = requestedDateAt(pickup, req.query.pickupHour);
  const requestedReturn = requestedDateAt(returnDate, req.query.returnHour);
  if (!requestedPickup || !requestedReturn || requestedReturn <= requestedPickup) {
    return res.status(400).json({ error: 'Invalid date range' });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: 'Lịch xe chưa được cấu hình' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, company_id, display_name')
      .eq('status', 'available')
      .eq('published', true);
    if (vehiclesError) throw vehiclesError;

    const vehicleIds = (vehicles || []).map((vehicle) => vehicle.id).filter(Boolean);
    const companyIds = [...new Set((vehicles || []).map((vehicle) => vehicle.company_id).filter(Boolean))];
    if (vehicleIds.length === 0 || companyIds.length === 0) {
      return res.status(200).json({ unavailable_vehicle_ids: [], unavailable_models: [] });
    }

    const [eventsResult, assignmentsResult, leadsResult, reservationsResult] = await Promise.all([
      supabase
        .from('vehicle_schedule_events')
        .select('booking_id, vehicle_id, event_type, starts_at, ends_at, status, note, location_text, external_refs')
        .in('vehicle_id', vehicleIds)
        .in('status', ACTIVE_EVENT_STATUSES)
        .lt('starts_at', dateExclusiveEndAt(returnDate))
        .gt('ends_at', dateStartAt(pickup)),
      supabase
        .from('booking_vehicles')
        .select('id, booking_id, vehicle_id, assigned_from, assigned_to, assignment_status, note, created_at')
        .in('company_id', companyIds)
        .or(`assigned_from.is.null,assigned_from.lte.${returnDate}`)
        .or(`assigned_to.is.null,assigned_to.gte.${pickup}`),
      supabase
        .from('website_leads')
        .select('car_model, duration')
        .eq('form_type', 'booking')
        .not('status', 'in', '("cancelled","completed")'),
      supabase
        .from('vehicle_reservations')
        .select('vehicle_id,status,active_until,starts_at,ends_at')
        .in('vehicle_id', vehicleIds)
        .in('status', ['held', 'confirmed'])
        .lt('starts_at', requestedReturn.toISOString())
        .gt('ends_at', requestedPickup.toISOString()),
    ]);
    if (eventsResult.error) throw eventsResult.error;
    if (assignmentsResult.error) throw assignmentsResult.error;
    if (leadsResult.error) throw leadsResult.error;
    if (reservationsResult.error) throw reservationsResult.error;

    const selectedAssignments = selectCurrentAssignments(assignmentsResult.data || []);
    const assignmentIds = new Set(selectedAssignments.map((assignment) => assignment.id));
    const manualVehicleByBooking = new Map();
    selectedAssignments.forEach((assignment) => {
      if (!isGeneratedAssignment(assignment)) manualVehicleByBooking.set(assignment.booking_id, assignment.vehicle_id);
    });
    const bookingIds = [...new Set([
      ...selectedAssignments.map((assignment) => assignment.booking_id),
      ...(eventsResult.data || []).map((event) => event.booking_id),
    ].filter(Boolean))];
    const { data: bookings, error: bookingsError } = bookingIds.length > 0
      ? await supabase
        .from('bookings')
        .select('id, status, service_type, purpose, booking_code, requested_vehicle_text, pickup_date, return_date')
        .in('id', bookingIds)
      : { data: [], error: null };
    if (bookingsError) throw bookingsError;
    const bookingsById = new Map((bookings || []).map((booking) => [booking.id, booking]));

    const unavailableVehicleIds = new Set();
    (eventsResult.data || []).forEach((event) => {
      const assignmentId = clean(event.external_refs?.assignment_id);
      if (event.external_refs?.generated_by === 'booking-vehicle-sync' && assignmentId && !assignmentIds.has(assignmentId)) return;
      if (event.booking_id && manualVehicleByBooking.has(event.booking_id) && event.vehicle_id !== manualVehicleByBooking.get(event.booking_id)) return;
      const booking = event.booking_id ? bookingsById.get(event.booking_id) : null;
      if (booking && (booking.status === 'cancelled' || isNonRentalBooking(booking))) return;
      if (event.note === 'FALSE' || event.location_text === 'Chi phí') return;
      if (BLOCKING_EVENT_TYPES.has(event.event_type)) unavailableVehicleIds.add(event.vehicle_id);
    });

    selectedAssignments.forEach((assignment) => {
      const booking = bookingsById.get(assignment.booking_id);
      if (!booking || booking.status === 'cancelled' || isNonRentalBooking(booking)) return;
      const assignedFrom = clean(assignment.assigned_from || booking.pickup_date);
      const assignedTo = clean(assignment.assigned_to || booking.return_date || assignedFrom);
      if (!assignedFrom || !assignedTo || assignedFrom > returnDate || assignedTo < pickup) return;
      unavailableVehicleIds.add(assignment.vehicle_id);
    });

    const now = Date.now();
    (reservationsResult.data || []).forEach((reservation) => {
      if (reservation.status === 'held' && (!reservation.active_until || new Date(reservation.active_until).getTime() <= now)) return;
      unavailableVehicleIds.add(reservation.vehicle_id);
    });

    const unavailableModels = new Set();
    (leadsResult.data || []).forEach((row) => {
      const existing = parseDuration(row.duration);
      if (row.car_model && existing && existing.from < requestedReturn && existing.to > requestedPickup) {
        unavailableModels.add(row.car_model);
      }
    });

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      unavailable_vehicle_ids: [...unavailableVehicleIds],
      unavailable_models: [...unavailableModels],
    });
  } catch (err) {
    console.error('[availability] Error:', err?.message);
    return res.status(503).json({ error: 'Không kiểm tra được lịch xe' });
  }
}
