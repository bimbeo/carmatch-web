import type { TripDestination } from '@/data/tripDestinations';

const destinationImageFallbacks: Record<string, string> = {
  'ha-long': 'from-cyan-500 via-blue-500 to-slate-900',
  'ninh-binh': 'from-lime-500 via-emerald-500 to-slate-900',
  'tam-dao': 'from-sky-500 via-indigo-500 to-slate-900',
  'moc-chau': 'from-green-500 via-teal-500 to-slate-900',
  'noi-bai': 'from-slate-500 via-blue-500 to-slate-900',
  'ba-vi': 'from-emerald-500 via-lime-500 to-slate-900',
  'soc-son': 'from-green-600 via-cyan-600 to-slate-900',
  ecopark: 'from-teal-400 via-emerald-500 to-slate-900',
  'dai-lai': 'from-cyan-400 via-emerald-500 to-slate-900',
  'hai-phong': 'from-orange-400 via-rose-500 to-slate-900',
  'cat-ba': 'from-blue-500 via-cyan-500 to-slate-900',
  'mai-chau': 'from-lime-600 via-green-600 to-slate-900',
  'pu-luong': 'from-emerald-600 via-lime-500 to-slate-900',
  sapa: 'from-indigo-500 via-violet-600 to-slate-900',
  'ho-nui-coc': 'from-cyan-600 via-teal-500 to-slate-900',
};

export function destinationHeroClass(destination: Pick<TripDestination, 'slug'>) {
  return destinationImageFallbacks[destination.slug] || 'from-brand-600 via-blue-600 to-slate-950';
}

export function destinationImageStyle(destination: Pick<TripDestination, 'imageUrl'>) {
  return destination.imageUrl
    ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.76)), url("${destination.imageUrl}")` }
    : undefined;
}
