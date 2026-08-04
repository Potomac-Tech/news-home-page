do $$
begin
    update public.editorial_authors
    set bio = replace(
        bio,
        ', and writes its flagship newsletter, Moonberg with Kevin Cirilli',
        ''
    )
    where lower(slug) = 'kevin-cirilli';

    if not found then
        raise exception 'Kevin Cirilli author profile was not found.';
    end if;
end
$$;
