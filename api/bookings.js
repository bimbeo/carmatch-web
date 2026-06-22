import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/bookings?action=upload-proof — payment proof image upload
  if (req.method === 'POST' && req.query.action === 'upload-proof') {
    let body2;
    try { body2 = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
    const { booking_ref, file_base64, file_name } = body2 || {};
    if (!booking_ref || !file_base64) return res.status(400).json({ error: 'Missing booking_ref or file_base64' });
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });
    const supabaseUp = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const base64Clean = file_base64.replace(/^data:image\/[a-z+]+;base64,/i, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const ext = (file_name?.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const safeName = booking_ref.replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = `${safeName}.${ext}`;
    const mimeMap = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
    const contentType = mimeMap[ext] || 'image/jpeg';
    const { error: uploadError } = await supabaseUp.storage.from('payment-proofs').upload(path, buffer, { contentType, upsert: true });
    if (uploadError) { console.error('[bookings] upload-proof error:', uploadError.message); return res.status(500).json({ error: 'Upload thất bại, vui lòng thử lại' }); }
    const { data: { publicUrl } } = supabaseUp.storage.from('payment-proofs').getPublicUrl(path);
    await supabaseUp.from('website_leads').update({ payment_proof_url: publicUrl }).eq('booking_ref', booking_ref.trim().toUpperCase());
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ url: publicUrl });
  }

  // GET /api/bookings?ref=XXXX — booking lookup
  if (req.method === 'GET') {
    const { ref } = req.query;
    if (!ref || typeof ref !== 'string') return res.status(400).json({ error: 'Missing ref' });
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from('website_leads')
      .select('booking_ref, name, phone, car_model, duration, deposit_amount, note, status, created_at, building')
      .eq('booking_ref', ref.trim().toUpperCase())
      .eq('form_type', 'booking')
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'Lỗi tra cứu' });
    if (!data) return res.status(404).json({ error: 'Không tìm thấy đơn đặt xe này' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    `Cọc VietQR: ${depositAmount.toLocaleString('vi-VN')}đ`,
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
    building: locationName,
    note: noteLines,
    status: 'new',
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

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ bookingRef, depositAmount });
}
