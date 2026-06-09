import { createClient } from '@supabase/supabase-js';
import { travelCollections as fallbackCollections, type TravelCollection } from '@/data/travelCollections';
import { tripDestinations as fallbackDestinations, type TripDestination } from '@/data/tripDestinations';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

type TravelDestinationRow = {
  slug: string;
  name: string;
  region: string | null;
  summary: string | null;
  image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  tags: string[] | null;
  distance_km: number | null;
  duration: string | null;
  ideal: string | null;
  route: string | null;
  stops: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  map_url?: string | null;
  checklist?: string[] | null;
  driving_note: string | null;
  parking_note: string | null;
  recommended_vehicle: string | null;
  nearby_places: Array<{
    name: string;
    type: string;
    note: string;
    price?: string;
    openingHours?: string;
    familyFit?: string;
    parkingNote?: string;
    imageUrl?: string;
    sourceUrl?: string;
    latitude?: number;
    longitude?: number;
  }> | null;
  schedule: Array<{ title: string; items: string[] }> | null;
  notes: string[] | null;
  faq: Array<{ question: string; answer: string }> | null;
  toll_estimate: number | null;
  fuel_cost_per_km: number | null;
  sort_order: number | null;
};

type TravelCollectionRow = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  cta_label: string | null;
  sort_order: number | null;
};

type TravelCollectionDestinationRow = {
  collection_id: string;
  travel_destinations: { slug: string } | null;
};

export type TravelContentState = {
  destinations: TripDestination[];
  collections: TravelCollection[];
  source: 'supabase' | 'fallback';
};

const fallbackTravelContent: TravelContentState = {
  destinations: fallbackDestinations,
  collections: fallbackCollections,
  source: 'fallback',
};

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function mapDestination(row: TravelDestinationRow): TripDestination {
  return {
    slug: row.slug,
    name: row.name,
    region: row.region || undefined,
    summary: row.summary || undefined,
    imageUrl: row.image_url || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    tags: asArray(row.tags),
    distanceKm: row.distance_km || 0,
    duration: row.duration || 'Theo lịch trình',
    ideal: row.ideal || 'Khách Car Match cần tư vấn xe phù hợp',
    route: row.route || 'Hà Nội → điểm đến',
    stops: asArray(row.stops),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    mapUrl: row.map_url || undefined,
    checklist: asArray(row.checklist),
    drivingNote: row.driving_note || undefined,
    parkingNote: row.parking_note || undefined,
    recommendedVehicle: row.recommended_vehicle || undefined,
    nearbyPlaces: asArray(row.nearby_places),
    schedule: asArray(row.schedule),
    notes: asArray(row.notes),
    faq: asArray(row.faq),
    tollEstimate: row.toll_estimate || 0,
    fuelCostPerKm: row.fuel_cost_per_km || undefined,
  };
}

function mapCollection(row: TravelCollectionRow, destinationSlugs: string[]): TravelCollection {
  return {
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow || 'Car Match Đi Đâu',
    description: row.description || 'Gợi ý điểm đến, lịch trình và xe phù hợp cho chuyến đi từ Hà Nội.',
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || row.description || 'Gợi ý điểm đến, lịch trình và xe phù hợp cho chuyến đi từ Hà Nội.',
    destinationSlugs,
    ctaLabel: row.cta_label || 'Tính chuyến đi',
  };
}

export async function fetchTravelContent(): Promise<TravelContentState> {
  if (!supabase) return fallbackTravelContent;

  try {
    const baseDestinationSelect = 'slug,name,region,summary,tags,distance_km,duration,ideal,route,stops,driving_note,parking_note,recommended_vehicle,nearby_places,schedule,notes,faq,toll_estimate,fuel_cost_per_km,sort_order';
    const extendedDestinationSelect = `image_url,seo_title,seo_description,latitude,longitude,map_url,checklist,${baseDestinationSelect}`;

    let destinationResult = await supabase
        .from('travel_destinations')
        .select(extendedDestinationSelect)
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }) as unknown as {
          data: TravelDestinationRow[] | null;
          error: { message: string } | null;
        };

    if (destinationResult.error && /image_url|seo_title|seo_description|latitude|longitude|map_url|checklist/i.test(destinationResult.error.message)) {
      destinationResult = await supabase
        .from('travel_destinations')
        .select(baseDestinationSelect)
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }) as unknown as {
          data: TravelDestinationRow[] | null;
          error: { message: string } | null;
        };
    }

    const [collectionResult, relationResult] = await Promise.all([
      supabase
        .from('travel_collections')
        .select('id,slug,title,eyebrow,description,seo_title,seo_description,cta_label,sort_order')
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true }),
      supabase
        .from('travel_collection_destinations')
        .select('collection_id, travel_destinations(slug)')
        .order('sort_order', { ascending: true }),
    ]);

    if (destinationResult.error || collectionResult.error || relationResult.error) {
      console.warn('[travelContent] Falling back to bundled data', destinationResult.error || collectionResult.error || relationResult.error);
      return fallbackTravelContent;
    }

    const destinationRows = (destinationResult.data || []) as TravelDestinationRow[];
    const collectionRows = (collectionResult.data || []) as TravelCollectionRow[];
    const relationRows = (relationResult.data || []) as unknown as TravelCollectionDestinationRow[];

    if (!destinationRows.length || !collectionRows.length) return fallbackTravelContent;

    const slugsByCollection = new Map<string, string[]>();
    for (const row of relationRows) {
      const destinationSlug = row.travel_destinations?.slug;
      if (!destinationSlug) continue;
      slugsByCollection.set(row.collection_id, [...(slugsByCollection.get(row.collection_id) || []), destinationSlug]);
    }

    return {
      destinations: destinationRows.map(mapDestination),
      collections: collectionRows.map((row) => mapCollection(row, slugsByCollection.get(row.id) || [])),
      source: 'supabase',
    };
  } catch (error) {
    console.warn('[travelContent] Falling back to bundled data', error);
    return fallbackTravelContent;
  }
}

export function getFallbackTravelContent(): TravelContentState {
  return fallbackTravelContent;
}
