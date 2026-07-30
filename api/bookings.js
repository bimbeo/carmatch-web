import { createClient } from '@supabase/supabase-js';
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

async function generateRef(supabase) {
  const d = new Date();
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(vn.getUTCFullYear()).slice(-2);
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(vn.getUTCDate()).padStart(2, '0');
  const datePrefix = `CMOTTL${yy}${mm}${dd}`;

  const startOfDayUTC = new Date(Date.UTC(
    vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(),
  ) - 7 * 60 * 60 * 1000);
  const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000);

  const { count, error } = await supabase
    .from('website_leads')
    .select('*', { count: 'exact', head: true })
    .eq('form_type', 'booking')
    .gte('created_at', startOfDayUTC.toISOString())
    .lt('created_at', endOfDayUTC.toISOString());

  if (error) throw error;

  const seq = String((count || 0) + 1).padStart(3, '0');
  return `${datePrefix}-BW${seq}`;
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

  const required = ['car_name', 'customer_name', 'customer_phone', 'pickup_date', 'pickup_hour', 'return_date', 'return_hour', 'delivery_mode', 'total_amount'];
  for (const f of required) {
    if (!body?.[f] && body?.[f] !== 0) return res.status(400).json({ error: `Missing field: ${f}` });
  }

  const depositAmount = Math.max(200_000, Math.round(body.total_amount * 0.3 / 10_000) * 10_000);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let bookingRef;
  try {
    bookingRef = await generateRef(supabase);
  } catch (error) {
    console.error('[bookings] Ref generation error:', error.message);
    return res.status(500).json({ error: 'Không thể tạo mã đặt xe, vui lòng thử lại' });
  }
  const locationName = body.location_name || null;
  const pickupText = `${body.pickup_date} ${body.pickup_hour}:00`;
  const returnText = `${body.return_date} ${body.return_hour}:00`;
  const noteLines = [
    `[ĐẶT XE TỰ LÁI] ${bookingRef}`,
    `Xe: ${body.car_name}`,
    `Nhận: ${pickupText}`,
    `Trả: ${returnText}`,
    locationName ? `Địa điểm: ${locationName}` : '',
    `Tổng dự kiến: ${Number(body.total_amount || 0).toLocaleString('vi-VN')}đ`,
    Number(body.delivery_fee || 0) > 0 ? `Phí giao nhận xe: ${Number(body.delivery_fee).toLocaleString('vi-VN')}đ` : '',
    `Cọc VietQR: ${depositAmount.toLocaleString('vi-VN')}đ`,
    body.loyalty_discount > 0 ? `Ưu đãi ${body.loyalty_tier === 'vip' ? 'VIP' : 'khách thân thiết'}: -${Number(body.loyalty_discount).toLocaleString('vi-VN')}đ` : '',
    body.promo_code ? `Mã KM: ${body.promo_code} (-${Number(body.promo_discount || 0).toLocaleString('vi-VN')}đ)` : '',
    body.customer_note ? `Ghi chú khách: ${body.customer_note}` : '',
  ].filter(Boolean).join('\n');

  const { error } = await supabase.from('website_leads').insert({
    booking_ref: bookingRef,
    deposit_amount: depositAmount,
    source: 'b2b',
    name: body.customer_name.trim(),
    phone: body.customer_phone.trim(),
    customer_type: 'business',
    form_type: 'booking',
    quantity: '1 xe',
    duration: `${pickupText} → ${returnText}`,
    car_model: body.car_name,
    car_slug: body.car_slug || null,
    vehicle_url: body.car_slug ? `https://www.carmatch.vn/xe/${encodeURIComponent(String(body.car_slug))}` : null,
    building: locationName,
    rental_amount: Math.max(0, Number(body.base_amount) || 0),
    delivery_fee_amount: Math.max(0, Number(body.delivery_fee) || 0),
    loyalty_discount_amount: Math.max(0, Number(body.loyalty_discount) || 0),
    promo_discount_amount: Math.max(0, Number(body.promo_discount) || 0),
    total_amount: Math.max(0, Number(body.total_amount) || 0),
    pricing_snapshot: {
      delivery_mode: body.delivery_mode,
      promo_code: body.promo_code || null,
      loyalty_tier: body.loyalty_tier || null,
      captured_at: new Date().toISOString(),
    },
    note: noteLines,
    status: body.requires_confirmation === true ? 'partner_pending' : 'new',
  });

  if (error) {
    console.error('[bookings] Supabase error:', error.message);
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
          <tr><td style="padding:6px 0;color:#64748b">Nhận xe</td><td style="padding:6px 0;font-weight:600">${body.pickup_date} ${body.pickup_hour}:00</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Trả xe</td><td style="padding:6px 0;font-weight:600">${body.return_date} ${body.return_hour}:00</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Tiền cọc</td><td style="padding:6px 0;font-weight:600;color:#0891b2">${depositAmount.toLocaleString('vi-VN')}đ</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Còn lại khi nhận xe</td><td style="padding:6px 0;font-weight:600;color:#dc2626">${(Number(body.total_amount) - depositAmount).toLocaleString('vi-VN')}đ</td></tr>
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
      totalAmount: body.total_amount,
      depositAmount,
    })
  ).catch(() => {});

  await sendPushToCompany(supabase, {
    title: '🔔 Lead website mới',
    body: `${body.customer_name.trim()} · ${body.car_name}`,
    url: '/web-leads',
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ bookingRef, depositAmount });
}
