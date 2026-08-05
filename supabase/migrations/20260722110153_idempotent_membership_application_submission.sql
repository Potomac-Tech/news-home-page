create or replace function public.submit_membership_application(
    p_email text,
    p_full_name text,
    p_company text default null,
    p_title text default null,
    p_intended_use text default null
)
returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
    insert into public.membership_applications (
        user_id,
        email,
        full_name,
        company,
        title,
        intended_use,
        status
    )
    values (
        auth.uid(),
        lower(trim(p_email)),
        trim(p_full_name),
        nullif(trim(p_company), ''),
        nullif(trim(p_title), ''),
        nullif(trim(p_intended_use), ''),
        'pending'
    )
    on conflict do nothing;
$$;

revoke all on function public.submit_membership_application(text, text, text, text, text) from public;
grant execute on function public.submit_membership_application(text, text, text, text, text) to anon, authenticated;
