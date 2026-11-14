import type { Car } from './cars';

export type EvFamily = 'VF3' | 'VF5' | 'VF6' | 'VF7' | 'VF8' | 'Limo Green';

export interface EvVehicleSpec {
  key: string;
  family: EvFamily;
  displayName: string;
  trim: string;
  modelYear: number | null;
  batteryCapacityKwh: number | null;
  rangeKm: number | null;
  rangeStandard: 'NEDC' | null;
  dcMaxKw: number | null;
  fastCharge: string | null;
  sourceUrl: string;
  verifiedAt: string;
}

export const EV_FAMILIES: EvFamily[] = ['VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'Limo Green'];

export const EV_VEHICLE_SPECS: EvVehicleSpec[] = [
  {
    key: 'vf3-current', family: 'VF3', displayName: 'VinFast VF3', trim: 'Tiêu chuẩn', modelYear: null,
    batteryCapacityKwh: 18.64, rangeKm: 215, rangeStandard: 'NEDC', dcMaxKw: 24,
    fastCharge: '10–70%, khoảng 36 phút', sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-dien-vf3', verifiedAt: '2026-11-14',
  },
  {
    key: 'vf5-current', family: 'VF5', displayName: 'VinFast VF5', trim: 'Plus', modelYear: null,
    batteryCapacityKwh: 37.23, rangeKm: 326, rangeStandard: 'NEDC', dcMaxKw: 50,
    fastCharge: '10–70%, khoảng 33 phút', sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-dien-vf5', verifiedAt: '2026-11-14',
  },
  {
    key: 'vf6-eco-current', family: 'VF6', displayName: 'VinFast VF6 Eco', trim: 'Eco', modelYear: null,
    batteryCapacityKwh: 59.6, rangeKm: 485, rangeStandard: 'NEDC', dcMaxKw: 100,
    fastCharge: '10–70%, khoảng 25 phút', sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-dien-vf6', verifiedAt: '2026-11-14',
  },
  {
    key: 'vf6-plus-current', family: 'VF6', displayName: 'VinFast VF6 Plus', trim: 'Plus', modelYear: null,
    batteryCapacityKwh: 59.6, rangeKm: 460, rangeStandard: 'NEDC', dcMaxKw: 100,
    fastCharge: '10–70%, khoảng 25 phút', sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-dien-vf6', verifiedAt: '2026-11-14',
  },
  {
    key: 'vf7-eco-current', family: 'VF7', displayName: 'VinFast VF7 Eco', trim: 'Eco', modelYear: null,
    batteryCapacityKwh: 59.6, rangeKm: 440, rangeStandard: 'NEDC', dcMaxKw: 100,
    fastCharge: null, sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-dien-vf7', verifiedAt: '2026-11-14',
  },
  {
    key: 'vf7-plus-current', family: 'VF7', displayName: 'VinFast VF7 Plus', trim: 'Plus', modelYear: null,
    batteryCapacityKwh: 70, rangeKm: 500.5, rangeStandard: 'NEDC', dcMaxKw: 110,
    fastCharge: null, sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-dien-vf7', verifiedAt: '2026-11-14',
  },
  {
    key: 'limo-green-current', family: 'Limo Green', displayName: 'VinFast Limo Green', trim: 'Tiêu chuẩn', modelYear: null,
    batteryCapacityKwh: 60.13, rangeKm: 450, rangeStandard: 'NEDC', dcMaxKw: 80,
    fastCharge: '10–70%, khoảng 30 phút', sourceUrl: 'https://vinfastauto.com/vn_vi/vinfast-ban-giao-lo-xe-limo-green-dau-tien-cho-khach-hang', verifiedAt: '2026-11-14',
  },
  {
    key: 'vf8-unverified', family: 'VF8', displayName: 'VinFast VF8', trim: 'Cần đối chiếu đời xe', modelYear: null,
    batteryCapacityKwh: null, rangeKm: null, rangeStandard: null, dcMaxKw: null,
    fastCharge: null, sourceUrl: 'https://vinfastauto.com/vn_vi/dat-coc-xe-vf8', verifiedAt: '2026-11-14',
  },
];

export function evFamilyFromName(name: string): EvFamily | null {
  const normalized = name.toLocaleLowerCase('vi-VN').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
  if (/\bvf\s*3\b/.test(normalized)) return 'VF3';
  if (/\bvf\s*5\b/.test(normalized)) return 'VF5';
  if (/\bvf\s*6\b/.test(normalized)) return 'VF6';
  if (/\bvf\s*7s?\b/.test(normalized)) return 'VF7';
  if (/\bvf\s*8\b/.test(normalized)) return 'VF8';
  if (normalized.includes('limo green')) return 'Limo Green';
  return null;
}

export function evFamilyFromCar(car: Car): EvFamily | null {
  return evFamilyFromName(`${car.name} ${car.slug}`);
}

export function exactSpecForCar(car: Car): EvVehicleSpec | null {
  const family = evFamilyFromCar(car);
  if (!family) return null;
  const normalized = `${car.name} ${car.slug}`.toLocaleLowerCase('vi-VN');
  const candidates = EV_VEHICLE_SPECS.filter((spec) => spec.family === family);
  if (candidates.length === 1) return candidates[0];
  if (normalized.includes('plus')) return candidates.find((spec) => spec.trim === 'Plus') ?? null;
  if (normalized.includes('eco')) return candidates.find((spec) => spec.trim === 'Eco') ?? null;
  return null;
}

export function findExactVehicleForSpec(spec: EvVehicleSpec, cars: Car[]): Car | null {
  const familyCars = cars.filter((car) => evFamilyFromCar(car) === spec.family && car.available !== false);
  if (familyCars.length === 1 && !['VF6', 'VF7', 'VF8'].includes(spec.family)) return familyCars[0];
  const trim = spec.trim.toLocaleLowerCase('vi-VN');
  return familyCars.find((car) => `${car.name} ${car.slug}`.toLocaleLowerCase('vi-VN').includes(trim)) ?? null;
}
