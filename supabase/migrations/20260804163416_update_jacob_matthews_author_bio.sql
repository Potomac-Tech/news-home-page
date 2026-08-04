do $$
begin
    update public.editorial_authors
    set bio = $bio$Jacob is the founder and CEO of Potomac, owner of the Cabeus Explorer brand and also building a lunar data platform to enable a sustained U.S. presence on the Moon. Previously, he co-founded Zeno Power, where as CTO he led the development of the first commercial radioisotope heat source and its demonstration in 2023. Before his entrepreneurial career, Jake served as a U.S. Army Cavalry officer, including a deployment to Afghanistan. He holds an M.S. in Mechanical Engineering from Vanderbilt University and a B.S. in Mechanical Engineering from the United States Military Academy at West Point.$bio$
    where lower(slug) = 'jacob-matthews';

    if not found then
        raise exception 'Jacob Matthews author profile was not found.';
    end if;
end
$$;
