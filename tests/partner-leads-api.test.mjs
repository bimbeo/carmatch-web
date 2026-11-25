import assert from 'node:assert/strict';
import test from 'node:test';

test('existing partner lead route retries failed writes and replays a saved request without reinserting', async (t) => {
  const previousEnv = Object.fromEntries(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    .map((key) => [key, process.env[key]]));
  process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:1';
  process.env.VITE_SUPABASE_ANON_KEY = 'local-route-test';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;
  t.after(() => {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const inserts = [];
  let failNext = true;
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(input);
    assert.equal(url.origin, 'http://127.0.0.1:1');
    if (url.pathname.endsWith('/website_leads')) {
      assert.equal(options.method, 'POST');
      if (failNext) {
        failNext = false;
        return Response.json({ error: 'Test storage failure' }, { status: 500 });
      }
      inserts.push(...JSON.parse(options.body));
      return Response.json({ id: '0a362f95-94d2-40b8-825f-98fa1da34abc' });
    }
    assert.ok(url.pathname.endsWith('/companies'));
    return Response.json(null);
  });

  const { default: handleLead } = await import('../api/leads.js');
  const payload = {
    source: 'partner', form_type: 'daily', name: 'Chủ xe kiểm thử', phone: '0900000000',
    car_model: 'VF6 2025', quantity: '2', building: 'Hà Nội',
    note: 'lead_source=partner_tet_2027\nsource_page=https://www.carmatch.vn/hop-tac-chu-xe-cho-thue-tet\n[TET_OWNER_V1]',
  };
  const key = 'tet-owner-local-test-key';
  const send = async (body = payload) => {
    const response = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(json) { this.body = json; return this; },
      setHeader() {},
    };
    await handleLead({ method: 'POST', body, headers: { 'idempotency-key': key }, socket: { remoteAddress: '127.0.0.1' } }, response);
    return [response.statusCode, response.body];
  };
  const [failedStatus, failedBody] = await send();
  assert.equal(failedStatus, 500);
  assert.equal(failedBody.ok, false);
  assert.deepEqual(await send(), [200, { ok: true }]);
  assert.deepEqual(await send(), [200, { ok: true, duplicate: true }]);
  assert.equal((await send({ ...payload, quantity: '3' }))[0], 409);
  assert.deepEqual(inserts, [payload]);
});
