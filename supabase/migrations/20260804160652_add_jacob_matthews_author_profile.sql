do $$
declare
    jacob_user_id uuid;
begin
    select id
    into jacob_user_id
    from auth.users
    where lower(email) = 'jake@potomacdb.com'
    order by created_at
    limit 1;

    update public.editorial_authors
    set
        user_id = coalesce(user_id, jacob_user_id),
        display_name = 'Jacob Matthews',
        title = 'CEO',
        organization = 'Potomac Database Systems',
        bio = 'Jacob Matthews is CEO of Potomac Database Systems and leads product and technology strategy for Cabeus Explorer. He oversees the development of intelligence tools for space industrialists and serves as Cabeus Explorer''s content and technical release owner.',
        social_links = coalesce(social_links, '{}'::jsonb)
            || jsonb_build_object('email', 'mailto:jake@potomacdb.com'),
        is_active = true
    where lower(slug) = 'jacob-matthews';

    if not found then
        insert into public.editorial_authors (
            user_id,
            display_name,
            slug,
            title,
            organization,
            bio,
            social_links,
            is_active
        ) values (
            jacob_user_id,
            'Jacob Matthews',
            'jacob-matthews',
            'CEO',
            'Potomac Database Systems',
            'Jacob Matthews is CEO of Potomac Database Systems and leads product and technology strategy for Cabeus Explorer. He oversees the development of intelligence tools for space industrialists and serves as Cabeus Explorer''s content and technical release owner.',
            jsonb_build_object('email', 'mailto:jake@potomacdb.com'),
            true
        );
    end if;
end
$$;
