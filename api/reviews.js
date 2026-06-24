import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req, res) {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Missing slug' });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json([]);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from('vehicle_reviews')
      .select('reviewer_name, rating, comment, trip_date, created_at')
      .eq('car_slug', slug)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[reviews:GET] Supabase error:', error.message);
      return res.status(500).json({ error: 'Không tải được đánh giá' });
    }

    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('[reviews:GET] Error:', err?.message);
    return res.status(500).json({ error: 'Không tải được đánh giá' });
  }
}

async function handlePost(req, res) {
  const { booking_ref, phone, rating, comment, reviewer_name } = req.body || {};

  if (!booking_ref || !phone || !rating || !reviewer_name) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating phải từ 1-5 sao' });
  }
  if (reviewer_name.trim().length < 2) {
    return res.status(400).json({ error: 'Tên không hợp lệ' });
  }
  if (comment && comment.length > 1000) {
    return res.status(400).json({ error: 'Nhận xét tối đa 1000 ký tự' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Service unavailable' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const refClean = String(booking_ref).trim().toUpperCase();
  const phoneClean = String(phone).trim().replace(/\s/g, '');

  // Verify booking exists and phone matches
  const { data: lead } = await supabase
    .from('website_leads')
    .select('booking_ref, phone, car_slug, duration')
    .eq('booking_ref', refClean)
    .maybeSingle();

  if (!lead) {
    return res.status(404).json({ error: 'Không tìm thấy đơn đặt xe với mã này' });
  }

  const leadPhone = String(lead.phone || '').trim().replace(/\s/g, '');
  if (leadPhone !== phoneClean) {
    return res.status(403).json({ error: 'Số điện thoại không khớp với đơn đặt xe' });
  }

  // Check trip has ended (parse return date from duration "YYYY-MM-DD HH:MM → YYYY-MM-DD HH:MM")
  if (lead.duration) {
    const returnPart = lead.duration.split(' → ')[1]?.trim().split(' ')[0];
    if (returnPart && returnPart > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ error: 'Chuyến đi chưa kết thúc — hãy quay lại sau khi trả xe' });
    }
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('vehicle_reviews')
    .select('id')
    .eq('booking_ref', refClean)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Bạn đã đánh giá chuyến đi này rồi' });
  }

  const { error: insertErr } = await supabase.from('vehicle_reviews').insert({
    car_slug: lead.car_slug || null,
    booking_ref: refClean,
    phone: phoneClean,
    reviewer_name: reviewer_name.trim(),
    rating: ratingNum,
    comment: comment?.trim() || null,
    trip_date: lead.duration?.split(' → ')[0]?.trim().split(' ')[0] || null,
    status: 'pending',
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      return res.status(409).json({ error: 'Bạn đã đánh giá chuyến đi này rồi' });
    }
    console.error('[reviews:POST] insert error:', insertErr.message);
    return res.status(500).json({ error: 'Lỗi gửi đánh giá, thử lại sau' });
  }

  return res.status(201).json({ success: true, message: 'Cảm ơn! Đánh giá của bạn đang chờ kiểm duyệt.' });
}
