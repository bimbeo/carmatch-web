import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
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

  // Gửi email xác nhận nếu khách cung cấp email (fire-and-forget)
  const customerEmail = body.customer_email || null;
  if (customerEmail && process.env.RESEND_API_KEY) {
    const subject = `[CarMatch] Xác nhận đặt xe ${bookingRef}`;
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
          CarMatch sẽ liên hệ xác nhận trong vòng 30 phút.<br>
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
        from: 'CarMatch <booking@carmatch.vn>',
        to: [customerEmail],
        subject,
        html: htmlBody,
      }),
    }).catch(err => console.error('[bookings] Resend error:', err.message));
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ bookingRef, depositAmount });
}
