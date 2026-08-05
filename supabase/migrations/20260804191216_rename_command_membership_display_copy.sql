-- Rename persisted membership-facing copy without changing stable entitlement,
-- role, route, analytics, or enum identifiers.

update public.app_roles
set description = 'User covered by an organization-level Cabeus Council entitlement.'
where id = 'command_user';

update public.dataset_catalog_entries
set
    title = replace(replace(title, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    summary = replace(replace(summary, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    collection_name = replace(replace(collection_name, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    availability_note = replace(replace(availability_note, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    sample_note = replace(replace(sample_note, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    release_state_note = replace(replace(release_state_note, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    unavailable_reason = replace(replace(unavailable_reason, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    updated_at = now()
where concat_ws(
    ' ',
    title,
    summary,
    collection_name,
    availability_note,
    sample_note,
    release_state_note,
    unavailable_reason
) ~ '(Command|Meridian)';

update public.developer_endpoint_catalog
set
    title = replace(replace(title, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    description = replace(replace(description, 'Command', 'Cabeus Council'), 'Meridian', 'Cabeus Council'),
    updated_at = now()
where concat_ws(' ', title, description) ~ '(Command|Meridian)';
