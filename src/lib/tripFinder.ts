import { defaultTripDestination, tripDestinations, type TripDestination } from '@/data/tripDestinations';

export function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function findTripDestination(destination: string): TripDestination {
  const normalized = normalizeText(destination);
  if (!normalized) return defaultTripDestination;

  return (
    tripDestinations.find((item) => normalizeText(item.name) === normalized) ||
    tripDestinations.find((item) => normalizeText(item.name).includes(normalized)) ||
    tripDestinations.find((item) => normalized.includes(normalizeText(item.name))) ||
    {
      slug: 'custom',
      name: destination,
      distanceKm: 100,
      duration: '1-2 ngày',
      ideal: 'Nhóm nhỏ, xe 5 chỗ là lựa chọn linh hoạt',
      route: `Hà Nội → ${destination}`,
      stops: ['Điểm dừng nghỉ phù hợp trên tuyến', 'Khu vực nhận/trả xe theo hẹn'],
      schedule: [
        {
          title: 'Gợi ý',
          items: ['Nhận xe tại Hà Nội', `Di chuyển tới ${destination}`, 'Dự phòng thời gian nghỉ giữa chặng', 'Trả xe theo lịch đã đặt'],
        },
      ],
      notes: ['Đây là ước tính mặc định cho điểm đến chưa có cấu hình riêng.', 'CarMatch sẽ kiểm tra lại tuyến, phí đường và xe phù hợp khi liên hệ tư vấn.'],
      faq: [
        {
          question: 'Chi phí này đã chính xác hoàn toàn chưa?',
          answer: 'Chưa. Đây là ước tính ban đầu để khách hình dung ngân sách. CarMatch sẽ xác nhận lại theo xe, ngày thuê và tuyến thực tế.',
        },
      ],
      tollEstimate: 180000,
    }
  );
}

export function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseTripDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addTripDays(dateInput: string, days: number) {
  const date = parseTripDate(dateInput) || new Date();
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

export function calculateRentalDays(pickupDate: string, returnDate: string) {
  const pickup = parseTripDate(pickupDate);
  const returned = parseTripDate(returnDate);
  if (!pickup || !returned) return 1;
  const diff = Math.ceil((returned.getTime() - pickup.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff || 1);
}

export function estimateEnergyCost(roundTripKm: number, fuel: string | undefined, destination?: TripDestination) {
  if (destination?.fuelCostPerKm) return Math.round(roundTripKm * destination.fuelCostPerKm);
  return Math.round(roundTripKm * (fuel === 'Điện' ? 550 : 1800));
}

export function formatCurrencyShort(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'Liên hệ';
  if (value >= 1_000_000) {
    const million = value / 1_000_000;
    return `${million % 1 === 0 ? million.toFixed(0) : million.toFixed(1)} triệu`;
  }
  return `${Math.round(value / 1000)}K`;
}

