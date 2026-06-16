import { useState, useEffect } from 'react';
import type { Car } from '@/data/cars';

// Default conditions shown on every car (same as ops rental policy)
const DEFAULT_CONDITIONS = [
  'CCCD công dân (bản gốc)',
  'Giấy phép lái xe hạng B còn hạn',
  'Khoản đặt cọc theo mẫu xe, xác nhận trước khi giao',
];

// Default km/day allowance if not set
const DEFAULT_KM_PER_DAY = 300;

// Default placeholder image
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1493238792000-8113da705763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

function mapFuelType(raw: string): Car['fuel'] {
  const f = (raw || '').toLowerCase();
  if (f === 'electric' || f === 'điện' || f === 'dien') return 'Điện';
  if (f === 'diesel' || f === 'dầu' || f === 'dau') return 'Dầu';
  return 'Xăng';
}

function mapCategory(fuel: Car['fuel']): Car['category'] {
  if (fuel === 'Điện') return 'electric';
  if (fuel === 'Dầu') return 'diesel';
  return 'gasoline';
}

function mapTransmission(raw: string): string {
  const t = (raw || '').toLowerCase();
  if (t === 'manual' || t === 'số sàn' || t === 'so san') return 'Số sàn';
  return 'Tự động';
}

function slugify(text: string, fallback = ''): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

function makeModelSlug(make: string, model: string, variant: string, id: string): string {
  return slugify([make, model, variant].filter(Boolean).join(' '), id);
}

function makeDisplaySlug(v: SupabaseVehicle, make: string, model: string, variant: string): string {
  const modelYear = v.model_year ? String(v.model_year) : '';
  return slugify(v.display_name || [make, model, variant, modelYear].filter(Boolean).join(' '), v.id);
}

function makeDuplicateSlug(car: Car): string {
  const colorPart = slugify(car.description?.split('—').pop()?.trim() || '');
  const platePart = slugify(car.plateNumber || '');
  const suffix = colorPart || platePart || car.id.slice(0, 8).toLowerCase();
  return `${car.slug}-${suffix}`;
}

interface SupabaseVehicle {
  id: string;
  slug?: string | null;
  slugAliases?: string[] | null;
  display_name: string | null;
  plate_number: string | null;
  color: string | null;
  model_year: number | null;
  daily_base_price: number | null;
  current_km: number | null;
  status: string;
  published: boolean;
  website_description?: string | null;
  external_refs: Record<string, unknown> | null;
  vehicle_models: {
    make: string | null;
    model: string | null;
    variant: string | null;
    seats: number | null;
    fuel_type: string | null;
    transmission: string | null;
  } | null;
}

declare global {
  interface Window {
    __CM_INITIAL_VEHICLES__?: SupabaseVehicle[];
    __CM_TOTAL_VEHICLES__?: number;
  }

  // Used by the build-time React prerenderer.
  // eslint-disable-next-line no-var
  var __CM_INITIAL_VEHICLES__: SupabaseVehicle[] | undefined;
  var __CM_TOTAL_VEHICLES__: number | undefined;
}

interface VehicleMediaFile {
  category?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
}

function isVehicleImageMedia(file: unknown): file is VehicleMediaFile {
  if (!file || typeof file !== 'object') return false;
  const media = file as VehicleMediaFile;
  return Boolean(
    media.fileUrl &&
      media.category === 'vehicle_photos' &&
      (!media.mimeType || media.mimeType.startsWith('image/'))
  );
}

function uniqueImages(urls: string[]): string[] {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
}

function uniquifyCarSlugs(cars: Car[]): Car[] {
  const counts = new Map<string, number>();
  cars.forEach((car) => counts.set(car.slug, (counts.get(car.slug) || 0) + 1));

  const used = new Set<string>();
  return cars.map((car) => {
    const baseSlug = car.slug;
    let nextSlug = baseSlug;

    if ((counts.get(baseSlug) || 0) > 1) {
      nextSlug = makeDuplicateSlug(car);
      let index = 2;
      while (used.has(nextSlug)) {
        nextSlug = `${makeDuplicateSlug(car)}-${index}`;
        index += 1;
      }
    }

    used.add(nextSlug);
    if (nextSlug === baseSlug) return car;

    return {
      ...car,
      slug: nextSlug,
      slugAliases: Array.from(new Set([...(car.slugAliases || []), baseSlug])),
    };
  });
}

function hasRealVehicleImage(car: Car): boolean {
  return car.images.some((image) => image !== PLACEHOLDER_IMAGE);
}

