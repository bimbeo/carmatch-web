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
  email?: string;
  company_name?: string;
  tax_code?: string;
  scenario?: string;
  vehicle_group?: string;
  vehicle_id?: string;
  expected_km_per_vehicle_month?: number;
  days_plan?: '30';
  operation_mode?: 'self';
  invoice_required?: boolean;
  formal_quote_required?: boolean;
  preferred_contact_channel?: 'zalo' | 'email' | 'both';
  contract_sample_requested?: boolean;
  source_page?: string;
  idempotency_key?: string;
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

export interface LeadSubmitResult {
  ok: boolean;
  error?: string;
  errorCode?: string;
  requestId?: string;
  duplicate?: boolean;
}

export async function submitLead(payload: LeadPayload): Promise<LeadSubmitResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const note = [payload.note, buildLeadContext()].filter(Boolean).join('\n\n');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (payload.idempotency_key) headers['Idempotency-Key'] = payload.idempotency_key;
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, note }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}`, errorCode: data.error || `http_${res.status}` };
    if (data?.ok !== true) return { ok: false, error: 'Máy chủ chưa xác nhận đã lưu yêu cầu. Vui lòng thử lại.', errorCode: 'unconfirmed' };
    return { ok: true, requestId: data.request_id, duplicate: Boolean(data.duplicate) };
  } catch (err) {
    console.error('[submitLead]', err);
    const timedOut = err instanceof DOMException && err.name === 'AbortError';
    return {
      ok: false,
      error: timedOut ? 'Máy chủ phản hồi quá chậm. Vui lòng thử lại.' : 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.',
      errorCode: timedOut ? 'timeout' : 'network_error',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
