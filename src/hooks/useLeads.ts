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
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    console.error('[submitLead]', err);
    return { ok: false, error: 'Network error' };
  }
}
