import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'node:crypto';
import { rateLimit } from './_security.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const COMPANY_CODE = 'carmatch';

// Push cho team khi có đơn đặt xe mới từ website. Phải await trước khi trả
// response — Vercel đóng băng Lambda ngay sau res.json(), fire-and-forget
// phía sau response sẽ bị cắt ngang giữa chừng (đã gặp với promo tracking).
async function sendPushToCompany(supabase, payload) {
  try {
    const { data: company } = await supabase
      .from('companies').select('id').eq('code', COMPANY_CODE).single();
    if (!company) return;

    const { data: subs } = await supabase
      .from('push_subscriptions').select('endpoint, p256dh, auth').eq('company_id', company.id);
    if (!subs || subs.length === 0) return;

    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return;

    const webpush = (await import('web-push')).default;
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@carmatch.vn', publicKey, privateKey);

    const message = JSON.stringify(payload);
    const staleEndpoints = [];
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            message
          );
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) staleEndpoints.push(sub.endpoint);
        }
      })
    );
    if (staleEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    }
  } catch (err) {
    console.error('[bookings] push error', err.message);
  }
}
const MAX_PROOF_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);
const IMAGE_MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};
const ALLOWED_ORIGINS = new Set([
  'https://www.carmatch.vn',
  'https://carmatch.vn',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS = 3600;
const CUSTOMER_SELECT =
  'id, full_name, loyalty_tier, referral_code, first_seen_at, last_rental_at, email, phone, normalized_phone, status';
const HOLIDAY_PRICING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVE_SCHEDULE_STATUSES = ['planned', 'confirmed', 'in_progress', 'completed'];
// Keep this list inside the `vehicle_schedule_event_type` enum defined by
// 202605070003_vehicle_schedule_events.sql. PostgREST rejects the entire query
// when even one unknown enum value is passed to `.in(...)`.
export const BLOCKING_SCHEDULE_TYPES = [
  'rental', 'blocked', 'maintenance', 'cleaning', 'inspection', 'transfer', 'charging',
];

function addCalendarDays(dateString, count) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function datePartInVietnam(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const vietnam = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vietnam.toISOString().slice(0, 10);
}

export function scheduleEventCalendarRange(event) {
  const from = datePartInVietnam(event?.starts_at);
  const exclusiveEnd = datePartInVietnam(event?.ends_at || event?.starts_at);
  if (!from || !exclusiveEnd) return null;
  const candidateTo = addCalendarDays(exclusiveEnd, -1);
  return { from, to: candidateTo < from ? from : candidateTo };
}

export function isBoundaryScheduleConflict(event, pickupDate, returnDate) {
  const range = scheduleEventCalendarRange(event);
  if (!range) return false;
  return range.to === pickupDate || range.from === returnDate;
}

function isBlockingScheduleConflict(event) {
  if (!ACTIVE_SCHEDULE_STATUSES.includes(event?.status)) return false;
  if (!BLOCKING_SCHEDULE_TYPES.includes(event?.event_type)) return false;
  if (event?.note === 'FALSE' || event?.location_text === 'Chi phí') return false;
  return true;
}

export function classifyScheduleConflicts(events, pickupDate, returnDate) {
  const blocking = (events || []).filter(isBlockingScheduleConflict);
  const boundary = blocking.filter((event) => (
    isBoundaryScheduleConflict(event, pickupDate, returnDate)
  ));
  return {
    blocking,
    boundary,
    hasHardConflict: blocking.length > boundary.length,
  };
}

function extractPaymentProofStoragePath(fileUrl = '') {
  const marker = '/object/public/payment-proofs/';
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  return fileUrl.slice(idx + marker.length).split('?')[0];
}

async function resolvePaymentProofUrl(supabase, value) {
  if (!value) return null;
  const path = /^https?:\/\//i.test(value) ? extractPaymentProofStoragePath(value) : value;
  if (!path) return value; // legacy URL không nhận diện được path — trả nguyên trạng
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(path, PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error('[bookings] signed proof url error:', error.message);
    return null;
  }
  return data?.signedUrl || null;
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
}

function normalizePhone(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

function toVietnamPhone84(normalizedPhone) {
  return normalizedPhone.startsWith('0') ? `84${normalizedPhone.slice(1)}` : normalizedPhone;
}

function sameEmail(a = '', b = '') {
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function getGoogleDisplayName(user) {
  const meta = user?.user_metadata || {};
  const candidates = [
    meta.full_name,
    meta.name,
    user?.email ? String(user.email).split('@')[0] : '',
  ];
  return candidates.map((value) => String(value || '').trim()).find(Boolean) || 'Khách Car Match';
}

function referralCandidate(normalizedPhone) {
  const suffix = normalizedPhone.slice(-4) || '0000';
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CM${suffix}${random}`;
}

async function createReferralCode(supabase, normalizedPhone) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = referralCandidate(normalizedPhone);
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();
    if (!error && !data) return code;
  }
  return null;
}

async function findActiveCustomerByPhone(supabase, normalizedPhone) {
  const phone84 = toVietnamPhone84(normalizedPhone);
  return supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .or(`phone.eq.${normalizedPhone},phone.eq.${phone84},normalized_phone.eq.${normalizedPhone},normalized_phone.eq.${phone84}`)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
}

async function createWebsiteAccountCustomer(supabase, user, normalizedPhone) {
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('code', COMPANY_CODE)
    .maybeSingle();

  if (companyError || !company?.id) {
    console.error('[bookings] link-phone company lookup error:', companyError?.message || 'missing company');
    throw new Error('Chưa tạo được hồ sơ khách hàng');
  }

  const referralCode = await createReferralCode(supabase, normalizedPhone);
  const fullName = getGoogleDisplayName(user);
  const now = new Date().toISOString();
  const payload = {
    company_id: company.id,
    full_name: fullName,
    phone: normalizedPhone,
    normalized_phone: normalizedPhone,
    email: user.email || null,
    customer_type: 'individual',
    source_channel: 'website_account',
    status: 'active',
    loyalty_tier: 'new',
    referral_code: referralCode,
    first_seen_at: now.slice(0, 10),
    note: `Tạo từ tài khoản website Google (${user.email || 'no-email'})`,
    profile_updated_at: now,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(payload)
    .select(CUSTOMER_SELECT)
    .single();

  if (!error) return data;

  if (error.code === '23505') {
    const { data: existing, error: lookupError } = await findActiveCustomerByPhone(supabase, normalizedPhone);
    if (!lookupError && existing) return existing;
  }

  console.error('[bookings] link-phone create customer error:', error.message);
  throw new Error('Chưa tạo được hồ sơ khách hàng');
}

function publicCustomerPayload(customer) {
  return {
    customer_id: customer.id,
    full_name: customer.full_name,
    loyalty_tier: customer.loyalty_tier,
    referral_code: customer.referral_code,
    first_seen_at: customer.first_seen_at,
    last_rental_at: customer.last_rental_at,
  };
}

function maskPhone(raw = '') {
  const phone = normalizePhone(raw);
  if (phone.length < 4) return '';
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

function getBookingRef(raw = '') {
  return String(raw).trim().toUpperCase();
}

function decodeProofImage(fileBase64 = '', fileName = '') {
  const base64Clean = String(fileBase64).replace(/^data:image\/[a-z0-9+.-]+;base64,/i, '');
  if (base64Clean.length > Math.ceil(MAX_PROOF_BYTES * 1.4)) {
    throw new Error('Ảnh quá lớn, vui lòng chọn ảnh dưới 8MB');
  }
  const buffer = Buffer.from(base64Clean, 'base64');
  if (!buffer.length) throw new Error('File không hợp lệ');
  if (buffer.length > MAX_PROOF_BYTES) throw new Error('Ảnh quá lớn, vui lòng chọn ảnh dưới 8MB');

  const ext = String(fileName).split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC');
  }

  return {
    buffer,
    ext: ext === 'jpeg' ? 'jpg' : ext,
    contentType: IMAGE_MIME_BY_EXT[ext] || 'image/jpeg',
  };
}

async function getBookingByRef(supabase, bookingRef) {
  const { data, error } = await supabase
    .from('website_leads')
    .select('booking_ref, name, phone, car_model, duration, deposit_amount, note, status, created_at, building, payment_proof_url')
    .eq('booking_ref', bookingRef)
    .eq('form_type', 'booking')
    .maybeSingle();

  if (error) {
    console.error('[bookings] lookup error:', error.message);
    throw new Error('Lỗi tra cứu');
  }
  return data;
}

function assertBookingPhone(data, phone) {
  if (!data) return { ok: false, status: 404, error: 'Không tìm thấy đơn đặt xe này' };
  const inputPhone = normalizePhone(phone);
  const bookingPhone = normalizePhone(data.phone);
  if (!inputPhone || inputPhone !== bookingPhone) {
    return { ok: false, status: 403, error: 'Mã booking hoặc số điện thoại không đúng' };
  }
  return { ok: true };
}

function normalizeHolidayDate(value) {
  const date = String(value || '').trim();
  return HOLIDAY_PRICING_DATE_PATTERN.test(date) ? date : '';
}

function parseHolidayDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toHolidayDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addHolidayDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function getBillableHolidayDateStrings(pickupDateValue, pickupHourValue, returnDateValue) {
  const pickupDate = normalizeHolidayDate(pickupDateValue);
  const returnDate = normalizeHolidayDate(returnDateValue);
  if (!pickupDate || !returnDate) return [];

  const pickup = parseHolidayDate(pickupDate);
  const dropoff = parseHolidayDate(returnDate);
  if (!pickup || !dropoff) return [];

  const pickupHour = Number(pickupHourValue);
  const firstBillableDay = pickupHour >= 16 && dropoff > pickup
    ? addHolidayDays(pickup, 1)
    : pickup;
  const from = firstBillableDay <= dropoff ? firstBillableDay : pickup;
  const to = firstBillableDay <= dropoff ? dropoff : pickup;

  const dates = [];
  for (let current = from, guard = 0; current <= to && guard < 370; current = addHolidayDays(current, 1), guard += 1) {
    dates.push(toHolidayDateStr(current));
  }
  return dates;
}

async function loadActiveHolidayPricingRules(supabase) {
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('code', COMPANY_CODE)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company?.id) return [];

  let { data, error } = await supabase
    .from('holiday_pricing_rules')
    .select('id,name,start_date,end_date,adjustment_type,adjustment_value,booking_windows')
    .eq('company_id', company.id)
    .eq('active', true)
    .order('start_date', { ascending: true });
  if (error && /booking_windows|column/i.test(error.message || '')) {
    ({ data, error } = await supabase
      .from('holiday_pricing_rules')
      .select('id,name,start_date,end_date,adjustment_type,adjustment_value')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('start_date', { ascending: true }));
  }
  if (error && /holiday_pricing_rules|relation|schema cache/i.test(error.message || '')) {
    console.warn('[bookings] holiday pricing rules unavailable; continuing without holiday policy');
    return [];
  }
  if (error) throw error;

  return (data || []).map((rule) => ({
    ...rule,
    adjustment_value: Number(rule.adjustment_value),
    booking_windows: Array.isArray(rule.booking_windows) ? rule.booking_windows : [],
  }));
}

function formatHolidayDateForMessage(dateStr) {
  const [, month, day] = String(dateStr).split('-');
  return `${Number(day)}/${Number(month)}`;
}

function collectHolidayBookingWindows(rules) {
  const seen = new Set();
  const windows = [];
  for (const rule of rules) {
    for (const item of Array.isArray(rule.booking_windows) ? rule.booking_windows : []) {
      const pickupDate = normalizeHolidayDate(item?.pickup_date);
      const returnDate = normalizeHolidayDate(item?.return_date);
      if (!pickupDate || !returnDate) continue;
      const key = `${pickupDate}:${returnDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      windows.push({
        pickup_date: pickupDate,
        return_date: returnDate,
        label: typeof item?.label === 'string' ? item.label.trim() : '',
        adjustment_value: Math.max(0, Number(item?.adjustment_value ?? rule.adjustment_value) || 0),
        rule_id: rule.id,
        rule_name: rule.name,
      });
    }
  }
  return windows;
}

function describeHolidayBookingWindows(windows) {
  if (!windows.length) return 'Kỳ lễ này không nhận đặt lẻ ngày. Vui lòng chọn đúng combo lễ hoặc liên hệ Car Match.';
  const labels = windows.map((window) => (
    window.label || `${formatHolidayDateForMessage(window.pickup_date)}–${formatHolidayDateForMessage(window.return_date)}`
  ));
  return `Kỳ lễ này chỉ nhận ${labels.join(', ')}. Đặt lẻ ngày không nhận.`;
}

function holidayDateCoveredByRule(rules, date) {
  return rules.some((rule) => rule.start_date <= date && rule.end_date >= date);
}

export function findHolidayCombo(rules, pickupDate, returnDate) {
  for (const rule of rules) {
    const window = (Array.isArray(rule.booking_windows) ? rule.booking_windows : []).find((item) => (
      item?.pickup_date === pickupDate && item?.return_date === returnDate
    ));
    if (window) return { rule, window };
  }
  return null;
}

function validateHolidayPricingSnapshot(pricing, rules, expectedHolidayDates) {
  const expectedSet = new Set(expectedHolidayDates);
  if (expectedSet.size === 0) return pricing.length === 0;
  if (!pricing.length) return false;

  const rulesById = new Map(rules.map((rule) => [String(rule.id), rule]));
  const seenDates = new Set();

  for (const item of pricing) {
    const rule = rulesById.get(String(item.rule_id));
    if (!rule) return false;
    if (item.adjustment_type !== rule.adjustment_type) return false;
    if (Number(item.adjustment_value) !== Number(rule.adjustment_value)) return false;
    if (item.pricing_mode === 'combo') {
      const comboWindow = (Array.isArray(rule.booking_windows) ? rule.booking_windows : []).find((window) => (
        String(window?.label || '') === String(item.booking_window_label || '')
        && Number(window?.adjustment_value ?? rule.adjustment_value) === Number(item.combo_adjustment_value)
      ));
      const comboPickup = parseHolidayDate(comboWindow?.pickup_date);
      const comboReturn = parseHolidayDate(comboWindow?.return_date);
      if (!comboWindow || !comboPickup || !comboReturn) return false;
      const expectedComboDays = Math.max(1, Math.round((Date.UTC(comboReturn.getFullYear(), comboReturn.getMonth(), comboReturn.getDate())
        - Date.UTC(comboPickup.getFullYear(), comboPickup.getMonth(), comboPickup.getDate())) / 86_400_000) + 1);
      if (Number(item.combo_days) !== expectedComboDays) return false;
    }

    for (const date of item.dates || []) {
      if (!expectedSet.has(date)) return false;
      if (date < rule.start_date || date > rule.end_date) return false;
      if (seenDates.has(date)) return false;
      seenDates.add(date);
    }
  }

  return seenDates.size === expectedSet.size
    && [...expectedSet].every((date) => seenDates.has(date));
}

/**
 * Load Zalo access token from Supabase app_config.
 * Auto-refreshes if the token expires within 30 minutes.
 * Falls back to ZALO_OA_ACCESS_TOKEN env var on first run or DB error.
 */
async function getZaloAccessToken(supabase) {
  try {
    const { data: rows } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['zalo_access_token', 'zalo_refresh_token', 'zalo_access_token_expires_at']);

    const cfg = Object.fromEntries((rows || []).map(r => [r.key, r.value]));

    let accessToken = cfg.zalo_access_token;
    let refreshToken = cfg.zalo_refresh_token;
    const expiresAt = cfg.zalo_access_token_expires_at;

    // Seed from env on first run (placeholder value in DB)
    if (!accessToken || accessToken === 'LOAD_FROM_ENV') {
      accessToken = process.env.ZALO_OA_ACCESS_TOKEN || '';
    }
    if (!refreshToken || refreshToken === 'LOAD_FROM_ENV') {
      refreshToken = process.env.ZALO_OA_REFRESH_TOKEN || '';
    }

    // Refresh if expiry unknown or within 30 minutes
    const needsRefresh = !expiresAt
      || expiresAt === 'LOAD_FROM_ENV'
      || new Date(expiresAt) < new Date(Date.now() + 30 * 60 * 1000);

    if (needsRefresh && refreshToken && refreshToken !== 'LOAD_FROM_ENV') {
      const appId = process.env.ZALO_APP_ID;
      const appSecret = process.env.ZALO_APP_SECRET;
      if (appId && appSecret) {
        const refreshRes = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'secret_key': appSecret,
          },
          body: new URLSearchParams({
            app_id: appId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        });
        const json = await refreshRes.json();
        if (json.access_token) {
          const newAccess = json.access_token;
          const newRefresh = json.refresh_token || refreshToken;
          const newExpiry = new Date(Date.now() + (Number(json.expires_in) || 90000) * 1000).toISOString();
          await supabase.from('app_config').upsert([
            { key: 'zalo_access_token', value: newAccess, updated_at: new Date().toISOString() },
            { key: 'zalo_refresh_token', value: newRefresh, updated_at: new Date().toISOString() },
            { key: 'zalo_access_token_expires_at', value: newExpiry, updated_at: new Date().toISOString() },
          ]);
          console.log('[bookings] Zalo token refreshed, expires:', newExpiry);
          return newAccess;
        } else {
          console.error('[bookings] Zalo refresh failed:', json.error_description || json.error);
        }
      }
    } else if (accessToken && (!expiresAt || expiresAt === 'LOAD_FROM_ENV')) {
      // First run — persist env token + set expiry (assume fresh, ~25 hrs)
      const newExpiry = new Date(Date.now() + 90000 * 1000).toISOString();
      await supabase.from('app_config').upsert([
        { key: 'zalo_access_token', value: accessToken, updated_at: new Date().toISOString() },
        { key: 'zalo_refresh_token', value: refreshToken, updated_at: new Date().toISOString() },
        { key: 'zalo_access_token_expires_at', value: newExpiry, updated_at: new Date().toISOString() },
      ]);
    }

    return accessToken;
  } catch (err) {
    console.error('[bookings] getZaloAccessToken error:', err.message);
    // Fallback to env var
    return process.env.ZALO_OA_ACCESS_TOKEN || '';
  }
}

async function sendZNSAdmin({ accessToken, bookingRef, carName, customerName, customerPhone, pickupText, returnText, totalAmount, depositAmount }) {
  const templateId = process.env.ZALO_ADMIN_TEMPLATE_ID;
  const adminPhone = '0975563290';

  if (!accessToken || !templateId) return;

  try {
    const znsRes = await fetch('https://business.openapi.zalo.me/message/template', {
      method: 'POST',
      headers: {
        'access_token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: adminPhone,
        template_id: templateId,
        template_data: {
          booking_ref: bookingRef,
          car_name: carName,
          customer_name: customerName,
          customer_phone: customerPhone,
          pickup_time: pickupText,
          return_time: returnText,
          total_amount: `${Number(totalAmount).toLocaleString('vi-VN')}đ`,
          deposit_amount: `${Number(depositAmount).toLocaleString('vi-VN')}đ`,
        },
        tracking_id: bookingRef,
      }),
    });
    const json = await znsRes.json();
    if (json.error !== 0) console.error('[bookings] ZNS error:', json.message);
    else console.log('[bookings] ZNS sent:', bookingRef);
  } catch (err) {
    console.error('[bookings] ZNS exception:', err.message);
  }
}

