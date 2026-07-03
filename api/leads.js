import { createClient } from '@supabase/supabase-js';
import { rateLimit } from './_security.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const COMPANY_CODE = 'carmatch';

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

  try {
    const payload = req.body;
    if (!payload || !payload.phone || !payload.name) {
      return res.status(400).json({ error: 'Missing required fields: name, phone' });
    }

    const { error } = await supabase.from('website_leads').insert([payload]);
    if (error) throw error;

    res.status(200).json({ ok: true });

    // Fire-and-forget push cho team — không chặn response cho khách
    const carInfo = payload.car_model ? ` · ${payload.car_model}` : '';
    sendPushToCompany({
      title: '🔔 Lead website mới',
      body: `${payload.name}${carInfo}`,
      url: '/web-leads',
    }).catch(() => {});
  } catch (err) {
    console.error('[api/leads]', err);
    res.status(500).json({ ok: false, error: 'Failed to submit lead' });
  }
}
