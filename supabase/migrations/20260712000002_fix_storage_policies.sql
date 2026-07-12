-- Fix storage insert policies to check folder name prefix (user UUID) instead of owner column
drop policy if exists "upload authenticated" on storage.objects;
create policy "upload authenticated"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "update own objects" on storage.objects;
create policy "update own objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "delete own objects" on storage.objects;
create policy "delete own objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
);
