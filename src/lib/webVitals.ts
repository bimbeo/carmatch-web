import type { Metric } from 'web-vitals';

let scheduled = false;

function roundedMetricValue(metric: Metric) {
  return metric.name === 'CLS'
    ? Math.round(metric.value * 10_000) / 10_000
    : Math.round(metric.value);
}

export function scheduleWebVitalsTracking() {
  if (scheduled || typeof window === 'undefined') return;
  scheduled = true;

  const start = async () => {
    const [{ onCLS, onINP, onLCP, onTTFB }, { trackEvent }] = await Promise.all([
      import('web-vitals'),
      import('./analytics'),
    ]);
    const report = (metric: Metric) => {
      trackEvent('cm_web_vital', {
        metric_name: metric.name,
        metric_value: roundedMetricValue(metric),
        metric_rating: metric.rating,
        metric_id: metric.id,
        navigation_type: metric.navigationType,
      });
    };

    onCLS(report);
    onINP(report);
    onLCP(report);
    onTTFB(report);
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void start(), { timeout: 3_000 });
  } else {
    globalThis.setTimeout(() => void start(), 1_000);
  }
}
