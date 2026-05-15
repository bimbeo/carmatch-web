import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Car } from '@/data/cars';

// Default conditions shown on every car (same as ops rental policy)
const DEFAULT_CONDITIONS = [
  'CCCD công dân (bản gốc)',
  'Giấy phép lái xe (GPLX) còn hạn',
  'Đặt cọc 30.000.000đ hoặc xe máy có giá trị tương đương',
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

function makeSlug(make: string, model: string, variant: string, id: string): string {
  const base = [make, model, variant]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || id;
}

interface SupabaseVehicle {
  id: string;
  display_name: string | null;
  plate_number: string | null;
  color: string | null;
  model_year: number | null;
  daily_base_price: number | null;
  current_km: number | null;
  status: string;
  published: boolean;
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

function mapToCar(v: SupabaseVehicle): Car {
  const vm = v.vehicle_models || {};
  const make = vm.make || '';
  const model = vm.model || '';
  const variant = vm.variant || '';
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

  const fuel = mapFuelType(vm.fuel_type || '');

  return {
    slug: makeSlug(make, model, variant, v.id),
    name: v.display_name || `${make} ${model}`.trim() || 'Xe',
    brand: make,
    price: v.daily_base_price || 0,
    seats: vm.seats || 5,
    fuel,
    transmission: mapTransmission(vm.transmission || ''),
    kmPerDay: DEFAULT_KM_PER_DAY,
    amenities: [],
    conditions: DEFAULT_CONDITIONS,
    available: v.status === 'available',
    images: galleryImages.length > 0 ? galleryImages : [PLACEHOLDER_IMAGE],
    category: mapCategory(fuel),
    description: variant ? `${make} ${model} ${variant} — ${v.color || ''}`.trim() : undefined,
    useCases: undefined,
  };
}

export interface UseVehiclesResult {
  cars: Car[];
  loading: boolean;
  error: string | null;
}

export function useVehicles(): UseVehiclesResult {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('vehicles')
      .select(
        'id,display_name,plate_number,color,model_year,daily_base_price,current_km,status,published,external_refs,vehicle_models(make,model,variant,seats,fuel_type,transmission)'
      )
      .eq('status', 'available')
      .eq('published', true)
      .order('daily_base_price', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) {
          console.error('[useVehicles]', err);
          setError('Không thể tải danh sách xe. Vui lòng thử lại sau.');
        } else {
          setCars((data as SupabaseVehicle[]).map(mapToCar));
        }
        setLoading(false);
      });
  }, []);

  return { cars, loading, error };
}

// Hook for a single vehicle by slug
export function useVehicle(slug: string | undefined): {
  car: Car | null;
  loading: boolean;
} {
  const { cars, loading } = useVehicles();
  const car = slug ? cars.find((c) => c.slug === slug) ?? null : null;
  return { car, loading };
}
