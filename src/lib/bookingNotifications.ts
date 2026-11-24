export interface BookingScheduleRange {
  from: string;
  to: string;
}

export interface BookingScheduleNotice {
  tone: 'warning' | 'danger';
  message: string;
}

interface BookingScheduleNoticeInput {
  availabilityUnavailable: boolean;
  requiresConfirmation: boolean;
  hardConflicts: BookingScheduleRange[];
  boundaryConflicts: BookingScheduleRange[];
  pickupDate: string;
  pickupHour: number;
  returnDate: string;
  returnHour: number;
}

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${Number(day)}/${Number(month)}`;
}

/**
 * Maps availability results to the single schedule notice shown by BookingWidget.
 * Business checks still run independently; this helper only centralizes UX copy.
 */
export function getBookingScheduleNotice({
  availabilityUnavailable,
  requiresConfirmation,
  hardConflicts,
  boundaryConflicts,
  pickupDate,
  pickupHour,
  returnDate,
  returnHour,
}: BookingScheduleNoticeInput): BookingScheduleNotice | null {
  if (hardConflicts.length > 0) {
    return {
      tone: 'danger',
      message: 'Xe không khả dụng trong khung giờ này. Vui lòng chọn thời gian hoặc xe khác.',
    };
  }

  if (availabilityUnavailable) {
    return {
      tone: 'warning',
      message: 'Chưa kiểm tra được lịch xe. Bạn có thể gửi yêu cầu để Car Match xác minh.',
    };
  }

  const previousRental = boundaryConflicts.find((range) => range.to === pickupDate);
  if (previousRental) {
    const returnDateLabel = formatShortDate(previousRental.to);
    return {
      tone: 'warning',
      message: pickupHour >= 21
        ? `Xe có lịch về ngày ${returnDateLabel}. Giờ nhận từ 21:00 cần được xác nhận sau khi kiểm tra xe.`
        : `Xe có lịch về ngày ${returnDateLabel}. Giờ nhận ${pickupHour}:00 cần được Car Match xác nhận.`,
    };
  }

  const nextRental = boundaryConflicts.find((range) => range.from === returnDate);
  if (nextRental) {
    return {
      tone: 'warning',
      message: `Xe có lịch nhận khách ngày ${formatShortDate(nextRental.from)}. Giờ trả ${returnHour}:00 cần được Car Match xác nhận.`,
    };
  }

  if (requiresConfirmation) {
    return {
      tone: 'warning',
      message: 'Lịch thuê cần được Car Match xác nhận trước khi hướng dẫn đặt cọc.',
    };
  }

  return null;
}
