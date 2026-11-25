import { Suspense, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import TetOwnerPartnership from './app/pages/TetOwnerPartnership';
import { trackPageView } from './lib/analytics';
import { scheduleWebVitalsTracking } from './lib/webVitals';

function TetOwnerEntry() {
  useEffect(() => {
    trackPageView({ page_title: document.title });
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return <Suspense fallback={null}><TetOwnerPartnership /></Suspense>;
}

const root = document.getElementById('root');
if (root?.dataset.prerendered === 'tet-owner') {
  hydrateRoot(root, <TetOwnerEntry />);
  scheduleWebVitalsTracking();
}
