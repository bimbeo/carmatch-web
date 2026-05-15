import { supabase } from '@/lib/supabaseClient';

export interface LeadPayload {
  source: 'b2b' | 'partner';
  name: string;
  phone: string;
  customer_type?: string;
  form_type?: string;
  quantity?: string;
  duration?: string;
  car_model?: string;
  building?: string;
  note?: string;
}

export async function submitLead(payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('website_leads').insert([payload]);
  if (error) {
    console.error('[submitLead]', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
