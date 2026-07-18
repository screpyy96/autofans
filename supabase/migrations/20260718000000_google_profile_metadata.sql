-- Store Google profile data when a user signs in for the first time, and fill
-- any blank fields on profiles that already exist.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'buyer'
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email),
      display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
      avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url);
  return new;
end;
$$;

update public.profiles as profile
set display_name = coalesce(
      nullif(profile.display_name, ''),
      auth_user.raw_user_meta_data ->> 'full_name',
      auth_user.raw_user_meta_data ->> 'name'
    ),
    avatar_url = coalesce(
      nullif(profile.avatar_url, ''),
      auth_user.raw_user_meta_data ->> 'avatar_url',
      auth_user.raw_user_meta_data ->> 'picture'
    )
from auth.users as auth_user
where profile.id = auth_user.id
  and (nullif(profile.display_name, '') is null or nullif(profile.avatar_url, '') is null);
