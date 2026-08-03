export const DEFAULT_PICKUP_HOUR = 8;
export const DEFAULT_RETURN_HOUR = 20;

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
  const calendarDays = calendarDayDifference(pickupDate, returnDate);
  const totalHours = calendarDays * 24 + (returnHour - pickupHour);
  if (!Number.isFinite(calendarDays) || calendarDays < 0 || totalHours < 4) return 0;

  if (calendarDays === 0) {
    const isMorningHalfDay = pickupHour >= 7 && pickupHour <= 12 && returnHour <= 12;
    const isAfternoonHalfDay = pickupHour >= 13 && returnHour <= 20;
    return isMorningHalfDay || isAfternoonHalfDay ? 0.7 : 1;
  }

  if (pickupHour <= 11) return calendarDays + 1;
  if (pickupHour <= 15) return returnHour <= 12 ? calendarDays : calendarDays + 0.5;
  if (pickupHour >= 19 && returnHour <= 12) {
    return calendarDays === 1 ? 0.7 : (calendarDays - 1) + 0.5;
  }
  return calendarDays;
}

export function formatRentalBillingDays(days: number): string {
  if (days === 0.7) return 'Nửa ngày';
  if (days === 1) return '1 ngày';
  if (Number.isInteger(days)) return `${days} ngày`;

  const wholeDays = Math.floor(days);
  return wholeDays > 0
    ? `${wholeDays} ngày + nửa ngày`
    : 'Nửa ngày';
}
