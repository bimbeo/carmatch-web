-- Car Match website CRO analytics, attribution and lead-response SLA.
-- Applied to Supabase project carmatch-os-dev.

alter table public.website_leads
  add column if not exists attribution jsonb not null default '{}'::jsonb,
  add column if not exists first_response_at timestamptz,
  add column if not exists last_status_at timestamptz,
  add column if not exists outcome_reason text;

alter table public.website_leads
  drop constraint if exists website_leads_attribution_object_check,
  add constraint website_leads_attribution_object_check
    check (jsonb_typeof(attribution) = 'object'),
  drop constraint if exists website_leads_outcome_reason_length_check,
  add constraint website_leads_outcome_reason_length_check
    check (outcome_reason is null or char_length(outcome_reason) <= 200);

create index if not exists website_leads_response_sla_idx
  on public.website_leads (created_at, first_response_at, status)
  where form_type = 'booking';

create table if not exists public.website_conversion_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_id text not null unique,
  session_id text not null,
  event_name text not null check (event_name in (
    'view_item',
    'begin_checkout',
    'cm_booking_validation_error',
    'cm_booking_submit_attempt',
    'cm_booking_submit_success',
    'cm_booking_submit_error',
    'generate_lead',
    'cm_phone_click',
    'cm_zalo_click',
    'cm_cta_click'
  )),
  event_at timestamptz not null default now(),
  page_path text,
  landing_page text,
  traffic_source text not null default 'direct',
  traffic_medium text not null default '(none)',
  traffic_campaign text,
  traffic_term text,
  traffic_content text,
  referrer_host text,
  car_slug text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  booking_ref text,
  device_type text not null default 'unknown'
    check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint website_conversion_event_id_length_check
    check (char_length(event_id) between 12 and 100),
  constraint website_conversion_session_id_length_check
    check (char_length(session_id) between 12 and 100),
  constraint website_conversion_page_path_length_check
    check (page_path is null or char_length(page_path) <= 500),
  constraint website_conversion_landing_page_length_check
    check (landing_page is null or char_length(landing_page) <= 500)
);

comment on table public.website_conversion_events is
  'Privacy-limited first-party website funnel events. Contains anonymous session and campaign attribution, never customer PII.';

create index if not exists website_conversion_events_name_time_idx
  on public.website_conversion_events (event_name, event_at desc);

create index if not exists website_conversion_events_company_time_idx
  on public.website_conversion_events (company_id, event_at desc);

create index if not exists website_conversion_events_vehicle_time_idx
  on public.website_conversion_events (vehicle_id, event_at desc)
  where vehicle_id is not null;

create index if not exists website_conversion_events_session_time_idx
  on public.website_conversion_events (session_id, event_at desc);

create index if not exists website_conversion_events_booking_ref_idx
  on public.website_conversion_events (booking_ref)
  where booking_ref is not null;

alter table public.website_conversion_events enable row level security;

-- Events are only written and read by server-side service-role APIs.
revoke all on table public.website_conversion_events from anon, authenticated;

drop policy if exists website_conversion_events_deny_client_access
  on public.website_conversion_events;
create policy website_conversion_events_deny_client_access
  on public.website_conversion_events
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);
