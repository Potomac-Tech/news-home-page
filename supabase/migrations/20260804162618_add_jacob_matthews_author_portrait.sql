do $$
begin
    update public.editorial_authors
    set avatar_url = '/jacob-matthews-author.jpg'
    where lower(slug) = 'jacob-matthews';

    if not found then
        raise exception 'Jacob Matthews author profile was not found.';
    end if;
end
$$;
