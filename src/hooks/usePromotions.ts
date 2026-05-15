import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
    supabase
      .from('promotions')
      .select('id,title,subtitle,image_url,link_url,badge_text,sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setPromotions(data as Promotion[]);
        setLoading(false);
      });
  }, []);

  return { promotions, loading };
}
