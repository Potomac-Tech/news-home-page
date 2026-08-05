-- The normalized enterprise role ID remains `meridian`; only its member-facing
-- description uses the Cabeus Council product name.

update public.app_roles
set description = 'User covered by an organization-level Cabeus Council entitlement.'
where id = 'meridian';
