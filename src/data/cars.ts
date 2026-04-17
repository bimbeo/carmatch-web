export interface Car {
  slug: string;
  name: string;
  price: number;
  seats: number;
  fuel: 'Điện' | 'Xăng' | 'Dầu';
  transmission: string;
  kmPerDay: number;
  amenities: string[];
  conditions: string[];
  available: boolean;
  image: string;
  category: 'electric' | 'gasoline' | 'diesel';
}

const conditions = [
  'CCCD công dân',
  'Giấy phép lái xe (GPLX)',
  'Đặt cọc 30.000.000đ hoặc xe máy có giá trị tương đương',
];

export const cars: Car[] = [
  {
    slug: 'vinfast-vf8',
    name: 'VinFast VF8',
    price: 1500000,
    seats: 5,
    fuel: 'Điện',
    transmission: 'Tự động',
    kmPerDay: 250,
    amenities: ['Cảm biến lùi', 'ADAS', 'Dây sạc theo xe'],
    conditions,
    available: true,
    image: 'https://images.unsplash.com/photo-1646644434370-a23a5eaa6d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMG1vZGVybiUyMGVsZWN0cmljJTIwU1VWJTIwc3R1ZGlvfGVufDF8fHx8MTc3NjQzNjA4MHww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'electric',
  },
  {
    slug: 'vinfast-vf6',
    name: 'VinFast VF6',
    price: 1000000,
    seats: 5,
    fuel: 'Điện',
    transmission: 'Tự động',
    kmPerDay: 250,
    amenities: ['Cảm biến lùi', 'ADAS', 'Dây sạc theo xe'],
    conditions,
    available: true,
    image: 'https://images.unsplash.com/photo-1676919297334-25fe2eb6f8a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaW5GYXN0JTIwVkY2JTIwZWxlY3RyaWMlMjBjcm9zc292ZXJ8ZW58MXx8fHwxNzc2NDM2MDc2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'electric',
  },
  {
    slug: 'vinfast-vf5',
    name: 'VinFast VF5',
    price: 800000,
    seats: 5,
    fuel: 'Điện',
    transmission: 'Tự động',
    kmPerDay: 250,
    amenities: ['Cảm biến lùi', 'ADAS', 'Dây sạc theo xe'],
    conditions,
    available: true,
    image: 'https://images.unsplash.com/photo-1774852276663-ed14cf53947e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxWaW5GYXN0JTIwVkY1JTIwY29tcGFjdCUyMFNVVnxlbnwxfHx8fDE3NzY0MzYwNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'electric',
  },
  {
    slug: 'toyota-innova',
    name: 'Toyota Innova',
    price: 800000,
    seats: 7,
    fuel: 'Xăng',
    transmission: 'Tự động',
    kmPerDay: 300,
    amenities: ['Cảm biến lùi', 'Camera lùi', 'Điều hòa 2 hàng'],
    conditions,
    available: true,
    image: 'https://images.unsplash.com/photo-1709620435392-c1ecacde8bd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb3lvdGElMjBJbm5vdmElMjBzaWx2ZXIlMjBtaW5pdmFufGVufDF8fHx8MTc3NjQzNjA3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'gasoline',
  },
  {
    slug: 'kia-carnival',
    name: 'Kia Carnival',
    price: 2000000,
    seats: 7,
    fuel: 'Dầu',
    transmission: 'Tự động',
    kmPerDay: 300,
    amenities: ['Cảm biến lùi', 'ADAS', 'Cửa trượt điện'],
    conditions,
    available: true,
    image: 'https://images.unsplash.com/photo-1709791195523-4e9382c2dc6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLaWElMjBDYXJuaXZhbCUyMG1vZGVybiUyMG1pbml2YW58ZW58MXx8fHwxNzc2NDM2MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'diesel',
  },
  {
    slug: 'hyundai-creta',
    name: 'Hyundai Creta',
    price: 1000000,
    seats: 5,
    fuel: 'Xăng',
    transmission: 'Tự động',
    kmPerDay: 300,
    amenities: ['Cảm biến lùi', 'Camera lùi', 'Điều hòa tự động'],
    conditions,
    available: true,
    image: 'https://images.unsplash.com/photo-1638715403373-ab0e256782f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIeXVuZGFpJTIwQ3JldGElMjB3aGl0ZSUyMFNVVnxlbnwxfHx8fDE3NzY0MzYwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'gasoline',
  },
];

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ';
}