function generateRef() {
  const d = new Date();
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(vn.getUTCFullYear()).slice(-2);
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  const datePrefix = `CMOTTL${yy}${mm}${dd}`;
  return `${datePrefix}-BW${randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

function bookingInstant(date, hour) {
  const normalizedHour = String(Number(hour)).padStart(2, '0');
  const value = new Date(`${date}T${normalizedHour}:00:00+07:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function calculateRentalAmount(pickupDate, pickupHour, returnDate, returnHour, basePrice) {
  const pDate = parseHolidayDate(pickupDate);
  const rDate = parseHolidayDate(returnDate);
  if (!pDate || !rDate || !basePrice || basePrice <= 0) return null;
  const calDays = Math.round((Date.UTC(rDate.getFullYear(), rDate.getMonth(), rDate.getDate())
    - Date.UTC(pDate.getFullYear(), pDate.getMonth(), pDate.getDate())) / 86_400_000);
  const totalHours = calDays * 24 + (Number(returnHour) - Number(pickupHour));
  if (totalHours < 4 || calDays < 0) return null;

  if (calDays === 0) {
    const halfDay = (Number(pickupHour) >= 7 && Number(pickupHour) <= 12 && Number(returnHour) <= 12)
      || (Number(pickupHour) >= 13 && Number(returnHour) <= 20);
    return Math.round(basePrice * (halfDay ? 0.7 : 1));
  }

  let earlyFee = 0;
  if (Number(pickupHour) >= 17 && Number(pickupHour) < 19) earlyFee = 100_000;
  else if (Number(pickupHour) >= 16 && Number(pickupHour) < 17) earlyFee = 200_000;
  let lateFee = 0;
  let lateExtraHalf = false;
  if (Number(returnHour) >= 23) lateExtraHalf = true;
  else if (Number(returnHour) >= 22) lateFee = 200_000;
  else if (Number(returnHour) >= 21) lateFee = 100_000;

  let baseDays;
  if (Number(pickupHour) <= 11) baseDays = calDays + 1;
  else if (Number(pickupHour) <= 15) baseDays = Number(returnHour) <= 12 ? calDays : calDays + 0.5;
  else {
    baseDays = calDays;
    if (Number(pickupHour) >= 19 && Number(returnHour) <= 12) {
      baseDays = calDays === 1 ? 0.7 : (calDays - 1) + 0.5;
    }
  }
  return Math.round(basePrice * baseDays)
    + (lateExtraHalf ? Math.round(basePrice * 0.5) : lateFee)
    + earlyFee;
}

export function calculateRentalTimingExtras(pickupHour, returnHour, basePrice) {
  let earlyFee = 0;
  if (Number(pickupHour) >= 17 && Number(pickupHour) < 19) earlyFee = 100_000;
  else if (Number(pickupHour) >= 16 && Number(pickupHour) < 17) earlyFee = 200_000;

  let returnFee = 0;
  if (Number(returnHour) >= 23) returnFee = Math.round(basePrice * 0.5);
  else if (Number(returnHour) >= 22) returnFee = 200_000;
  else if (Number(returnHour) >= 21) returnFee = 100_000;
  return earlyFee + returnFee;
}

export function calculateHolidaySurcharge(
  rules,
  dates,
  basePrice,
  { pickupDate, pickupHour, returnDate, returnHour, baseAmount } = {},
) {
  const comboMatch = findHolidayCombo(rules, pickupDate, returnDate);
  if (comboMatch) {
    const pickup = parseHolidayDate(pickupDate);
    const dropoff = parseHolidayDate(returnDate);
    if (!pickup || !dropoff) return 0;
    const comboDays = Math.max(1, Math.round((Date.UTC(dropoff.getFullYear(), dropoff.getMonth(), dropoff.getDate())
      - Date.UTC(pickup.getFullYear(), pickup.getMonth(), pickup.getDate())) / 86_400_000) + 1);
    const dailyAdjustment = Math.max(
      0,
      Number(comboMatch.window.adjustment_value ?? comboMatch.rule.adjustment_value) || 0,
    );
    const timingExtras = calculateRentalTimingExtras(pickupHour, returnHour, basePrice);
    const baseRentalOnly = Math.max(0, Number(baseAmount) - timingExtras);
    const comboBaseAmount = Number(basePrice) * comboDays;
    return Math.max(0, comboBaseAmount - baseRentalOnly + dailyAdjustment * comboDays);
  }

  return dates.reduce((sum, date) => {
    const amounts = rules
      .filter((rule) => rule.start_date <= date && rule.end_date >= date)
      .map((rule) => rule.adjustment_type === 'fixed'
        ? Math.max(0, Number(rule.adjustment_value) || 0)
        : Math.max(0, Math.round((basePrice * Number(rule.adjustment_value) / 100) / 1000) * 1000));
    return sum + (amounts.length ? Math.max(...amounts) : 0);
  }, 0);
}

function requestDigest(body) {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

async function getCompanyId(supabase) {
  const { data, error } = await supabase.from('companies').select('id').eq('code', COMPANY_CODE).single();
  if (error || !data?.id) throw error || new Error('Company not found');
  return data.id;
}

async function acquireIdempotency(supabase, companyId, phone, key, hash) {
  const actorKey = `website:${normalizePhone(phone)}`;
  const route = 'POST /api/bookings';
  const lookup = () => supabase.from('api_idempotency_keys')
    .select('id,request_hash,response_status,response_body,completed_at')
    .eq('company_id', companyId).eq('actor_key', actorKey).eq('route', route)
    .eq('idempotency_key', key).maybeSingle();
  const { data: existing, error: lookupError } = await lookup();
  if (lookupError) throw lookupError;
  if (existing) {
    if (existing.request_hash !== hash) return { conflict: true };
    if (existing.completed_at && existing.response_body) return { replay: existing.response_body };
    return { pending: true };
  }
  const { data, error } = await supabase.from('api_idempotency_keys').insert({
    company_id: companyId,
    actor_key: actorKey,
    route,
    idempotency_key: key,
    request_hash: hash,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }).select('id').single();
  if (error?.code === '23505') {
    const { data: raced } = await lookup();
    if (raced?.request_hash !== hash) return { conflict: true };
    if (raced?.completed_at && raced.response_body) return { replay: raced.response_body };
    return { pending: true };
  }
  if (error) throw error;
  return { id: data.id };
}

async function resolveServerDiscounts(supabase, companyId, body, subtotal) {
  const normalizedPhone = normalizePhone(body.customer_phone);
  let loyaltyDiscount = 0;
  const { data: customer } = await findActiveCustomerByPhone(supabase, normalizedPhone);
  if (customer?.loyalty_tier) {
    const { data: setting } = await supabase.from('loyalty_discount_settings')
      .select('discount_amount').eq('company_id', companyId)
      .eq('tier', customer.loyalty_tier).eq('enabled', true).maybeSingle();
    loyaltyDiscount = Math.max(0, Number(setting?.discount_amount) || 0);
  }

  const code = String(body.promo_code || '').trim().toUpperCase();
  if (!code) return { loyaltyDiscount, promoDiscount: 0 };

  const { data: promo, error: promoError } = await supabase.from('promo_codes')
    .select('discount_type,discount_value,max_discount,min_order,uses_limit,uses_count,expires_at,first_time_only,weekends_only,phone_restriction')
    .eq('code', code).eq('active', true).maybeSingle();
  if (promoError) throw promoError;
  if (!promo) {
    const { data: referrer } = await supabase.from('customers')
      .select('id').eq('referral_code', code).eq('status', 'active').maybeSingle();
    if (!referrer) throw new Error('Mã giảm giá không hợp lệ');
    return {
      loyaltyDiscount,
      promoDiscount: Math.min(Math.max(0, Number(process.env.REFERRAL_DISCOUNT_AMOUNT || 50_000)), subtotal),
    };
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new Error('Mã giảm giá đã hết hạn');
  if (promo.uses_limit != null && Number(promo.uses_count) >= Number(promo.uses_limit)) {
    throw new Error('Mã giảm giá đã hết lượt sử dụng');
  }
  if (promo.phone_restriction && normalizePhone(promo.phone_restriction) !== normalizedPhone) {
    throw new Error('Mã giảm giá không áp dụng cho số điện thoại này');
  }
  if (Number(promo.min_order || 0) > subtotal) throw new Error('Đơn chưa đạt giá trị tối thiểu của mã giảm giá');
  if (promo.weekends_only) {
    const day = parseHolidayDate(body.pickup_date)?.getDay();
    if (day !== 0 && day !== 6) throw new Error('Mã chỉ áp dụng cuối tuần');
  }
  if (promo.first_time_only) {
    const phone84 = toVietnamPhone84(normalizedPhone);
    const [{ count: leadCount }, { count: customerCount }] = await Promise.all([
      supabase.from('website_leads').select('id', { count: 'exact', head: true })
        .or(`phone.eq.${normalizedPhone},phone.eq.${phone84}`),
      supabase.from('customers').select('id', { count: 'exact', head: true })
        .or(`phone.eq.${normalizedPhone},normalized_phone.eq.${normalizedPhone},phone.eq.${phone84}`),
    ]);
    if ((leadCount || 0) > 0 || (customerCount || 0) > 0) throw new Error('Mã chỉ dành cho khách đặt xe lần đầu');
  }
  const discountValue = Math.max(0, Number(promo.discount_value) || 0);
  let promoDiscount = promo.discount_type === 'percent'
    ? Math.round((subtotal * discountValue / 100) / 10_000) * 10_000
    : discountValue;
  if (promo.max_discount != null) promoDiscount = Math.min(promoDiscount, Number(promo.max_discount));
  return { loyaltyDiscount, promoDiscount: Math.min(Math.max(0, promoDiscount), subtotal - loyaltyDiscount) };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/bookings?action=upload-proof — payment proof image upload
  if (req.method === 'POST' && req.query.action === 'upload-proof') {
    if (!rateLimit(req, res, { id: 'bookings:upload-proof', windowMs: 15 * 60_000, max: 10 })) return;
    let body2;
    try { body2 = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
    const { booking_ref, phone, file_base64, file_name } = body2 || {};
    const bookingRef = getBookingRef(booking_ref);
    if (!bookingRef || !file_base64 || !phone) {
      return res.status(400).json({ error: 'Vui lòng nhập đủ mã booking, số điện thoại và ảnh thanh toán' });
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });
    const supabaseUp = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

    let booking;
    try {
      booking = await getBookingByRef(supabaseUp, bookingRef);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Lỗi tra cứu' });
    }
    const phoneCheck = assertBookingPhone(booking, phone);
    if (!phoneCheck.ok) return res.status(phoneCheck.status).json({ error: phoneCheck.error });

    let image;
    try {
      image = decodeProofImage(file_base64, file_name);
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Ảnh không hợp lệ' });
    }

    const safeName = bookingRef.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${safeName}.${image.ext}`;
    const { error: uploadError } = await supabaseUp.storage.from('payment-proofs').upload(path, image.buffer, { contentType: image.contentType, upsert: true });
    if (uploadError) { console.error('[bookings] upload-proof error:', uploadError.message); return res.status(500).json({ error: 'Upload thất bại, vui lòng thử lại' }); }
    const { error: updateError } = await supabaseUp
      .from('website_leads')
      .update({ payment_proof_url: path })
      .eq('booking_ref', bookingRef)
      .eq('form_type', 'booking');
    if (updateError) {
      console.error('[bookings] upload-proof update error:', updateError.message);
      return res.status(500).json({ error: 'Đã upload ảnh nhưng chưa lưu được vào đơn, vui lòng báo Car Match' });
    }
    const signedUrl = await resolvePaymentProofUrl(supabaseUp, path);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ url: signedUrl });
  }

  // POST /api/bookings?action=link-phone — link Google account to customer phone
  if (req.method === 'POST' && req.query.action === 'link-phone') {
    if (!rateLimit(req, res, { id: 'bookings:link-phone', windowMs: 10 * 60_000, max: 12 })) return;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: 'Dịch vụ tài khoản chưa cấu hình xác minh server' });
    }
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!accessToken) return res.status(401).json({ error: 'Bạn cần đăng nhập lại' });

    let body2;
    try { body2 = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

    const normalizedPhone = normalizePhone(body2?.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại' });
    }
    const userEmail = authData.user.email || '';
    if (!userEmail) {
      return res.status(403).json({ error: 'Tài khoản Google chưa có email để xác minh' });
    }

    const { data: existingCustomer, error: customerError } = await findActiveCustomerByPhone(supabaseAdmin, normalizedPhone);

    if (customerError) {
      console.error('[bookings] link-phone customer lookup error:', customerError.message);
      return res.status(500).json({ error: 'Chưa kiểm tra được hồ sơ khách hàng' });
    }

    let customer = existingCustomer;
    let created = false;
    if (!customer) {
      try {
        customer = await createWebsiteAccountCustomer(supabaseAdmin, authData.user, normalizedPhone);
        created = true;
      } catch (error) {
        return res.status(500).json({ error: error.message || 'Chưa tạo được hồ sơ khách hàng' });
      }
    }

    const appMetadata = {
      ...(authData.user.app_metadata || {}),
      customer_phone: normalizedPhone,
      customer_id: customer.id,
    };
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      app_metadata: appMetadata,
    });
    if (updateError) {
      console.error('[bookings] link-phone update user error:', updateError.message);
      return res.status(500).json({ error: 'Chưa lưu được liên kết tài khoản, vui lòng thử lại' });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      phone: normalizedPhone,
      customer: publicCustomerPayload(customer),
      created,
    });
  }

  // GET /api/bookings?ref=XXXX — booking lookup
  if (req.method === 'GET') {
    if (!rateLimit(req, res, { id: 'bookings:lookup', windowMs: 10 * 60_000, max: 40 })) return;
    const { ref, phone } = req.query;
    if (!ref || typeof ref !== 'string') return res.status(400).json({ error: 'Missing ref' });
    if (!phone || typeof phone !== 'string') return res.status(400).json({ error: 'Vui lòng nhập số điện thoại đã đặt xe' });
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let data;
    try {
      data = await getBookingByRef(supabase, getBookingRef(ref));
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Lỗi tra cứu' });
    }
    const phoneCheck = assertBookingPhone(data, phone);
    if (!phoneCheck.ok) return res.status(phoneCheck.status).json({ error: phoneCheck.error });
    const paymentProofUrl = await resolvePaymentProofUrl(supabase, data.payment_proof_url);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      booking_ref: data.booking_ref,
      name: data.name,
      phone_masked: maskPhone(data.phone),
      car_model: data.car_model,
      duration: data.duration,
      deposit_amount: data.deposit_amount,
      note: data.note,
      status: data.status,
      payment_required: data.status === 'new' && !paymentProofUrl,
      requires_confirmation: data.status === 'partner_pending',
      created_at: data.created_at,
      building: data.building,
      payment_proof_url: paymentProofUrl,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { id: 'bookings:create', windowMs: 10 * 60_000, max: 8 })) return;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Dịch vụ chưa khả dụng' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const required = ['vehicle_id', 'car_name', 'customer_name', 'customer_phone', 'pickup_date', 'pickup_hour', 'return_date', 'return_hour', 'delivery_mode', 'total_amount'];
  for (const f of required) {
    if (!body?.[f] && body?.[f] !== 0) return res.status(400).json({ error: `Missing field: ${f}` });
  }
  const pickupDate = normalizeHolidayDate(body.pickup_date);
  const returnDate = normalizeHolidayDate(body.return_date);
  if (!pickupDate || !returnDate) {
    return res.status(400).json({ error: 'Ngày nhận/trả xe không hợp lệ' });
  }
  if (returnDate < pickupDate) {
    return res.status(400).json({ error: 'Ngày trả xe phải từ ngày nhận xe trở đi' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const pickupAt = bookingInstant(pickupDate, body.pickup_hour);
  const returnAt = bookingInstant(returnDate, body.return_hour);
  if (!pickupAt || !returnAt || returnAt <= pickupAt) {
    return res.status(400).json({ error: 'Thời gian nhận/trả xe không hợp lệ' });
  }

  let companyId;
  let vehicle;
  try {
    companyId = await getCompanyId(supabase);
    const { data, error } = await supabase
      .from('vehicles')
      .select('id,company_id,display_name,daily_base_price,status,published')
      .eq('id', body.vehicle_id)
      .eq('company_id', companyId)
      .maybeSingle();
    if (error) throw error;
    vehicle = data;
  } catch (error) {
    console.error('[bookings] Vehicle lookup error:', error.message);
    return res.status(500).json({ error: 'Chưa kiểm tra được thông tin xe, vui lòng thử lại' });
  }
  if (!vehicle || !vehicle.published || vehicle.status !== 'available') {
    return res.status(409).json({ error: 'Xe này hiện không còn nhận đặt trên website' });
  }
  const locationName = body.location_name || null;
  const clientHolidaySurcharge = Math.max(0, Number(body.holiday_surcharge) || 0);
  const holidayPricing = Array.isArray(body.holiday_pricing)
    ? body.holiday_pricing.slice(0, 20).map((item) => ({
        rule_id: String(item?.rule_id || '').slice(0, 80),
        name: String(item?.name || 'Giá lễ').slice(0, 120),
        dates: Array.isArray(item?.dates)
          ? item.dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date))).slice(0, 31)
          : [],
        adjustment_type: item?.adjustment_type === 'percent' ? 'percent' : 'fixed',
        adjustment_value: Math.max(0, Number(item?.adjustment_value) || 0),
        amount: Math.max(0, Number(item?.amount) || 0),
        pricing_mode: item?.pricing_mode === 'combo' ? 'combo' : 'daily_adjustment',
        booking_window_label: String(item?.booking_window_label || '').slice(0, 120) || null,
        combo_days: Math.max(0, Number(item?.combo_days) || 0),
        combo_adjustment_value: Math.max(0, Number(item?.combo_adjustment_value) || 0),
      })).filter((item) => item.amount > 0 && item.dates.length > 0)
    : [];

  let holidayRules = [];
  try {
    holidayRules = await loadActiveHolidayPricingRules(supabase);
  } catch (holidayError) {
    console.error('[bookings] Holiday pricing lookup error:', holidayError.message);
    return res.status(500).json({ error: 'Chưa kiểm tra được chính sách giá lễ, vui lòng thử lại' });
  }

  const expectedHolidayDates = getBillableHolidayDateStrings(pickupDate, body.pickup_hour, returnDate)
    .filter((date) => holidayDateCoveredByRule(holidayRules, date));
  const serverBaseAmount = calculateRentalAmount(
    pickupDate,
    body.pickup_hour,
    returnDate,
    body.return_hour,
    Number(vehicle.daily_base_price),
  );
  if (serverBaseAmount === null) {
    return res.status(400).json({ error: 'Khoảng thuê chưa hợp lệ hoặc xe chưa có giá thuê' });
  }
  const holidaySurcharge = calculateHolidaySurcharge(
    holidayRules,
    expectedHolidayDates,
    Number(vehicle.daily_base_price),
    {
      pickupDate,
      pickupHour: body.pickup_hour,
      returnDate,
      returnHour: body.return_hour,
      baseAmount: serverBaseAmount,
    },
  );
  const overlappingHolidayRules = holidayRules.filter((rule) => (
    pickupDate <= rule.end_date && returnDate >= rule.start_date
  ));
  const allowedHolidayWindows = collectHolidayBookingWindows(overlappingHolidayRules);
  const holidayWindowMatch = allowedHolidayWindows.find((window) => (
    window.pickup_date === pickupDate && window.return_date === returnDate
  ));

  if (expectedHolidayDates.length > 0 && allowedHolidayWindows.length > 0 && !holidayWindowMatch) {
    return res.status(400).json({ error: describeHolidayBookingWindows(allowedHolidayWindows) });
  }
  if (expectedHolidayDates.length > 0 && body.promo_code) {
    return res.status(400).json({ error: 'Mã giảm giá không áp dụng vào ngày lễ / cao điểm' });
  }
  const holidayPricingSnapshotValid = validateHolidayPricingSnapshot(holidayPricing, holidayRules, expectedHolidayDates);
  if (expectedHolidayDates.length > 0 && (holidaySurcharge <= 0 || !holidayPricingSnapshotValid)) {
    return res.status(400).json({ error: 'Lịch này có ngày lễ/cao điểm, vui lòng tính lại giá lễ trước khi gửi đơn' });
  }
  if (expectedHolidayDates.length === 0 && (clientHolidaySurcharge > 0 || holidayPricing.length > 0)) {
    return res.status(400).json({ error: 'Phụ thu giá lễ không khớp với lịch đã chọn' });
  }
  if (Math.abs(clientHolidaySurcharge - holidaySurcharge) > 1_000) {
    return res.status(409).json({ error: 'Giá lễ vừa thay đổi, vui lòng tải lại báo giá trước khi đặt xe' });
  }

  const deliveryFee = body.delivery_mode === 'delivery' ? 200_000 : 0;
  let loyaltyDiscount = 0;
  let promoDiscount = 0;
  try {
    ({ loyaltyDiscount, promoDiscount } = await resolveServerDiscounts(
      supabase,
      companyId,
      body,
      serverBaseAmount + holidaySurcharge + deliveryFee,
    ));
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Mã giảm giá không hợp lệ' });
  }
  const totalAmount = Math.max(0, serverBaseAmount + holidaySurcharge + deliveryFee - loyaltyDiscount - promoDiscount);
  if (Math.abs(Number(body.base_amount) - serverBaseAmount) > 1_000
      || Math.abs(Number(body.delivery_fee) - deliveryFee) > 1_000
      || Math.abs(Number(body.loyalty_discount || 0) - loyaltyDiscount) > 1_000
      || Math.abs(Number(body.promo_discount || 0) - promoDiscount) > 1_000
      || Math.abs(Number(body.total_amount) - totalAmount) > 1_000) {
    return res.status(409).json({ error: 'Giá xe vừa thay đổi, vui lòng tải lại để nhận báo giá mới nhất' });
  }

  let requiresConfirmation = body.requires_confirmation === true;
  let availabilityCheckUnavailable = false;
  await supabase.from('vehicle_reservations')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('company_id', companyId).eq('status', 'held').lt('active_until', new Date().toISOString());

  const [{ data: reservationConflict, error: reservationError }, { data: scheduleConflicts, error: scheduleError }] = await Promise.all([
    supabase.from('vehicle_reservations').select('id').eq('company_id', companyId)
      .eq('vehicle_id', vehicle.id).in('status', ['held', 'confirmed'])
      .lt('starts_at', returnAt.toISOString()).gt('ends_at', pickupAt.toISOString()).limit(1).maybeSingle(),
    supabase.from('vehicle_schedule_events')
      .select('id,event_type,starts_at,ends_at,status,note,location_text')
      .eq('company_id', companyId)
      .eq('vehicle_id', vehicle.id)
      .in('status', ACTIVE_SCHEDULE_STATUSES)
      .in('event_type', BLOCKING_SCHEDULE_TYPES)
      .lt('starts_at', returnAt.toISOString())
      .gt('ends_at', pickupAt.toISOString())
      .limit(20),
  ]);
  if (reservationError || scheduleError) {
    availabilityCheckUnavailable = true;
    requiresConfirmation = true;
    console.error('[bookings] Availability check degraded; saving for manual confirmation:', {
      reservation: reservationError?.message || null,
      schedule: scheduleError?.message || null,
    });
  }
  const {
    blocking: blockingScheduleConflicts,
    hasHardConflict: hasHardScheduleConflict,
  } = classifyScheduleConflicts(scheduleError ? [] : scheduleConflicts, pickupDate, returnDate);
  const canSubmitBoundaryConfirmation = requiresConfirmation
    && blockingScheduleConflicts.length > 0
    && !hasHardScheduleConflict;

  if (reservationConflict || hasHardScheduleConflict
      || (blockingScheduleConflicts.length > 0 && !canSubmitBoundaryConfirmation)) {
    return res.status(409).json({ error: 'Xe vừa có lịch trùng trong khoảng này. Vui lòng chọn thời gian khác.' });
  }

  const idempotencyKey = String(req.headers['idempotency-key'] || body.idempotency_key || '').trim();
  if (!/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey)) {
    return res.status(400).json({ error: 'Phiên gửi đơn không hợp lệ, vui lòng tải lại trang' });
  }
  let idempotency;
  try {
    idempotency = await acquireIdempotency(
      supabase,
      companyId,
      body.customer_phone,
      idempotencyKey,
      requestDigest(body),
    );
  } catch (error) {
    console.error('[bookings] Idempotency error:', error.message);
    return res.status(500).json({ error: 'Chưa khóa được yêu cầu đặt xe, vui lòng thử lại' });
  }
  if (idempotency.conflict) return res.status(409).json({ error: 'Mã gửi đơn đã được dùng cho nội dung khác' });
  if (idempotency.pending) return res.status(409).json({ error: 'Đơn đang được xử lý, vui lòng đợi vài giây rồi thử lại' });
  if (idempotency.replay) {
    res.setHeader('Idempotent-Replayed', 'true');
    return res.status(200).json(idempotency.replay);
  }

  const bookingRef = generateRef();
  const depositAmount = Math.max(200_000, Math.round(totalAmount * 0.3 / 10_000) * 10_000);
  let reservationId = null;
  if (!requiresConfirmation) {
    const activeUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { data: reservation, error: holdError } = await supabase.from('vehicle_reservations').insert({
      company_id: companyId,
      vehicle_id: vehicle.id,
      status: 'held',
      starts_at: pickupAt.toISOString(),
      ends_at: returnAt.toISOString(),
      active_until: activeUntil,
      source: 'website',
      rental_period: `[${pickupAt.toISOString()},${returnAt.toISOString()})`,
      metadata: { booking_ref: bookingRef, idempotency_key: idempotencyKey },
    }).select('id').single();
    if (holdError) {
      await supabase.from('api_idempotency_keys').delete().eq('id', idempotency.id);
      if (holdError.code === '23P01') {
        return res.status(409).json({ error: 'Xe vừa được khách khác giữ chỗ. Vui lòng chọn thời gian khác.' });
      }
      console.error('[bookings] Hold error:', holdError.message);
      return res.status(500).json({ error: 'Chưa giữ được lịch xe, vui lòng thử lại' });
    }
    reservationId = reservation.id;
  }

  const pickupText = `${pickupDate} ${body.pickup_hour}:00`;
  const returnText = `${returnDate} ${body.return_hour}:00`;
  const holidayComboSnapshot = holidayPricing.find((item) => item.pricing_mode === 'combo') || null;
  const noteLines = [
    `[ĐẶT XE TỰ LÁI] ${bookingRef}`,
    `Xe: ${body.car_name}`,
    `Nhận: ${pickupText}`,
    `Trả: ${returnText}`,
    locationName ? `Địa điểm: ${locationName}` : '',
    `Tổng dự kiến: ${totalAmount.toLocaleString('vi-VN')}đ`,
    holidayComboSnapshot
      ? `Mức tăng combo lễ: +${Number(holidayComboSnapshot.combo_adjustment_value).toLocaleString('vi-VN')}đ/ngày × ${holidayComboSnapshot.combo_days} ngày`
      : holidaySurcharge > 0 ? `Phụ thu giá lễ: ${holidaySurcharge.toLocaleString('vi-VN')}đ` : '',
    deliveryFee > 0 ? `Phí giao nhận xe: ${deliveryFee.toLocaleString('vi-VN')}đ` : '',
    requiresConfirmation
      ? `Cọc dự kiến sau khi xác nhận lịch: ${depositAmount.toLocaleString('vi-VN')}đ`
      : `Cọc VietQR: ${depositAmount.toLocaleString('vi-VN')}đ`,
    body.loyalty_discount > 0 ? `Ưu đãi ${body.loyalty_tier === 'vip' ? 'VIP' : 'khách thân thiết'}: -${Number(body.loyalty_discount).toLocaleString('vi-VN')}đ` : '',
    body.promo_code ? `Mã KM: ${body.promo_code} (-${Number(body.promo_discount || 0).toLocaleString('vi-VN')}đ)` : '',
    availabilityCheckUnavailable
      ? 'CẦN KIỂM TRA LỊCH THỦ CÔNG: dịch vụ kiểm tra lịch tự động bị gián đoạn khi khách gửi yêu cầu.'
      : '',
    body.customer_note ? `Ghi chú khách: ${body.customer_note}` : '',
  ].filter(Boolean).join('\n');

  const leadPayload = {
    booking_ref: bookingRef,
    deposit_amount: depositAmount,
    source: 'b2b',
    name: body.customer_name.trim(),
    phone: body.customer_phone.trim(),
    customer_type: 'business',
    form_type: 'booking',
    quantity: '1 xe',
    duration: `${pickupText} → ${returnText}`,
    car_model: vehicle.display_name || body.car_name,
    vehicle_id: vehicle.id,
    car_slug: body.car_slug || null,
    vehicle_url: body.car_slug ? `https://www.carmatch.vn/xe/${encodeURIComponent(String(body.car_slug))}` : null,
    building: locationName,
    rental_amount: serverBaseAmount,
    delivery_fee_amount: deliveryFee,
    loyalty_discount_amount: loyaltyDiscount,
    promo_discount_amount: promoDiscount,
    total_amount: totalAmount,
    pricing_snapshot: {
      delivery_mode: body.delivery_mode,
      promo_code: body.promo_code || null,
      loyalty_tier: body.loyalty_tier || null,
      holiday_surcharge: holidaySurcharge,
      holiday_pricing: holidayPricing,
      availability_check_unavailable: availabilityCheckUnavailable,
      captured_at: new Date().toISOString(),
    },
    note: noteLines,
    status: requiresConfirmation ? 'partner_pending' : 'new',
  };

  let { data: lead, error } = await supabase.from('website_leads').insert(leadPayload).select('id').single();
  // Deploy web/API và migration có thể lệch vài phút. Không được làm khách mất
  // booking chỉ vì các cột chi tiết giá chưa được áp dụng; ghi chú vẫn lưu đủ
  // tổng tiền, cọc, phí giao nhận và khuyến mãi để Ops đọc ngược.
  if (error && /column|schema cache|vehicle_url|rental_amount|pricing_snapshot/i.test(error.message || '')) {
    const {
      vehicle_url,
      rental_amount,
      delivery_fee_amount,
      loyalty_discount_amount,
      promo_discount_amount,
      total_amount,
      pricing_snapshot,
      vehicle_id,
      ...legacyPayload
    } = leadPayload;
    console.warn('[bookings] booking detail fields unavailable; saving compatible lead payload');
    ({ data: lead, error } = await supabase.from('website_leads').insert(legacyPayload).select('id').single());
  }

  if (error) {
    console.error('[bookings] Supabase error:', error.message);
    if (reservationId) await supabase.from('vehicle_reservations').update({ status: 'released' }).eq('id', reservationId);
    if (idempotency.id) await supabase.from('api_idempotency_keys').delete().eq('id', idempotency.id);
    return res.status(500).json({ error: 'Không thể tạo đơn đặt xe, vui lòng thử lại' });
  }

  // Track promo/referral code usage (awaited — Vercel freezes Lambda after res.json, fire-and-forget gets cut off)
  const promoCode = body.promo_code ? String(body.promo_code).trim().toUpperCase() : null;
  if (promoCode) {
    await (async () => {
      try {
        // Lấy company_id
        const { data: company } = await supabase
          .from('companies').select('id').limit(1).maybeSingle();
        const companyId = company?.id || null;

        // Kiểm tra đây là promo_code hay referral_code
        const { data: promo } = await supabase
          .from('promo_codes').select('id, uses_count').eq('code', promoCode).maybeSingle();

        if (promo) {
          // Là promo code thông thường → tăng uses_count + ghi log
          await supabase.from('promo_codes')
            .update({ uses_count: (Number(promo.uses_count) || 0) + 1 })
            .eq('id', promo.id);

          await supabase.from('promo_code_uses').insert({
            company_id: companyId,
            promo_code_id: promo.id,
            discount_amount: Number(body.promo_discount || 0),
            website_lead_ref: bookingRef,
            customer_phone: body.customer_phone?.trim() || null,
            customer_name: body.customer_name?.trim() || null,
            code_type: 'promo',
          });
        } else {
          // Thử tra referral code
          const { data: referrer } = await supabase
            .from('customers')
            .select('id')
            .eq('referral_code', promoCode)
            .eq('status', 'active')
            .maybeSingle();

          if (referrer) {
            // Tìm referred customer theo phone
            const phone = body.customer_phone?.trim();
            let referredCustomerId = null;
            if (phone) {
              const { data: referred } = await supabase
                .from('customers')
                .select('id')
                .eq('normalized_phone', phone.replace(/[\s\-().+]/g, ''))
                .maybeSingle();
              referredCustomerId = referred?.id || null;
            }

            // Chặn self-referral
            if (referrer.id === referredCustomerId) {
              return;
            }

            // Chỉ tính referral cho khách mới (chưa có hồ sơ trong hệ thống)
            if (referredCustomerId) {
              return;
            }

            // Ghi referral_rewards
            await supabase.from('referral_rewards').insert({
              company_id: companyId,
              referrer_customer_id: referrer.id,
              referred_customer_id: null,
              status: 'pending',
              reward_type: 'discount',
              reward_value: Number(process.env.REFERRAL_REWARD_AMOUNT || process.env.REFERRAL_DISCOUNT_AMOUNT || 100000),
              reward_note: `Website booking ${bookingRef} · Khách: ${body.customer_name?.trim()} ${body.customer_phone?.trim()}`,
            });

            // Ghi promo_code_uses dạng referral
            await supabase.from('promo_code_uses').insert({
              company_id: companyId,
              promo_code_id: null,
              discount_amount: Number(body.promo_discount || 0),
              website_lead_ref: bookingRef,
              customer_phone: body.customer_phone?.trim() || null,
              customer_name: body.customer_name?.trim() || null,
              code_type: 'referral',
            });
          }
        }
      } catch (trackErr) {
        console.error('[bookings] Promo tracking error:', trackErr.message);
      }
    })();
  }

  // Gửi email xác nhận nếu khách cung cấp email (fire-and-forget)
  const customerEmail = body.customer_email || null;
  if (customerEmail && process.env.RESEND_API_KEY) {
    const subject = `[Car Match] Xác nhận đặt xe ${bookingRef}`;
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <h2 style="color:#0891b2">✅ Đặt xe thành công!</h2>
        <p>Mã booking: <strong style="color:#2563eb">${bookingRef}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
          <tr><td style="padding:6px 0;color:#64748b">Xe</td><td style="padding:6px 0;font-weight:600">${body.car_name}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Nhận xe</td><td style="padding:6px 0;font-weight:600">${pickupDate} ${body.pickup_hour}:00</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Trả xe</td><td style="padding:6px 0;font-weight:600">${returnDate} ${body.return_hour}:00</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Tiền cọc</td><td style="padding:6px 0;font-weight:600;color:#0891b2">${depositAmount.toLocaleString('vi-VN')}đ</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Còn lại khi nhận xe</td><td style="padding:6px 0;font-weight:600;color:#dc2626">${(totalAmount - depositAmount).toLocaleString('vi-VN')}đ</td></tr>
        </table>
        <p style="font-size:13px;color:#64748b">
          Car Match sẽ liên hệ xác nhận trong vòng 30 phút.<br>
          Hotline: <strong>0971 593 290</strong>
        </p>
        <p style="font-size:12px;color:#94a3b8">Lưu mã booking để tra cứu: <strong>${bookingRef}</strong></p>
      </div>
    `;
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Car Match <booking@carmatch.vn>',
        to: [customerEmail],
        subject,
        html: htmlBody,
      }),
    }).catch(err => console.error('[bookings] Resend error:', err.message));
  }

  // Fire-and-forget ZNS (token auto-refreshes via Supabase)
  getZaloAccessToken(supabase).then(accessToken =>
    sendZNSAdmin({
      accessToken,
      bookingRef,
      carName: body.car_name,
      customerName: body.customer_name,
      customerPhone: body.customer_phone,
      pickupText,
      returnText,
      totalAmount,
      depositAmount,
    })
  ).catch(() => {});

  await sendPushToCompany(supabase, {
    title: '🔔 Lead website mới',
    body: `${body.customer_name.trim()} · ${body.car_name}`,
    url: '/web-leads',
  });

  const responseBody = {
    bookingRef,
    depositAmount,
    totalAmount,
    holdExpiresAt: reservationId ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
    paymentRequired: !requiresConfirmation,
    requiresConfirmation,
  };
  if (idempotency.id) {
    await supabase.from('api_idempotency_keys').update({
      response_status: 200,
      response_body: responseBody,
      resource_type: 'website_lead',
      resource_id: lead?.id || null,
      completed_at: new Date().toISOString(),
    }).eq('id', idempotency.id);
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(responseBody);
}
