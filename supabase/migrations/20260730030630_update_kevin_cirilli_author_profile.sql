do $$
begin
    update public.editorial_authors
    set
        title = 'Co-founder and Head',
        organization = 'Cabeus Explorer',
        bio = $bio$Kevin Cirilli is co-founder and head of Cabeus Explorer, the leading intelligence platform for space industrialists. He oversees the platform's editorial vision, growth, partnerships, and branding, and writes its flagship newsletter, Moonberg with Kevin Cirilli. He hopes to one day report from space.

He is former Chief Washington Correspondent for Bloomberg TV and Bloomberg Radio and one of the original journalists assigned to cover President Donald Trump's 2016 presidential campaign. Cirilli has worked at the intersection of frontier industries and media communications for nearly 15 years, advising companies such as Substack, and leading philanthropies such as Blue Star Families. He has launched several media brands both independently and with legacy institutions including mtf.news, Bloomberg Sound On with Kevin Cirilli, and iHeart Media's HELLO FUTURE with Kevin Cirilli. He has appeared across major media platforms including CBS, Fox News, MS NOW (previously MSNBC), C-SPAN, Yahoo Finance, and Fox Business Network. An emerging playwright, his debut play The Man in the Red Hat was workshopped at the Seattle Repertory Theatre in 2026.$bio$,
        avatar_url = '/kevin-cirilli-author.jpg'
    where lower(slug) = 'kevin-cirilli';

    if not found then
        raise exception 'Kevin Cirilli author profile was not found.';
    end if;
end
$$;
