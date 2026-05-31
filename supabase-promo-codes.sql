create table if not exists public.promo_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  description   text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null,
  max_discount  numeric,
  min_order     numeric default 0,
  uses_limit    int,
  uses_count    int not null default 0,
  active        boolean not null default true,
  expires_at    timestamptz,
  created_at    timestamptz default now()
);

alter table public.promo_codes enable row level security;

drop policy if exists "Public can read active promo codes" on public.promo_codes;
create policy "Public can read active promo codes" on public.promo_codes
  for select using (active = true);

insert into public.promo_codes (code, description, discount_type, discount_value, max_discount, min_order, uses_limit, active, expires_at)
values
  ('CARMATCH10', 'Giảm 10% (tối đa 100.000đ)', 'percent', 10, 100000, 200000, 100, true, now() + interval '30 days'),
  ('WELCOME50', 'Giảm 50.000đ cho đơn đầu tiên', 'fixed', 50000, null, 100000, null, true, null)
on conflict (code) do update set
  description = excluded.description,
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  max_discount = excluded.max_discount,
  min_order = excluded.min_order,
  uses_limit = excluded.uses_limit,
  active = excluded.active,
  expires_at = excluded.expires_at;
