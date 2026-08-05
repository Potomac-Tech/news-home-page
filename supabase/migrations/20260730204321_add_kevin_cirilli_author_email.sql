do $$
begin
    update public.editorial_authors
    set social_links = coalesce(social_links, '{}'::jsonb)
        || jsonb_build_object('email', 'mailto:kevin@cabeusexplorer.com')
    where lower(slug) = 'kevin-cirilli';

    if not found then
        raise exception 'Kevin Cirilli author profile was not found.';
    end if;
end
$$;