export function findVehicleBySlug(cars: Car[], slug: string | undefined): Car | null {
  if (!slug) return null;

  const exact = cars.find((car) => car.slug === slug);
  if (exact) return exact;

  const aliasMatches = cars.filter((car) => car.slugAliases?.includes(slug));
  if (aliasMatches.length === 0) return null;
  if (aliasMatches.length === 1) return aliasMatches[0];

  return (
    aliasMatches.find((car) => car.slug.startsWith(`${slug}-`) && hasRealVehicleImage(car)) ||
    aliasMatches.find((car) => car.slug.startsWith(`${slug}-`)) ||
    aliasMatches.find(hasRealVehicleImage) ||
    aliasMatches[0]
  );
}

function mapToCar(v: SupabaseVehicle): Car {
  const vm = v.vehicle_models;
  const make = vm?.make || '';
  const model = vm?.model || '';
  const variant = vm?.variant || '';
  const externalRefs =
    v.external_refs && typeof v.external_refs === 'object' ? v.external_refs : {};
  const coverImage =
    (externalRefs.coverImageUrl as string) ||
    (externalRefs.vehiclePhotoUrl as string) ||
    (externalRefs.imageUrl as string) ||
    '';
  const mediaFiles = Array.isArray(externalRefs.mediaFiles) ? externalRefs.mediaFiles : [];
  const galleryImages = uniqueImages([
    coverImage,
    ...mediaFiles.filter(isVehicleImageMedia).map((file) => file.fileUrl || ''),
  ]);

  const fuel = mapFuelType(vm?.fuel_type || '');
  const modelSlug = makeModelSlug(make, model, variant, v.id);
  const displaySlug = makeDisplaySlug(v, make, model, variant);
  const serverSlug = typeof v.slug === 'string' && v.slug.trim() ? v.slug : '';
  const primarySlug = serverSlug || displaySlug;
  const slugAliases = Array.from(
    new Set([
      ...(Array.isArray(v.slugAliases) ? v.slugAliases : []),
      modelSlug,
      displaySlug,
    ].filter((slug) => slug && slug !== primarySlug)),
  );

  return {
    id: v.id,
    slug: primarySlug,
    slugAliases,
    plateNumber: v.plate_number || undefined,
    name: v.display_name || `${make} ${model}`.trim() || 'Xe',
    brand: make,
    price: v.daily_base_price || 0,
    seats: vm?.seats || 5,
    fuel,
    transmission: mapTransmission(vm?.transmission || ''),
    kmPerDay: DEFAULT_KM_PER_DAY,
    model_year: v.model_year ?? undefined,
    amenities: [],
    conditions: DEFAULT_CONDITIONS,
    available: v.status === 'available',
    images: galleryImages.length > 0 ? galleryImages : [PLACEHOLDER_IMAGE],
    category: mapCategory(fuel),
    description: v.website_description?.trim() || undefined,
    useCases: undefined,
  };
}

export interface UseVehiclesResult {
  cars: Car[];
  loading: boolean;
  error: string | null;
}

async function fetchVehicleJson(path: string): Promise<SupabaseVehicle[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${path}`);

  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();
  if (!contentType.includes('json') && body.trimStart().startsWith('<')) {
    throw new Error(`Expected JSON from ${path}, received HTML`);
  }

  const data = JSON.parse(body) as unknown;
  if (!Array.isArray(data)) throw new Error(`Expected vehicle array from ${path}`);

  return data as SupabaseVehicle[];
}

export function useVehicles(): UseVehiclesResult {
  const initialVehiclePayload =
    typeof window !== 'undefined'
      ? window.__CM_INITIAL_VEHICLES__
      : globalThis.__CM_INITIAL_VEHICLES__;
  const initialVehicles =
    Array.isArray(initialVehiclePayload)
      ? uniquifyCarSlugs(initialVehiclePayload.map(mapToCar))
      : [];
  const [cars, setCars] = useState<Car[]>(initialVehicles);
  const [loading, setLoading] = useState(initialVehicles.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVehicles() {
      try {
        const data = await fetchVehicleJson('/api/vehicles');
        if (cancelled) return;
        setCars(uniquifyCarSlugs(data.map(mapToCar)));
        setLoading(false);
        return;
      } catch (apiError) {
        try {
          const data = await fetchVehicleJson('/data/vehicles.json');
          if (cancelled) return;
          setCars(uniquifyCarSlugs(data.map(mapToCar)));
          setLoading(false);
          return;
        } catch (staticError) {
          if (cancelled) return;
          console.error('[useVehicles]', apiError, staticError);
        }
      }

      if (!cancelled) {
        setError('Không thể tải danh sách xe. Vui lòng thử lại sau.');
        setLoading(false);
      }
    }

    void loadVehicles();

    return () => {
      cancelled = true;
    };
  }, []);

  return { cars, loading, error };
}

// Hook for a single vehicle by slug
export function useVehicle(slug: string | undefined): {
  car: Car | null;
  loading: boolean;
} {
  const { cars, loading } = useVehicles();
  const car = findVehicleBySlug(cars, slug);
  return { car, loading };
}
