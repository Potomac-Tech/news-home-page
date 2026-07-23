-- Align stored membership tiers with the public Explorer and Meridian names.
alter type public.membership_tier
rename value 'member' to 'explorer';

alter type public.membership_tier
rename value 'command' to 'meridian';

do $$
declare
    definition text;
begin
    definition := pg_get_functiondef(
        'private.resolve_nexus_profile_role(uuid)'::regprocedure
    );
    definition := replace(
        definition,
        '''command''::public.membership_tier',
        '''meridian''::public.membership_tier'
    );
    execute definition;
end;
$$;

do $$
begin
    if (
        select array_agg(enum_value.enumlabel::text order by enum_value.enumsortorder)
        from pg_enum enum_value
        join pg_type enum_type on enum_type.oid = enum_value.enumtypid
        join pg_namespace enum_schema on enum_schema.oid = enum_type.typnamespace
        where enum_schema.nspname = 'public'
          and enum_type.typname = 'membership_tier'
    ) is distinct from array['explorer', 'scout', 'meridian'] then
        raise exception 'membership_tier values were not renamed correctly';
    end if;

    if pg_get_functiondef(
        'private.resolve_nexus_profile_role(uuid)'::regprocedure
    ) like '%''command''::public.membership_tier%' then
        raise exception 'Nexus resolver still uses the retired command membership tier';
    end if;
end;
$$;
