create table if not exists vehicle_reviews (
  id bigserial primary key,
  car_slug text not null,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  trip_date text,
  created_at timestamptz default now()
);

alter table vehicle_reviews enable row level security;
create policy "Public read" on vehicle_reviews for select using (true);
create index on vehicle_reviews (car_slug);
