function calendarDayDifference(from, to) {
  const [fromYear, fromMonth, fromDay] = String(from).split('-').map(Number);
  const [toYear, toMonth, toDay] = String(to).split('-').map(Number);
  if (!fromYear || !fromMonth || !fromDay || !toYear || !toMonth || !toDay) {
    return Number.NaN;
  }
  return Math.round((
    Date.UTC(toYear, toMonth - 1, toDay)
    - Date.UTC(fromYear, fromMonth - 1, fromDay)
  ) / 86_400_000);
}

function rentalRangeIsWeekdaysOnly(from, to) {
  const calendarDays = calendarDayDifference(from, to);
  if (!Number.isFinite(calendarDays) || calendarDays < 0) return false;

  const [year, month, day] = String(from).split('-').map(Number);
  for (let offset = 0; offset <= calendarDays; offset += 1) {
    const weekday = new Date(Date.UTC(year, month - 1, day + offset)).getUTCDay();
    if (weekday === 0 || weekday === 6) return false;
  }
  return true;
}

/**
 * Bản server của src/lib/rentalDuration.ts.
 * billingDays là số ngày khách nhìn thấy; chỉ đơn đúng 0,5 ngày dùng hệ số
 * 0,7 giá ngày. Các đơn dài hơn dùng đúng số ngày hiển thị để tính tiền.
 */
export function calculateRentalPricingUnits(pickupDate, pickupHourValue, returnDate, returnHourValue) {
  const pickupHour = Number(pickupHourValue);
  const returnHour = Number(returnHourValue);
  const calendarDays = calendarDayDifference(pickupDate, returnDate);
  const totalHours = calendarDays * 24 + (returnHour - pickupHour);
  if (!Number.isFinite(calendarDays) || calendarDays < 0 || totalHours < 4) {
    return { billingDays: 0, priceDays: 0 };
  }

  if (calendarDays === 0) {
    const morningHalfDay = pickupHour >= 7 && pickupHour <= 12 && returnHour <= 12;
    const afternoonHalfDay = pickupHour >= 13 && returnHour <= 20;
    return morningHalfDay || afternoonHalfDay
      ? { billingDays: 0.5, priceDays: 0.7 }
      : { billingDays: 1, priceDays: 1 };
  }

  if (pickupHour >= 7 && pickupHour <= 11) {
    return returnHour <= 12
      ? { billingDays: calendarDays + 0.5, priceDays: calendarDays + 0.5 }
      : { billingDays: calendarDays + 1, priceDays: calendarDays + 1 };
  }

  const weekdaysOnly = rentalRangeIsWeekdaysOnly(pickupDate, returnDate);
  if (pickupHour >= 12 && pickupHour <= 15 && weekdaysOnly) {
    return returnHour <= 12
      ? { billingDays: calendarDays, priceDays: calendarDays }
      : { billingDays: calendarDays + 0.5, priceDays: calendarDays + 0.5 };
  }
  if (pickupHour >= 16 && pickupHour < 19 && weekdaysOnly) {
    return { billingDays: calendarDays, priceDays: calendarDays };
  }
  if (pickupHour >= 19 && returnHour <= 12) {
    const billingDays = (calendarDays - 1) + 0.5;
    return {
      billingDays,
      priceDays: billingDays === 0.5 ? 0.7 : billingDays,
    };
  }
  if (pickupHour >= 12 && pickupHour < 19 && !weekdaysOnly) {
    return { billingDays: calendarDays + 1, priceDays: calendarDays + 1 };
  }
  return { billingDays: calendarDays, priceDays: calendarDays };
}
