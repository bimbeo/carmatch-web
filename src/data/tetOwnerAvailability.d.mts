export const tetOwnerWindow: {
  readonly start: string;
  readonly end: string;
  readonly newYear: string;
  readonly peak: readonly [string, string];
};

type Segment = { start: string; end: string };

export function validateHandoverTimes(
  free: readonly Segment[], earliest: string | null, latest: string | null,
): 'no_dates' | 'earliest' | 'latest' | 'order' | null;

export function classifyAvailability(
  free: readonly Segment[], earliest?: string | null, latest?: string | null,
): 'consult' | 'full' | 'across_new_year' | 'before' | 'after' | 'flexible';
