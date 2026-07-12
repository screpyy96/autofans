-- Add location fields to listings table
alter table public.listings
  add column if not exists city text,
  add column if not exists county text;

-- Simplify storage insert/update/delete policies using LIKE operator
drop policy if exists "upload authenticated" on storage.objects;
create policy "upload authenticated"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images' and name like (auth.uid()::text || '/%')
);

drop policy if exists "update own objects" on storage.objects;
create policy "update own objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-images' and name like (auth.uid()::text || '/%')
)
with check (
  bucket_id = 'listing-images' and name like (auth.uid()::text || '/%')
);

drop policy if exists "delete own objects" on storage.objects;
create policy "delete own objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images' and name like (auth.uid()::text || '/%')
);
