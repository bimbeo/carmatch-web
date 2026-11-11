export const DEFAULT_PICKUP_HOUR = 8;
export const DEFAULT_RETURN_HOUR = 20;

export interface RentalPricingUnits {
  /** Số ngày/ca hiển thị cho khách và lưu cùng booking. */
  billingDays: number;
  /** Hệ số nhân giá ngày. Chỉ đơn đúng 0,5 ngày được tính 70%. */
  priceDays: number;
}

function calendarDayDifference(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  if (
    !fromYear || !fromMonth || !fromDay
    || !toYear || !toMonth || !toDay
  ) return Number.NaN;

  return Math.round((
    Date.UTC(toYear, toMonth - 1, toDay)
    - Date.UTC(fromYear, fromMonth - 1, fromDay)
  ) / 86_400_000);
}

function rentalRangeIsWeekdaysOnly(from: string, to: string): boolean {
  const calendarDays = calendarDayDifference(from, to);
  if (!Number.isFinite(calendarDays) || calendarDays < 0) return false;

  const [year, month, day] = from.split('-').map(Number);
  for (let offset = 0; offset <= calendarDays; offset += 1) {
    const weekday = new Date(Date.UTC(year, month - 1, day + offset)).getUTCDay();
    if (weekday === 0 || weekday === 6) return false;
  }
  return true;
}

/**
 * Trả về đồng thời số ngày hiển thị và hệ số tính tiền.
 *
 * Đơn đúng nửa ngày được lưu/hiển thị là 0,5 ngày nhưng tính 70% giá ngày.
 * Từ 1,5 ngày trở lên, hệ số giá bằng đúng số ngày hiển thị.
 * Quy tắc ưu đãi ca nhận 12:00–18:59 qua ngày chỉ áp dụng khi toàn bộ
 * khoảng thuê nằm từ thứ Hai đến thứ Sáu.
 */
export function calculateRentalPricingUnits(
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
  returnHour: number,
): RentalPricingUnits {
  const calendarDays = calendarDayDifference(pickupDate, returnDate);
  const totalHours = calendarDays * 24 + (returnHour - pickupHour);
  if (!Number.isFinite(calendarDays) || calendarDays < 0 || totalHours < 4) {
    return { billingDays: 0, priceDays: 0 };
  }

  if (calendarDays === 0) {
    const isMorningHalfDay = pickupHour >= 7 && pickupHour <= 12 && returnHour <= 12;
    const isAfternoonHalfDay = pickupHour >= 13 && returnHour <= 20;
    return isMorningHalfDay || isAfternoonHalfDay
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

  // Cuối tuần không áp dụng quy tắc ca chiều; tính đủ cả ngày nhận và ngày trả.
  if (pickupHour >= 12 && pickupHour < 19 && !weekdaysOnly) {
    return { billingDays: calendarDays + 1, priceDays: calendarDays + 1 };
  }

  return { billingDays: calendarDays, priceDays: calendarDays };
}

/**
 * Số ngày tính tiền theo quy tắc thuê xe hiện tại.
 *
 * Mốc nhận buổi sáng tính cả ngày nhận. Nếu khách chủ động chuyển sang nhận
 * buổi tối, ngày nhận chỉ là thời điểm bàn giao và số ngày được tính lại từ
 * khoảng thời gian thực tế.
 */
export function calculateRentalBillingDays(
  pickupDate: string,
  pickupHour: number,
  returnDate: string,
  returnHour: number,
): number {
  return calculateRentalPricingUnits(
    pickupDate,
    pickupHour,
    returnDate,
    returnHour,
  ).billingDays;
}

export function formatRentalBillingDays(days: number): string {
  if (days === 0.5 || days === 0.7) return 'Nửa ngày';
  if (days === 1) return '1 ngày';
  if (Number.isInteger(days)) return `${days} ngày`;

  const wholeDays = Math.floor(days);
  return wholeDays > 0
    ? `${wholeDays} ngày + nửa ngày`
    : 'Nửa ngày';
}
