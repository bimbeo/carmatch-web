export const tetOwnerWindow = {
  start: '2027-01-27',
  end: '2027-02-15',
  newYear: '2027-02-06',
  peak: ['2027-02-04', '2027-02-10'],
};

const minute = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
const startOfDay = (date) => date + 'T00:00';
const endOfDay = (date) => date + 'T23:59';

export function validateHandoverTimes(free, earliest, latest) {
  if (!earliest && !latest) return null;
  if (!free.length) return 'no_dates';
  if (earliest && (!minute.test(earliest) || earliest.slice(0, 10) !== free[0].start)) return 'earliest';
  if (latest && (!minute.test(latest) || latest.slice(0, 10) !== free[free.length - 1].end)) return 'latest';
  const first = free[0];
  const last = free[free.length - 1];
  const startsTooLate = earliest && earliest >= (free.length === 1 && latest ? latest : endOfDay(first.end));
  const endsTooEarly = latest && latest <= (free.length === 1 && earliest ? earliest : startOfDay(last.start));
  if (startsTooLate || endsTooEarly) return 'order';
  return null;
}

export function classifyAvailability(free, earliest = '', latest = '') {
  if (!free.length) return 'consult';
  const { newYear, peak } = tetOwnerWindow;
  const midnight = startOfDay(newYear);
  const windows = free.map(({ start, end }, index) => [
    index === 0 && earliest ? earliest : startOfDay(start),
    index === free.length - 1 && latest ? latest : endOfDay(end),
  ]);
  if (windows.some(([start, end]) => start <= startOfDay(peak[0]) && end >= endOfDay(peak[1]))) return 'full';
  if (windows.some(([start, end]) => start < midnight && end > midnight)) return 'across_new_year';
  if (free.every(({ end }) => end < newYear)) return 'before';
  if (free.every(({ start }) => start >= newYear)) return 'after';
  return 'flexible';
}
