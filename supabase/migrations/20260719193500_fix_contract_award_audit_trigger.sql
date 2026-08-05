create or replace function public.audit_contract_award_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_award_id uuid;
    v_entity_type text;
    v_entity_id text;
begin
    if tg_table_name = 'contract_awards' then
        v_entity_type := 'award';
        v_award_id := case when tg_op = 'DELETE' then old.id else new.id end;
    elsif tg_table_name = 'contract_award_values' then
        v_entity_type := 'value';
        v_award_id := case when tg_op = 'DELETE' then old.contract_award_id else new.contract_award_id end;
    else
        v_entity_type := 'citation';
        v_award_id := case when tg_op = 'DELETE' then old.contract_award_id else new.contract_award_id end;
    end if;

    v_entity_id := (case when tg_op = 'DELETE' then old.id else new.id end)::text;

    insert into public.contract_award_audit_log (
        contract_award_id,
        entity_type,
        entity_id,
        action,
        actor_user_id,
        before_snapshot,
        after_snapshot
    ) values (
        v_award_id,
        v_entity_type,
        v_entity_id,
        case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
        auth.uid(),
        case when tg_op = 'INSERT' then null else to_jsonb(old) end,
        case when tg_op = 'DELETE' then null else to_jsonb(new) end
    );

    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$$;

revoke all on function public.audit_contract_award_change() from public;
