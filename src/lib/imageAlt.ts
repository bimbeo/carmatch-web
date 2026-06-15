import type { Car } from '@/data/cars';

export function vehicleImageAlt(car: Pick<Car, 'name' | 'description' | 'seats' | 'fuel' | 'plateNumber'>, context = 'cho thuê tự lái tại Hà Nội') {
  const details = [
    car.description?.replace(/\s+—\s+/g, ', '),
    `${car.seats} chỗ`,
    car.fuel,
    car.plateNumber ? `biển ${car.plateNumber}` : '',
  ].filter(Boolean);

  return `${car.name}${details.length ? ` (${details.join(', ')})` : ''} ${context}`;
}
