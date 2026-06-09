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

function buildLeadContext() {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .map((key) => {
      const value = url.searchParams.get(key);
      return value ? `${key}=${value}` : '';
    })
    .filter(Boolean)
    .join('&');

  return [
    '[LEAD CONTEXT]',
    `Page: ${window.location.pathname}${window.location.search}`,
    `Full URL: ${window.location.href}`,
    `Referrer: ${document.referrer || 'Không có'}`,
    `UTM: ${utm || 'Không có'}`,
  ].join('\n');
}

export async function submitLead(payload: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const note = [payload.note, buildLeadContext()].filter(Boolean).join('\n\n');
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, note }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    console.error('[submitLead]', err);
    return { ok: false, error: 'Network error' };
  }
}
