const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parsePromoDate(value) {
  const text = String(value || '').trim();
  if (!DATE_PATTERN.test(text)) return null;
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calendarDaysBetween(fromValue, toValue) {
  const from = parsePromoDate(fromValue);
  const to = parsePromoDate(toValue);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function promoDiscountAmount(promo, subtotalValue) {
  const subtotal = Math.max(0, Number(subtotalValue) || 0);
  const discountValue = Math.max(0, Number(promo?.discount_value) || 0);
  let amount = promo?.discount_type === 'percent'
    ? Math.round(((subtotal * discountValue) / 100) / 10_000) * 10_000
    : discountValue;
  if (promo?.max_discount !== null && promo?.max_discount !== undefined) {
    amount = Math.min(amount, Math.max(0, Number(promo.max_discount) || 0));
  }
  return Math.max(0, Math.min(amount, subtotal));
}

export function evaluatePromoTargeting(promo, context = {}) {
  const now = context.now instanceof Date ? context.now : new Date(context.now || Date.now());
  const pickupDate = parsePromoDate(context.pickupDate);
  const rentalDays = Number(context.rentalDays);
  const advanceDays = pickupDate
    ? Math.floor((pickupDate.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86_400_000)
    : null;

  if (promo?.starts_at && new Date(promo.starts_at) > now) return 'Chương trình chưa bắt đầu';
  if (promo?.expires_at && new Date(promo.expires_at) < now) return 'Đã hết hạn';
  if (promo?.uses_limit !== null && promo?.uses_limit !== undefined
    && Number(promo.uses_count || 0) >= Number(promo.uses_limit)) return 'Đã hết lượt sử dụng';
  if (Number(promo?.min_order || 0) > Number(context.totalAmount || 0)) {
    return `Đơn tối thiểu ${Number(promo.min_order).toLocaleString('vi-VN')}đ`;
  }
  if (promo?.min_rental_days !== null && promo?.min_rental_days !== undefined
    && Number.isFinite(rentalDays) && rentalDays < Number(promo.min_rental_days)) {
    return `Áp dụng từ ${Number(promo.min_rental_days).toLocaleString('vi-VN')} ngày thuê`;
  }
  if (promo?.max_rental_days !== null && promo?.max_rental_days !== undefined
    && Number.isFinite(rentalDays) && rentalDays > Number(promo.max_rental_days)) {
    return `Chỉ áp dụng tối đa ${Number(promo.max_rental_days).toLocaleString('vi-VN')} ngày thuê`;
  }
  if (pickupDate && Array.isArray(promo?.applicable_weekdays) && promo.applicable_weekdays.length > 0
    && !promo.applicable_weekdays.map(Number).includes(pickupDate.getUTCDay())) {
    return 'Không áp dụng cho ngày nhận xe đã chọn';
  }
  if (promo?.weekends_only && pickupDate && ![0, 6].includes(pickupDate.getUTCDay())) {
    return 'Chỉ áp dụng cuối tuần';
  }
  if (advanceDays !== null && promo?.min_advance_days !== null && promo?.min_advance_days !== undefined
    && advanceDays < Number(promo.min_advance_days)) {
    return `Cần đặt trước ít nhất ${Number(promo.min_advance_days)} ngày`;
  }
  if (advanceDays !== null && promo?.max_advance_days !== null && promo?.max_advance_days !== undefined
    && advanceDays > Number(promo.max_advance_days)) {
    return `Chỉ áp dụng khi đặt trước tối đa ${Number(promo.max_advance_days)} ngày`;
  }
  return null;
}

export function chooseBestDiscount({ loyaltyAmount = 0, promoAmount = 0 } = {}) {
  const loyalty = Math.max(0, Number(loyaltyAmount) || 0);
  const promo = Math.max(0, Number(promoAmount) || 0);
  if (promo > loyalty) {
    return { source: 'promo', loyaltyDiscount: 0, promoDiscount: promo, amount: promo };
  }
  if (loyalty > 0) {
    return { source: 'loyalty', loyaltyDiscount: loyalty, promoDiscount: 0, amount: loyalty };
  }
  return { source: null, loyaltyDiscount: 0, promoDiscount: 0, amount: 0 };
}

export function sortPromosForCustomer(promos) {
  return [...promos].sort((a, b) => (
    Number(b.applicable) - Number(a.applicable)
    || Number(b.auto_apply) - Number(a.auto_apply)
    || Number(b.discount_amount || 0) - Number(a.discount_amount || 0)
    || Number(b.priority || 0) - Number(a.priority || 0)
  ));
}
