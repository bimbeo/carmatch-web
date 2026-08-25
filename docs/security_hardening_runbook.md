# CarMatch Web Security Hardening Runbook

Last updated: 2026-07-02

This runbook keeps production hardening work explicit and repeatable. Do not
deploy or change production secrets without Bim's approval.

## Phase 1 - Code Hardening

Status: implemented locally.

- Public vehicle payloads must not expose operational fields:
  - `plate_number`
  - `current_km`
  - internal `status`
  - internal `published`
- Admin booking API must authenticate with `Authorization: Bearer <ADMIN_PIN>`.
- Admin booking API must not accept PIN in query strings.
- Admin booking API CORS must allow only CarMatch origins, localhost, and
  Vercel preview hosts for `carmatch-web`.
- Security headers must include:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `X-Permitted-Cross-Domain-Policies`
- `/.well-known/security.txt` must exist.

Required Vercel env vars before production deploy:

- `ADMIN_PIN` - rotate after deploying this hardening.
- `SUPABASE_SERVICE_ROLE_KEY` - required by admin endpoints. Keep server-side
  only.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Phase 2 - API Abuse Protection

Status: implemented locally with conservative in-function limits.

These limits are a local guardrail. They do not replace Vercel WAF because
serverless instances do not share in-memory counters globally.

Current code-level limits:

- `POST /api/bookings`: 8 requests / 10 minutes / IP.
- `GET /api/bookings`: 40 requests / 10 minutes / IP.
- `POST /api/bookings?action=upload-proof`: 10 requests / 15 minutes / IP.
- `POST /api/bookings?action=link-phone`: 12 requests / 10 minutes / IP.
- `POST /api/leads`: 8 requests / 10 minutes / IP.
- `POST /api/reviews`: 6 requests / 30 minutes / IP.
- `GET /api/reviews`: 120 requests / minute / IP.
- `GET /api/promos?action=validate`: 40 requests / minute / IP.
- `GET /api/promos?action=list`: 80 requests / minute / IP.
- `GET/POST /api/customer-discount`: guarded by IP limits.
- Availability endpoints: 120 requests / minute / IP.
- Admin invalid auth attempts: 20 requests / 10 minutes / IP.

If real customers hit 429, raise the code-level limit first, then move stronger
limits to Vercel WAF after reviewing traffic logs.

## Phase 3 - Vercel Firewall

Enable in log mode first, watch logs for at least one full business day, then
switch high-confidence rules to challenge/deny.

Recommended managed rules:

- OWASP Core Ruleset:
  - `sqli`: deny
  - `xss`: deny
  - `rce`: deny
  - `lfi`: deny
  - `rfi`: deny
  - `ma`: deny
  - `gen`: log first, then deny if no false positives
  - `sd`: log
- Bot Protection: log first, then challenge.
- AI Bots: keep aligned with SEO/GEO strategy. Do not deny all AI crawlers if
  CarMatch wants AI search visibility.

Recommended WAF rate limits:

```json
[
  {
    "name": "Rate limit booking submits",
    "conditionGroup": [{ "conditions": [
      { "type": "path", "op": "eq", "value": "/api/bookings" },
      { "type": "method", "op": "eq", "value": "POST" }
    ] }],
    "action": { "mitigate": { "action": "rate_limit", "rateLimit": {
      "algo": "fixed_window", "window": 600, "limit": 20, "keys": ["ip"], "action": "challenge"
    } } }
  },
  {
    "name": "Rate limit lead submits",
    "conditionGroup": [{ "conditions": [
      { "type": "path", "op": "eq", "value": "/api/leads" },
      { "type": "method", "op": "eq", "value": "POST" }
    ] }],
    "action": { "mitigate": { "action": "rate_limit", "rateLimit": {
      "algo": "fixed_window", "window": 600, "limit": 20, "keys": ["ip"], "action": "challenge"
    } } }
  },
  {
    "name": "Rate limit admin auth",
    "conditionGroup": [{ "conditions": [
      { "type": "path", "op": "eq", "value": "/api/admin-bookings" }
    ] }],
    "action": { "mitigate": { "action": "rate_limit", "rateLimit": {
      "algo": "fixed_window", "window": 600, "limit": 40, "keys": ["ip"], "action": "deny"
    } } }
  }
]
```

## Phase 4 - Supabase RLS and Storage

Audit these tables first because they may contain customer or operational data:

- `website_leads`
- `bookings`
- `customers`
- `vehicle_reviews`
- `promo_codes`
- `promo_code_uses`
- `referral_rewards`
- `customer_points_ledger`
- `vehicle_schedule_events`
- `vehicles`

Checklist:

- RLS enabled on all tables with customer data.
- Browser/anon role cannot select raw PII tables directly.
- Service role is used only in serverless functions.
- Public vehicle read policy, if needed, returns only published/available
  public fields through server endpoints.
- `payment-proofs` storage bucket is private.
- Payment proof reads use short-lived signed URLs only.
- No public storage policy exposes payment proof files.

Useful audit SQL:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'website_leads',
    'bookings',
    'customers',
    'vehicle_reviews',
    'promo_codes',
    'promo_code_uses',
    'referral_rewards',
    'customer_points_ledger',
    'vehicle_schedule_events',
    'vehicles'
  )
order by tablename;
```

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Phase 5 - Production Verification

Run after deploy:

```bash
curl -I https://www.carmatch.vn/
curl -s https://www.carmatch.vn/.well-known/security.txt
curl -s https://www.carmatch.vn/api/vehicles | rg "plate_number|current_km|published"
curl -i https://www.carmatch.vn/api/admin-bookings
curl -i -X OPTIONS https://www.carmatch.vn/api/admin-bookings \
  -H "Origin: https://evil.example" \
  -H "Access-Control-Request-Method: GET"
```

Expected:

- Homepage has all security headers.
- `security.txt` returns 200.
- Vehicle API grep returns no matches.
- Admin API returns 401 without token.
- Evil-origin preflight returns no usable CORS allow-origin.
