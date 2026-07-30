import { createClient } from '@supabase/supabase-js';
import { applyCors, isPreflightAllowed, rateLimit } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

// Event types that should appear as "blocked" to customers
const BLOCKING_TYPES = new Set([
  'rental',
  'blocked',
  'maintenance',
  'cleaning',
  'inspection',
  'transfer',
  'charging',
]);

// Statuses that mean the slot is definitely taken
const ACTIVE_STATUSES = ['planned', 'confirmed', 'in_progress', 'completed'];
const INACTIVE_ASSIGNMENT_STATUSES = new Set([
  'cancelled',
  'ignored',
  'needs_review',
  'rejected',
  'declined',
]);
const DEFAULT_TIMEZONE_OFFSET = '+07:00';

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayInVietnam() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateToStartAt(dateString) {
  return `${dateString}T00:00:00${DEFAULT_TIMEZONE_OFFSET}`;
}

function dateToExclusiveEndAt(dateString) {
  return `${addDays(dateString, 1)}T00:00:00${DEFAULT_TIMEZONE_OFFSET}`;
}

function datePartInVietnam(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

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

function isGeneratedAssignment(assignment) {
  return clean(assignment?.note).includes('Auto-linked by schedule-events-job');
}

function selectCurrentAssignments(assignments = []) {
  const activeAssignments = assignments.filter(
    (assignment) => !INACTIVE_ASSIGNMENT_STATUSES.has(clean(assignment.assignment_status)),
  );
  const byBooking = new Map();

  for (const assignment of activeAssignments) {
    const rows = byBooking.get(assignment.booking_id) || [];
    rows.push(assignment);
    byBooking.set(assignment.booking_id, rows);
  }

  const pickLatest = (rows) =>
    rows.slice().sort((a, b) => {
      const createdOrder = clean(b.created_at).localeCompare(clean(a.created_at));
      return createdOrder || clean(b.id).localeCompare(clean(a.id));
    })[0];

  const selected = [];
  for (const rows of byBooking.values()) {
    const manualRows = rows.filter((assignment) => !isGeneratedAssignment(assignment));
    selected.push(pickLatest(manualRows.length ? manualRows : rows));
  }
  return selected.filter(Boolean);
}

function isNonRentalBooking(booking = {}) {
  const serviceType = normalizeText(booking.service_type);
  const purpose = normalizeText(booking.purpose);
  const bookingCode = normalizeText(booking.booking_code).replace(/\s+/g, '');
  const requestedVehicle = normalizeText(booking.requested_vehicle_text);
  return Boolean(
    serviceType.includes('chi phi') ||
    purpose === 'chi phi' ||
    bookingCode.startsWith('cmotcpx') ||
    bookingCode.startsWith('cmotcpe') ||
    /^etc\b/.test(requestedVehicle) ||
    /^vetc\b/.test(requestedVehicle)
  );
}

/**
 * GET /api/vehicle-availability?vehicleId=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public endpoint — returns only date ranges + event type. No PII.
 * Dynamic: availability must reflect admin calendar changes immediately.
 */
export default async function handler(req, res) {
  applyCors(req, res, { methods: 'GET,OPTIONS' });
  if (req.method === 'OPTIONS') return isPreflightAllowed(req) ? res.status(204).end() : res.status(403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { id: 'vehicle-availability:get', windowMs: 60_000, max: 120 })) return;

  const { vehicleId, from, to } = req.query;

  if (!vehicleId) {
    return res.status(400).json({ error: 'vehicleId is required' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({
      blockedRanges: [],
      requires_confirmation: true,
      availability_unavailable: true,
    });
  }

  // Default window: today → 90 days ahead, in Vietnam local dates.
  const today = todayInVietnam();
  const ninetyDays = addDays(today, 90);
  const fromDate = from || today;
  const toDate = to || ninetyDays;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const vehicleResult = await supabase
      .from('vehicles')
      .select('ownership_type, company_id')
      .eq('id', vehicleId)
      .single();

    if (vehicleResult.error || !vehicleResult.data?.company_id) {
      console.error('[vehicle-availability] Vehicle lookup error:', vehicleResult.error?.message || 'vehicle not found');
      return res.status(200).json({
        blockedRanges: [],
        requires_confirmation: true,
        availability_unavailable: true,
      });
    }

    const companyId = vehicleResult.data.company_id;
    const [eventsResult, assignmentsResult] = await Promise.all([
      supabase
        .from('vehicle_schedule_events')
        .select('booking_id, vehicle_id, event_type, starts_at, ends_at, all_day, status, note, location_text, external_refs')
        .eq('company_id', companyId)
        .eq('vehicle_id', vehicleId)
        .in('status', ACTIVE_STATUSES)
        .lt('starts_at', dateToExclusiveEndAt(toDate))
        .gt('ends_at', dateToStartAt(fromDate))
        .order('starts_at'),
      supabase
        .from('booking_vehicles')
        .select('id, booking_id, vehicle_id, assigned_from, assigned_to, assignment_status, note, created_at')
        .eq('company_id', companyId)
        .or(`assigned_from.is.null,assigned_from.lte.${toDate}`)
        .or(`assigned_to.is.null,assigned_to.gte.${fromDate}`),
    ]);

    const { data, error } = eventsResult;
    const requiresConfirmation = vehicleResult.data.ownership_type === 'partner';

    if (error) {
      console.error('[vehicle-availability] Supabase error:', error.message);
      return res.status(200).json({
        blockedRanges: [],
        requires_confirmation: true,
        availability_unavailable: true,
      });
    }

    const selectedAssignments = assignmentsResult.error
      ? []
      : selectCurrentAssignments(assignmentsResult.data || []);
    const selectedAssignmentByBooking = new Map(
      selectedAssignments.map((assignment) => [assignment.booking_id, assignment]),
    );
    const selectedAssignmentIds = new Set(selectedAssignments.map((assignment) => assignment.id));

    const visibleEvents = (data || []).filter((event) => {
      const generatedBy = event.external_refs?.generated_by;
      const assignmentId = clean(event.external_refs?.assignment_id);
      if (generatedBy === 'booking-vehicle-sync' && assignmentId && !selectedAssignmentIds.has(assignmentId)) {
        return false;
      }

      const selectedAssignment = selectedAssignmentByBooking.get(event.booking_id);
      if (
        selectedAssignment &&
        !isGeneratedAssignment(selectedAssignment) &&
        selectedAssignment.vehicle_id !== event.vehicle_id
      ) {
        return false;
      }
      return true;
    });

    const eventRanges = visibleEvents
      .filter((e) => {
        // Exclude internal cost-tracking entries created by /vehicle-assignment-review.
        // These have note='FALSE' and location_text='Chi phí' — they are NOT real customer bookings.
        if (e.note === 'FALSE' || e.location_text === 'Chi phí') return false;
        return BLOCKING_TYPES.has(e.event_type);
      })
      .map((e) => ({
        from: datePartInVietnam(e.starts_at),
        to: e.ends_at ? addDays(datePartInVietnam(e.ends_at), -1) : datePartInVietnam(e.starts_at),
        type: e.event_type,
        allDay: e.all_day,
      }));

    let assignmentRanges = [];
    let availabilityUnavailable = Boolean(assignmentsResult.error);
    if (assignmentsResult.error) {
      console.error('[vehicle-availability] Assignment lookup error:', assignmentsResult.error.message);
    } else {
      const bookingIds = [...new Set(selectedAssignments.map((row) => row.booking_id).filter(Boolean))];

      if (bookingIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, status, service_type, purpose, booking_code, requested_vehicle_text, pickup_date, return_date')
          .eq('company_id', companyId)
          .in('id', bookingIds);

        if (bookingsError) {
          console.error('[vehicle-availability] Booking lookup error:', bookingsError.message);
          availabilityUnavailable = true;
        } else {
          const bookingsById = new Map((bookings || []).map((booking) => [booking.id, booking]));
          const eventBookingIds = new Set(visibleEvents.map((event) => event.booking_id).filter(Boolean));

          assignmentRanges = selectedAssignments
            .filter((assignment) => assignment.vehicle_id === vehicleId)
            .map((assignment) => ({ assignment, booking: bookingsById.get(assignment.booking_id) }))
            .filter(({ booking }) =>
              booking &&
              booking.status !== 'cancelled' &&
              !isNonRentalBooking(booking)
            )
            .filter(({ assignment }) => !eventBookingIds.has(assignment.booking_id))
            .map(({ assignment, booking }) => {
              const from = assignment.assigned_from || booking.pickup_date;
              const to = assignment.assigned_to || booking.return_date || from;
              return {
                from,
                to,
                type: 'rental',
                allDay: true,
              };
            })
            .filter((range) => range.from && range.to && range.from <= toDate && range.to >= fromDate);
        }
      }
    }

    const seenRanges = new Set();
    const blockedRanges = [...eventRanges, ...assignmentRanges].filter((range) => {
      const key = `${range.from}|${range.to}|${range.type}`;
      if (seenRanges.has(key)) return false;
      seenRanges.add(key);
      return true;
    });

    // Count website_leads (customer bookings) in last 7 days for social proof
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('website_leads')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .gte('created_at', sevenDaysAgo);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      blockedRanges,
      requires_confirmation: requiresConfirmation,
      recent_bookings_count: recentCount || 0,
      availability_unavailable: availabilityUnavailable,
    });
  } catch (err) {
    console.error('[vehicle-availability] Error:', err?.message);
    return res.status(200).json({
      blockedRanges: [],
      requires_confirmation: true,
      availability_unavailable: true,
    });
  }
}
