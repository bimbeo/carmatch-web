import { getAttributionSnapshot } from './attribution';
import { trackEvent } from './analytics';

export type ExperimentVariant = 'control' | 'price-trust';

export interface ExperimentAssignment {
  experiment_id: string;
  variant_id: ExperimentVariant;
}

export const BOOKING_CTA_EXPERIMENT = {
  id: 'vehicle-detail-cta-trust-v1',
  variants: ['control', 'price-trust'] as const,
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function assignExperimentVariant(
  visitorId: string,
  experiment = BOOKING_CTA_EXPERIMENT,
): ExperimentAssignment {
  const variantIndex = stableHash(`${experiment.id}:${visitorId}`) % experiment.variants.length;
  return {
    experiment_id: experiment.id,
    variant_id: experiment.variants[variantIndex],
  };
}

export function getBookingCtaExperiment(): ExperimentAssignment {
  const attribution = getAttributionSnapshot();
  return assignExperimentVariant(attribution?.visitor_id || 'anonymous');
}

export function experimentPayload(assignment: ExperimentAssignment) {
  return {
    experiment_id: assignment.experiment_id,
    variant_id: assignment.variant_id,
  };
}

export function trackExperimentExposure(
  assignment: ExperimentAssignment,
  payload: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined') return;
  const attribution = getAttributionSnapshot();
  if (!attribution) return;

  const exposureKey = `carmatch_exposure_v1:${attribution.session_id}:${assignment.experiment_id}`;
  if (sessionStorage.getItem(exposureKey)) return;
  sessionStorage.setItem(exposureKey, assignment.variant_id);
  trackEvent('cm_experiment_exposure', {
    ...payload,
    ...experimentPayload(assignment),
  });
}
