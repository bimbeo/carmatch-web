export interface Car {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  priceMonth?: number;
  seats: number;
  fuel: 'Điện' | 'Xăng' | 'Dầu';
  transmission: string;
  kmPerDay: number;
  amenities: string[];
  conditions: string[];
  available: boolean;
  images: string[];
  category: 'electric' | 'gasoline' | 'diesel';
  popular?: boolean;
  useCases?: string[];
  description?: string;
}

const conditions = [
  'CCCD công dân (bản gốc)',
  'Giấy phép lái xe (GPLX) còn hạn',
  'Đặt cọc 30.000.000đ hoặc xe máy có giá trị tương đương',
];

export const cars: Car[] = [
  {
    id: 'vinfast-vf8',
    slug: 'vinfast-vf8',
    name: 'VinFast VF8',
    brand: 'VinFast',
    price: 1500000,
    priceMonth: 32000000,
    seats: 5,
    fuel: 'Điện',
    transmission: 'Tự động',
    kmPerDay: 250,
    amenities: ['Cảm biến lùi', 'ADAS an toàn', 'Dây sạc theo xe', 'Màn hình cảm ứng 15.6"', 'Điều hòa tự động'],
    conditions,
    available: true,
    images: [
      'https://images.unsplash.com/photo-1646644434370-a23a5eaa6d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMG1vZGVybiUyMGVsZWN0cmljJTIwU1VWJTIwc3R1ZGlvfGVufDF8fHx8MTc3NjQzNjA4MHww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    category: 'electric',
    popular: true,
    useCases: ['Gia đình', 'Du lịch', 'Doanh nghiệp'],
    description: 'SUV điện cao cấp nhất của VinFast. Công nghệ ADAS tiên tiến, vận hành êm ái, phù hợp cho cả gia đình và công tác doanh nghiệp.',
  },
  {
    id: 'vinfast-vf6',
    slug: 'vinfast-vf6',
    name: 'VinFast VF6',
    brand: 'VinFast',
    price: 1000000,
    priceMonth: 22000000,
    seats: 5,
    fuel: 'Điện',
    transmission: 'Tự động',
    kmPerDay: 250,
    amenities: ['Cảm biến lùi', 'ADAS an toàn', 'Dây sạc theo xe', 'Màn hình cảm ứng'],
    conditions,
    available: true,
    images: [
      'https://images.unsplash.com/photo-1676919297334-25fe2eb6f8a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaW5GYXN0JTIwVkY2JTIwZWxlY3RyaWMlMjBjcm9zc292ZXJ8ZW58MXx8fHwxNzc2NDM2MDc2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    category: 'electric',
    popular: true,
    useCases: ['Đi làm', 'Du lịch', 'Cá nhân'],
    description: 'Crossover điện cỡ trung của VinFast. Tiết kiệm chi phí vận hành, phù hợp di chuyển nội thành và các chuyến ngắn ngày.',
  },
  {
    id: 'vinfast-vf5',
    slug: 'vinfast-vf5',
    name: 'VinFast VF5',
    brand: 'VinFast',
    price: 800000,
    priceMonth: 18000000,
    seats: 5,
    fuel: 'Điện',
    transmission: 'Tự động',
    kmPerDay: 250,
    amenities: ['Cảm biến lùi', 'ADAS an toàn', 'Dây sạc theo xe'],
    conditions,
    available: true,
    images: [
      'https://images.unsplash.com/photo-1774852276663-ed14cf53947e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaW5GYXN0JTIwVkY1JTIwY29tcGFjdCUyMFNVVnxlbnwxfHx8fDE3NzY0MzYwNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    category: 'electric',
    useCases: ['Đi làm', 'Cá nhân', 'Tiết kiệm'],
    description: 'Xe điện nhỏ gọn, linh hoạt nhất trong dòng VinFast. Lý tưởng cho di chuyển nội thành và những ai mới trải nghiệm xe điện.',
  },
  {
    id: 'toyota-innova',
    slug: 'toyota-innova',
    name: 'Toyota Innova',
    brand: 'Toyota',
    price: 800000,
    priceMonth: 20000000,
    seats: 7,
    fuel: 'Xăng',
    transmission: 'Tự động',
    kmPerDay: 300,
    amenities: ['Cảm biến lùi', 'Camera lùi', 'Điều hòa 2 hàng', 'Ghế da', 'Cổng sạc USB'],
    conditions,
    available: true,
    images: [
      'https://images.unsplash.com/photo-1709620435392-c1ecacde8bd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb3lvdGElMjBJbm5vdmElMjBzaWx2ZXIlMjBtaW5pdmFufGVufDF8fHx8MTc3NjQzNjA3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    category: 'gasoline',
    popular: true,
    useCases: ['Gia đình', 'Nhóm bạn', 'Doanh nghiệp'],
    description: 'Minivan 7 chỗ quen thuộc và đáng tin cậy. Không gian rộng rãi, phù hợp cho gia đình lớn hoặc nhóm bạn đi du lịch.',
  },
  {
    id: 'kia-carnival',
    slug: 'kia-carnival',
    name: 'Kia Carnival',
    brand: 'Kia',
    price: 2000000,
    priceMonth: 38000000,
    seats: 7,
    fuel: 'Dầu',
    transmission: 'Tự động',
    kmPerDay: 300,
    amenities: ['Cảm biến lùi', 'ADAS an toàn', 'Cửa trượt điện', 'Màn hình sau', 'Ghế chỉnh điện'],
    conditions,
    available: true,
    images: [
      'https://images.unsplash.com/photo-1709791195523-4e9382c2dc6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLaWElMjBDYXJuaXZhbCUyMG1vZGVybiUyMG1pbml2YW58ZW58MXx8fHwxNzc2NDM2MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    category: 'diesel',
    popular: true,
    useCases: ['VIP', 'Gia đình', 'Sự kiện', 'Doanh nghiệp'],
    description: 'MPV cao cấp hàng đầu phân khúc. Nội thất sang trọng, cửa trượt điện, phù hợp cho sự kiện đặc biệt và di chuyển VIP.',
  },
  {
    id: 'hyundai-creta',
    slug: 'hyundai-creta',
    name: 'Hyundai Creta',
    brand: 'Hyundai',
    price: 1000000,
    priceMonth: 22000000,
    seats: 5,
    fuel: 'Xăng',
    transmission: 'Tự động',
    kmPerDay: 300,
    amenities: ['Cảm biến lùi', 'Camera lùi', 'Điều hòa tự động', 'Màn hình cảm ứng 10.25"'],
    conditions,
    available: true,
    images: [
      'https://images.unsplash.com/photo-1638715403373-ab0e256782f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIeXVuZGFpJTIwQ3JldGElMjB3aGl0ZSUyMFNVVnxlbnwxfHx8fDE3NzY0MzYwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    category: 'gasoline',
    useCases: ['Cá nhân', 'Cặp đôi', 'Chuyến ngắn'],
    description: 'Crossover 5 chỗ năng động, tiết kiệm nhiên liệu. Thiết kế thể thao, phù hợp cho các chuyến đi ngắn ngày hoặc di chuyển hàng ngày.',
  },
];

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ';
}

export function formatPriceShort(price: number): string {
  if (price >= 1000000) {
    const m = price / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  return (price / 1000).toFixed(0) + 'K';
}
