import { useEffect, useState } from 'react';
import { fetchTravelContent, getFallbackTravelContent, type TravelContentState } from '@/lib/travelContent';

declare global {
  interface Window {
    __CM_INITIAL_TRAVEL_CONTENT__?: TravelContentState;
  }

  var __CM_INITIAL_TRAVEL_CONTENT__: TravelContentState | undefined;
}

function getInitialTravelContent() {
  return typeof window !== 'undefined'
    ? window.__CM_INITIAL_TRAVEL_CONTENT__
    : globalThis.__CM_INITIAL_TRAVEL_CONTENT__;
}

export function useTravelContent() {
  const initialContent = getInitialTravelContent();
  const [content, setContent] = useState<TravelContentState>(() => initialContent || getFallbackTravelContent());
  const [loading, setLoading] = useState(() => !initialContent);

  useEffect(() => {
    const hydratedContent = getInitialTravelContent();
    if (hydratedContent) {
      setContent(hydratedContent);
      setLoading(false);
      return;
    }

    let mounted = true;

    fetchTravelContent()
      .then((data) => {
        if (mounted) setContent(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { ...content, loading };
}
