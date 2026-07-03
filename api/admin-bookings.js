import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { rateLimit } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ALLOWED_STATUSES = new Set(['confirmed', 'completed', 'cancelled']);
const ALLOWED_ORIGINS = new Set([
  'https://www.carmatch.vn',
  'https://carmatch.vn',
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return (
    ALLOWED_ORIGINS.has(origin) ||
    /^https:\/\/carmatch-web-[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
    /^https:\/\/carmatch-web\.vercel\.app$/i.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)
  );
}

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Pin');
  res.setHeader('Access-Control-Max-Age', '600');
}

function safeCompare(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (!a.length || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return String(req.headers['x-admin-pin'] || '').trim();
}

function isAuthorized(req) {
  return Boolean(process.env.ADMIN_PIN) && safeCompare(authToken(req), process.env.ADMIN_PIN);
}

function endOfDate(dateStr) {
  return `${dateStr}T23:59:59.999Z`;
}

export default async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return isAllowedOrigin(req.headers.origin || '') ? res.status(204).end() : res.status(403).end();
  }

  const authorized = isAuthorized(req);
  if (!authorized && !rateLimit(req, res, { id: 'admin-bookings:auth', windowMs: 10 * 60_000, max: 20 })) return;

  if (!authorized) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="carmatch-admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Service unavailable' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const { status, from, to } = req.query;
    let query = supabase
      .from('website_leads')
      .select('booking_ref, deposit_amount, source, name, phone, customer_type, form_type, quantity, duration, car_model, building, note, status, created_at')
      .eq('form_type', 'booking')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') query = query.eq('status', status);
    if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
    if (to) query = query.lte('created_at', endOfDate(to));

    const { data, error } = await query;
    if (error) {
      console.error('[admin-bookings] GET error:', error.message);
      return res.status(500).json({ error: 'Không thể tải danh sách booking' });
    }

    return res.status(200).json(data || []);
  }

  if (req.method === 'PATCH') {
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const bookingRef = String(body?.booking_ref || '').trim().toUpperCase();
    const nextStatus = String(body?.status || '').trim();
    if (!bookingRef) return res.status(400).json({ error: 'Missing booking_ref' });
    if (!ALLOWED_STATUSES.has(nextStatus)) return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabase
      .from('website_leads')
      .update({ status: nextStatus })
      .eq('form_type', 'booking')
      .eq('booking_ref', bookingRef)
      .select('booking_ref, deposit_amount, source, name, phone, customer_type, form_type, quantity, duration, car_model, building, note, status, created_at')
      .maybeSingle();

    if (error) {
      console.error('[admin-bookings] PATCH error:', error.message);
      return res.status(500).json({ error: 'Không thể cập nhật trạng thái' });
    }
    if (!data) return res.status(404).json({ error: 'Không tìm thấy booking' });

    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
