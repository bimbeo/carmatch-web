import { useState, useEffect } from 'react';

export interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  badge_text: string | null;
  sort_order: number;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Promotion[]) => {
        setPromotions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { promotions, loading };
}
