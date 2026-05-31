import { useEffect, useState } from 'react';
import { fetchTravelContent, getFallbackTravelContent, type TravelContentState } from '@/lib/travelContent';

export function useTravelContent() {
  const [content, setContent] = useState<TravelContentState>(() => getFallbackTravelContent());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
