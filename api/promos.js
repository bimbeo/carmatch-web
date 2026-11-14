import { createClient } from '@supabase/supabase-js';
import { applyCors, isPreflightAllowed, rateLimit } from './_security.js';
import {
  evaluatePromoTargeting,
  promoDiscountAmount,
  sortPromosForCustomer,
} from './_promo-engine.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const COMPANY_CODE = 'carmatch';
const HOLIDAY_PRICING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BOOKED_STATUSES = ['pending_deposit', 'confirmed', 'assigned', 'pickup_due', 'running', 'return_due', 'completed'];
const LEGACY_PROMO_FIELDS = 'code, description, discount_type, discount_value, max_discount, min_order, uses_limit, uses_count, expires_at, active, secret_only, first_time_only, weekends_only, phone_restriction';
const TARGETING_PROMO_FIELDS = `${LEGACY_PROMO_FIELDS}, starts_at, min_rental_days, max_rental_days, applicable_weekdays, min_advance_days, max_advance_days, auto_apply, priority, campaign_type`;

function isMissingTargetingColumn(error) {
  return Boolean(error && /column|schema cache|starts_at|min_rental_days|auto_apply|campaign_type/i.test(error.message || ''));
}

function withPromoTargetingDefaults(promo) {
  return {
    starts_at: null,
    min_rental_days: null,
    max_rental_days: null,
    applicable_weekdays: null,
    min_advance_days: null,
    max_advance_days: null,
    auto_apply: false,
    priority: 0,
    campaign_type: 'coupon',
    ...promo,
  };
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

async function getCompanyId(supabase) {
  const { data, error } = await supabase.from('companies').select('id').eq('code', COMPANY_CODE).maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

async function hasPriorBooking(supabase, phoneValue) {
  const phone = normalizePhone(phoneValue);
  if (!phone) return false;
  const companyId = await getCompanyId(supabase);
  if (!companyId) return false;
  const phone84 = phone.startsWith('0') ? `84${phone.slice(1)}` : phone;
  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('company_id', companyId)
    .or(`phone.eq.${phone},normalized_phone.eq.${phone},phone.eq.${phone84},normalized_phone.eq.${phone84}`);
  if (customerError) throw customerError;
  const customerIds = (customers || []).map((item) => item.id).filter(Boolean);
  if (customerIds.length === 0) return false;
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('customer_id', customerIds)
    .in('status', BOOKED_STATUSES);
  if (error) throw error;
  return Number(count || 0) > 0;
}

async function loadPromoList(supabase) {
  let query = supabase
    .from('promo_codes')
    .select(TARGETING_PROMO_FIELDS)
    .eq('active', true)
    .eq('secret_only', false)
    .order('created_at', { ascending: false });
  let { data, error } = await query;
  if (isMissingTargetingColumn(error)) {
    ({ data, error } = await supabase
      .from('promo_codes')
      .select(LEGACY_PROMO_FIELDS)
      .eq('active', true)
      .eq('secret_only', false)
      .order('created_at', { ascending: false }));
  }
  if (error) throw error;
  return (data || []).map(withPromoTargetingDefaults);
}

async function loadPromoByCode(supabase, code) {
  let { data, error } = await supabase
    .from('promo_codes')
    .select(TARGETING_PROMO_FIELDS)
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();
  if (isMissingTargetingColumn(error)) {
    ({ data, error } = await supabase
      .from('promo_codes')
      .select(LEGACY_PROMO_FIELDS)
      .eq('code', code)
      .eq('active', true)
      .maybeSingle());
  }
  if (error) throw error;
  return data ? withPromoTargetingDefaults(data) : null;
}

function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeHolidayDate(value) {
  const date = String(value || '').trim();
  return HOLIDAY_PRICING_DATE_PATTERN.test(date) ? date : '';
}

async function bookingRangeTouchesHoliday(supabase, pickupDateValue, returnDateValue) {
  const pickupDate = normalizeHolidayDate(pickupDateValue);
  const returnDate = normalizeHolidayDate(returnDateValue || pickupDateValue);
  if (!pickupDate || !returnDate) return false;

  const from = pickupDate <= returnDate ? pickupDate : returnDate;
  const to = pickupDate <= returnDate ? returnDate : pickupDate;
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('code', COMPANY_CODE)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company?.id) return false;

  const { data, error } = await supabase
    .from('holiday_pricing_rules')
    .select('id')
    .eq('company_id', company.id)
    .eq('active', true)
    .lte('start_date', to)
    .gte('end_date', from)
    .limit(1);
  if (error) throw error;

  return (data || []).length > 0;
}

async function listPromos(req, res) {
  const totalAmount = Number(req.query.total || 0);
  const rentalDays = Number(req.query.rental_days || 0);
  const customerPhone = String(req.query.phone || '').trim();

  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(200).json({ promos: [] });

  const supabase = createSupabaseClient();
  let holidayPromoBlocked = false;
  try {
    holidayPromoBlocked = await bookingRangeTouchesHoliday(
      supabase,
      req.query.pickup_date,
      req.query.return_date,
    );
  } catch (holidayError) {
    console.error('[promos:list] Holiday lookup error:', holidayError.message);
  }

  let data;
  try {
    data = await loadPromoList(supabase);
  } catch (error) {
    console.error('[promos:list] Supabase error:', error.message);
    return res.status(200).json({ promos: [] });
  }

  let customerHasPriorBooking = false;
  if (customerPhone && data.some((promo) => promo.first_time_only)) {
    try {
      customerHasPriorBooking = await hasPriorBooking(supabase, customerPhone);
    } catch (error) {
      console.error('[promos:list] First booking lookup error:', error.message);
    }
  }

  const now = new Date();
  const promos = (data || []).map((p) => {
    let applicable = true;
    let reason = null;

    const targetingReason = evaluatePromoTargeting(p, {
      totalAmount,
      rentalDays,
      pickupDate: req.query.pickup_date,
    });
    if (holidayPromoBlocked) {
      applicable = false;
      reason = 'Không áp dụng vào ngày lễ / cao điểm';
    } else if (targetingReason) {
      applicable = false;
      reason = targetingReason;
    } else if (p.phone_restriction && !customerPhone) {
      applicable = false;
      reason = 'Nhập số điện thoại để kiểm tra';
    } else if (p.phone_restriction && normalizePhone(p.phone_restriction) !== normalizePhone(customerPhone)) {
      applicable = false;
      reason = 'Mã dành riêng cho khách hàng khác';
    } else if (p.first_time_only && !customerPhone) {
      applicable = false;
      reason = 'Nhập số điện thoại để kiểm tra khách lần đầu';
    } else if (p.first_time_only && customerHasPriorBooking) {
      applicable = false;
      reason = 'Chỉ dành cho khách chưa từng có booking';
    }

    const discountValue = Number(p.discount_value || 0);
    const maxDiscount = p.max_discount ? Number(p.max_discount) : null;

    let discountAmount = 0;
    if (applicable && totalAmount > 0) {
      discountAmount = promoDiscountAmount(p, totalAmount);
    }

    const description = p.description || (
      p.discount_type === 'percent'
        ? `Giảm ${discountValue}%${maxDiscount ? ` (tối đa ${Number(maxDiscount).toLocaleString('vi-VN')}đ)` : ''}`
        : `Giảm ${Number(discountValue).toLocaleString('vi-VN')}đ`
    );

    let expiresWarning = null;
    if (p.expires_at && applicable) {
      const daysLeft = Math.ceil((new Date(p.expires_at) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3 && daysLeft > 0) expiresWarning = `Hết hạn sau ${daysLeft} ngày`;
    }

    return {
      code: p.code,
      discount_type: p.discount_type,
      discount_value: discountValue,
      max_discount: maxDiscount,
      discount_amount: discountAmount,
      description,
      applicable,
      reason,
      expires_warning: expiresWarning,
      auto_apply: Boolean(p.auto_apply),
      priority: Number(p.priority || 0),
      campaign_type: p.campaign_type || 'coupon',
    };
  });

  return res.status(200).json({ promos: sortPromosForCustomer(promos) });
}

async function listHolidayPricing(_req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(200).json({ rules: [] });
  }

  try {
    const supabase = createSupabaseClient();
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('code', COMPANY_CODE)
      .single();
    if (companyError) throw companyError;

    let { data, error } = await supabase
      .from('holiday_pricing_rules')
      .select('id,name,start_date,end_date,adjustment_type,adjustment_value,booking_windows,note')
      .eq('company_id', company.id)
      .eq('active', true)
      .order('start_date', { ascending: true });
    if (error && /booking_windows|column/i.test(error.message || '')) {
      ({ data, error } = await supabase
        .from('holiday_pricing_rules')
        .select('id,name,start_date,end_date,adjustment_type,adjustment_value,note')
        .eq('company_id', company.id)
        .eq('active', true)
        .order('start_date', { ascending: true }));
    }
    if (error) throw error;

    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=120');
    return res.status(200).json({
      rules: (data || []).map((rule) => ({
        ...rule,
        adjustment_value: Number(rule.adjustment_value),
        booking_windows: Array.isArray(rule.booking_windows) ? rule.booking_windows : [],
      })),
    });
  } catch (error) {
    console.error('[holiday-pricing]', error);
    return res.status(200).json({ rules: [] });
  }
}

async function validatePromo(req, res) {
  const code = String(req.query.code || '').trim().toUpperCase();
  const totalAmount = Number(req.query.total || 0);
  const customerPhone = String(req.query.phone || '').trim();
  const pickupDate = String(req.query.pickup_date || '').trim();
  const returnDate = String(req.query.return_date || pickupDate).trim();
  const rentalDays = Number(req.query.rental_days || 0);

  if (!code) return res.status(400).json({ error: 'Mã không hợp lệ' });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Service unavailable' });

  const supabase = createSupabaseClient();
  try {
    if (await bookingRangeTouchesHoliday(supabase, pickupDate, returnDate)) {
      return res.status(400).json({ error: 'Mã giảm giá không áp dụng vào ngày lễ / cao điểm' });
    }
  } catch (holidayError) {
    console.error('[promos:validate] Holiday lookup error:', holidayError.message);
  }

  let data;
  try {
    data = await loadPromoByCode(supabase, code);
  } catch (error) {
    console.error('[promos:validate] Supabase error:', error.message);
    return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
  }

  if (!data) {
    const { data: referrer, error: refError } = await supabase
      .from('customers')
      .select('id, full_name, referral_code')
      .eq('referral_code', code)
      .eq('status', 'active')
      .maybeSingle();

    if (refError) {
      console.error('[promos:referral] Referral lookup error:', refError.message);
      return res.status(500).json({ error: 'Lỗi hệ thống, thử lại sau' });
    }

    if (!referrer) return res.status(404).json({ error: 'Mã không hợp lệ' });

    const referralDiscount = Number(process.env.REFERRAL_DISCOUNT_AMOUNT || 50000);
    const discountAmount = Math.max(0, Math.min(referralDiscount, totalAmount));
    return res.status(200).json({
      code: referrer.referral_code,
      discount_type: 'referral',
      discount_value: referralDiscount,
      max_discount: null,
      discount_amount: discountAmount,
      referrer_id: referrer.id,
      referrer_name: referrer.full_name,
    });
  }

  const targetingReason = evaluatePromoTargeting(data, { totalAmount, rentalDays, pickupDate });
  if (targetingReason) return res.status(400).json({ error: targetingReason });

  if (data.phone_restriction) {
    if (!customerPhone) return res.status(400).json({ error: 'Mã này chỉ dành riêng cho một khách hàng cụ thể' });
    const normalizedRestriction = data.phone_restriction.replace(/^0/, '84');
    const normalizedCustomer = customerPhone.replace(/[\s\-().+]/g, '').replace(/^0/, '84');
    if (normalizedRestriction !== normalizedCustomer && data.phone_restriction !== customerPhone) {
      return res.status(400).json({ error: 'Mã này không áp dụng được cho số điện thoại của bạn' });
    }
  }

  if (data.first_time_only) {
    if (!customerPhone) return res.status(400).json({ error: 'Nhập số điện thoại để kiểm tra ưu đãi khách lần đầu' });
    if (await hasPriorBooking(supabase, customerPhone)) {
      return res.status(400).json({ error: 'Mã chỉ dành cho khách chưa từng có booking' });
    }
  }

  const discountValue = Number(data.discount_value || 0);
  const maxDiscount = data.max_discount ? Number(data.max_discount) : null;

  const discountAmount = promoDiscountAmount(data, totalAmount);

  return res.status(200).json({
    code: data.code,
    discount_type: data.discount_type,
    discount_value: discountValue,
    max_discount: maxDiscount,
    discount_amount: discountAmount,
    auto_apply: Boolean(data.auto_apply),
    priority: Number(data.priority || 0),
    campaign_type: data.campaign_type || 'coupon',
  });
}

export default async function handler(req, res) {
  applyCors(req, res, { methods: 'GET,OPTIONS' });
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return isPreflightAllowed(req) ? res.status(204).end() : res.status(403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const action = String(req.query.action || '').trim();
  const maxRequests = action === 'validate' ? 40 : action === 'holiday-pricing' ? 120 : 80;
  if (!rateLimit(req, res, { id: `promos:${action || 'unknown'}`, windowMs: 60_000, max: maxRequests })) return;
  if (action === 'holiday-pricing') return listHolidayPricing(req, res);
  if (action === 'list') return listPromos(req, res);
  if (action === 'validate') return validatePromo(req, res);

  return res.status(400).json({ error: 'Invalid promo action' });
}
