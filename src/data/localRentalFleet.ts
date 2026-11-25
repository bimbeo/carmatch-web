const modelFamilies: [string, RegExp][] = [
  ['vinfast-vf3-2025', /\bvf\s*3\b/i],
  ['vinfast-fadil-2021', /\bfadil\b/i],
  ['vinfast-vf5-plus', /\bvf\s*5\b/i],
  ['mazda-3-2018', /\bmazda\s*3\b/i],
  ['toyota-raize-2022', /\braize\b/i],
  ['vinfast-vf6-plus', /\bvf\s*6\b/i],
  ['hyundai-creta-2025', /\bcreta\b/i],
  ['mitsubishi-xpander-2023', /\bxpander\b/i],
  ['vinfast-limo-green-2025', /\blimo\s*green\b/i],
  ['kia-carnival', /\bcarnival\b/i],
  ['vinfast-vf7', /\bvf\s*7\s*s?\b/i],
  ['vinfast-vf8-plus-2024', /\bvf\s*8\b/i],
];

interface RentalVehicle {
  name: string;
  slug: string;
  model?: string;
  price: number;
  available: boolean;
  seats: number;
}

export function localRentalModelKey(car: RentalVehicle) {
  const searchable = `${car.name} ${car.slug}`.replace(/[-_]+/g, ' ');
  return modelFamilies.find(([, matches]) => matches.test(searchable))?.[0]
    ?? (car.model || car.name).toLocaleLowerCase('vi-VN').replace(/\b(19|20)\d{2}\b/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}

export function groupLocalRentalCars<T extends RentalVehicle>(cars: T[], preferredModels: string[]) {
  const candidates = cars
    .filter((car) => car.available && car.price > 0 && car.seats >= 4 && car.seats <= 7)
    .sort((a, b) => a.price - b.price || a.slug.localeCompare(b.slug));
  const models = new Map<string, T[]>();
  for (const car of candidates) {
    const key = localRentalModelKey(car);
    const group = models.get(key);
    if (group) group.push(car);
    else models.set(key, [car]);
  }

  return [...new Set([...preferredModels, ...models.keys()])]
    .flatMap((key) => {
      const vehicles = models.get(key);
      return vehicles ? [{ key, vehicles }] : [];
    });
}

export function selectLocalRentalCars<T extends RentalVehicle>(cars: T[], preferredModels: string[]) {
  return groupLocalRentalCars(cars, preferredModels).map(({ vehicles }) => vehicles[0]);
}
