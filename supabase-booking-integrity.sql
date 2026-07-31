-- Website booking integrity and web-lead price breakdown.
-- Applied to Supabase project carmatch-os-dev on 2026-07-31.

alter table public.website_leads
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists vehicle_url text,
  add column if not exists rental_amount bigint,
  add column if not exists delivery_fee_amount bigint,
  add column if not exists loyalty_discount_amount bigint,
  add column if not exists promo_discount_amount bigint,
  add column if not exists total_amount bigint,
  add column if not exists pricing_snapshot jsonb;

create unique index if not exists website_leads_booking_ref_unique
  on public.website_leads (booking_ref)
  where booking_ref is not null;

create index if not exists website_leads_vehicle_created_idx
  on public.website_leads (vehicle_id, created_at desc)
  where form_type = 'booking';

create index if not exists vehicle_reservations_vehicle_period_idx
  on public.vehicle_reservations using gist (vehicle_id, rental_period)
  where status in ('held', 'confirmed');
