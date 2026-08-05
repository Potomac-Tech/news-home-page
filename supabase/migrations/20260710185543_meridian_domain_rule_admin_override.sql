create or replace function public.set_meridian_email_domain_rule(
    p_domain text,
    p_decision text,
    p_note text default null
)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare v_domain text := lower(trim(p_domain));
begin
    if not app_private.has_role('admin') then
        raise exception 'admin access is required';
    end if;
    if v_domain = '' or p_decision not in ('deny', 'allow') then
        raise exception 'invalid domain rule';
    end if;
    insert into private.meridian_email_domain_rules (domain, decision, updated_by, note)
    values (v_domain, p_decision, auth.uid(), nullif(trim(p_note), ''))
    on conflict (domain) do update set
        decision = excluded.decision,
        updated_by = excluded.updated_by,
        note = excluded.note,
        updated_at = now();
end;
$$;

revoke all on function public.set_meridian_email_domain_rule(text, text, text) from public, anon;
grant execute on function public.set_meridian_email_domain_rule(text, text, text) to authenticated;
