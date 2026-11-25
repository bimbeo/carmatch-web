import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { rateLimit } from './_security.js';
import {
  buildMonthlyLeadInsert,
  isMonthlyLead,
  monthlyRequestRef,
  validateMonthlyLead,
} from './_monthly-lead.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const HAS_SERVICE_ROLE = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COMPANY_CODE = 'carmatch';
const localIdempotency = globalThis.__carmatchLeadIdempotency || (globalThis.__carmatchLeadIdempotency = new Map());

function requestDigest(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9+]/g, '').replace(/^\+84/, '0');
}

async function acquireIdempotency(phone, key, hash) {
  if (!key) return { idempotencyEnabled: false };
  if (!HAS_SERVICE_ROLE) {
    const localKey = `${normalizePhone(phone)}:${key}`;
    const existing = localIdempotency.get(localKey);
    if (existing) {
      if (existing.requestHash !== hash) return { conflict: true };
      if (existing.responseBody) return { replay: existing.responseBody };
      return { pending: true };
    }
    localIdempotency.set(localKey, { requestHash: hash, createdAt: Date.now() });
    return { localKey };
  }
  const { data: company, error: companyError } = await supabase
    .from('companies').select('id').eq('code', COMPANY_CODE).maybeSingle();
  if (companyError || !company?.id) throw companyError || new Error('Company not found');
  const actorKey = `website:${normalizePhone(phone)}`;
  const route = 'POST /api/leads';
  const lookup = () => supabase.from('api_idempotency_keys')
    .select('id,request_hash,response_status,response_body,completed_at')
    .eq('company_id', company.id).eq('actor_key', actorKey).eq('route', route).eq('idempotency_key', key).maybeSingle();
  const { data: existing, error: lookupError } = await lookup();
  if (lookupError) throw lookupError;
  if (existing) {
    if (existing.request_hash !== hash) return { conflict: true };
    if (existing.completed_at && existing.response_body) return { replay: existing.response_body };
    return { pending: true };
  }
  const { data, error } = await supabase.from('api_idempotency_keys').insert({
    company_id: company.id, actor_key: actorKey, route, idempotency_key: key, request_hash: hash,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }).select('id').single();
  if (error?.code === '23505') {
    const { data: raced } = await lookup();
    if (raced?.request_hash !== hash) return { conflict: true };
    if (raced?.completed_at && raced.response_body) return { replay: raced.response_body };
    return { pending: true };
  }
  if (error) throw error;
  return { id: data.id };
}

async function completeIdempotency(id, responseStatus, responseBody, resourceId = null) {
  if (!id) return;
  await supabase.from('api_idempotency_keys').update({
    response_status: responseStatus,
    response_body: responseBody,
    resource_type: 'website_lead',
    resource_id: resourceId,
    completed_at: new Date().toISOString(),
  }).eq('id', id);
}

function completeLocalIdempotency(key, responseBody) {
  if (!key) return;
  const entry = localIdempotency.get(key);
  if (entry) localIdempotency.set(key, { ...entry, responseBody, completedAt: Date.now() });
}

async function sendPushToCompany(payload) {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('code', COMPANY_CODE)
      .single();
    if (!company) return;

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('company_id', company.id);
    if (!subs || subs.length === 0) return;

    const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return;

    const webpush = (await import('web-push')).default;
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@carmatch.vn',
      publicKey,
      privateKey
    );

    const message = JSON.stringify(payload);
    const staleEndpoints = [];
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            message
          );
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleEndpoints.push(sub.endpoint);
          }
        }
      })
    );
    if (staleEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    }
  } catch (err) {
    console.error('[api/leads] push error', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!rateLimit(req, res, { id: 'leads:post', windowMs: 10 * 60_000, max: 8 })) return;

  let idempotencyId = null;
  let localIdempotencyKey = null;
  try {
    const payload = req.body;
    if (!payload || !payload.phone || !payload.name) {
      return res.status(400).json({ error: 'Missing required fields: name, phone' });
    }

    const monthly = isMonthlyLead(payload);
    const idempotencyKey = String(req.headers['idempotency-key'] || payload?.idempotency_key || '').trim();
    if (idempotencyKey && !/^[a-zA-Z0-9:_-]{16,200}$/.test(idempotencyKey)) {
      return res.status(400).json({ ok: false, error: 'Mã gửi đơn không hợp lệ' });
    }
    const validationError = monthly ? validateMonthlyLead(payload, idempotencyKey) : null;
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    const requestRef = monthly ? monthlyRequestRef(idempotencyKey) : null;
    const { idempotency_key: _ignoredIdempotencyKey, ...requestPayload } = payload;
    const insertPayload = monthly ? buildMonthlyLeadInsert(requestPayload, requestRef) : requestPayload;
    const idempotency = await acquireIdempotency(payload.phone, idempotencyKey, requestDigest(insertPayload));
    idempotencyId = idempotency.id || null;
    localIdempotencyKey = idempotency.localKey || null;
    if (idempotency.conflict) return res.status(409).json({ error: 'Mã gửi đơn đã được dùng cho nội dung khác' });
    if (idempotency.pending) return res.status(409).json({ error: 'Yêu cầu đang được xử lý, vui lòng thử lại sau vài giây' });
    if (idempotency.replay) return res.status(idempotency.replay.status || 200).json({ ...idempotency.replay, duplicate: true });

    const { data: lead, error } = await supabase.from('website_leads').insert([insertPayload]).select('id').single();
    if (error?.code === '23505' && monthly) {
      const responseBody = { ok: true, request_id: requestRef, duplicate: true };
      completeLocalIdempotency(localIdempotencyKey, responseBody);
      return res.status(200).json(responseBody);
    }
    if (error) throw error;

    // Await trước khi trả response — Vercel đóng băng Lambda ngay sau
    // res.json(), fire-and-forget phía sau đó sẽ bị cắt ngang giữa chừng.
    const carInfo = insertPayload.car_model ? ` · ${insertPayload.car_model}` : '';
    await sendPushToCompany({
      title: monthly
        ? `🔔 ${payload.customer_type === 'business' ? 'Lead tháng doanh nghiệp' : 'Lead tháng cá nhân'}`
        : '🔔 Lead website mới',
      body: `${insertPayload.name}${carInfo}`,
      url: '/web-leads',
    }).catch(() => {});

    const responseBody = { ok: true, ...(requestRef ? { request_id: requestRef } : {}) };
    await completeIdempotency(idempotency.id, 200, responseBody, lead?.id);
    completeLocalIdempotency(localIdempotencyKey, responseBody);
    res.status(200).json(responseBody);
  } catch (err) {
    console.error('[api/leads]', err);
    // A failed insert must remain retryable. Remove the in-flight key so a
    // client retry with the same key can acquire it again instead of getting
    // stuck behind a permanently pending request.
    if (localIdempotencyKey) localIdempotency.delete(localIdempotencyKey);
    if (idempotencyId && HAS_SERVICE_ROLE) {
      await supabase.from('api_idempotency_keys').delete().eq('id', idempotencyId).catch((cleanupError) => {
        console.error('[api/leads] idempotency cleanup error', cleanupError);
      });
    }
    res.status(500).json({ ok: false, error: 'Chưa lưu được yêu cầu. Vui lòng thử lại.' });
  }
}
