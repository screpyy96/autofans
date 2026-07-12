-- Add details and condition fields to public.listings table
alter table public.listings
  add column if not exists owners int default 1,
  add column if not exists service_history boolean default false,
  add column if not exists engine_size int,
  add column if not exists power int,
  add column if not exists doors int default 4,
  add column if not exists seats int default 5,
  add column if not exists condition_overall int default 3,
  add column if not exists condition_exterior int default 3,
  add column if not exists condition_interior int default 3,
  add column if not exists condition_engine int default 3,
  add column if not exists condition_transmission int default 3,
  add column if not exists has_accidents boolean default false,
  add column if not exists features jsonb default '[]'::jsonb;
