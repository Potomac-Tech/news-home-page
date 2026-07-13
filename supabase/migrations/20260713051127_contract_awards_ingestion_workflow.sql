create table if not exists public.contract_award_ingestion_runs (
    id uuid primary key default gen_random_uuid(),
    run_key text not null unique,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    status text not null default 'running' check (status in ('running','completed','partial','failed')),
    source_checked_at timestamptz not null,
    records_fetched integer not null default 0 check (records_fetched >= 0),
    records_relevant integer not null default 0 check (records_relevant >= 0),
    records_created integer not null default 0 check (records_created >= 0),
    records_updated integer not null default 0 check (records_updated >= 0),
    records_excluded integer not null default 0 check (records_excluded >= 0),
    error_summary text,
    metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    check (status = 'running' or completed_at is not null)
);

create table if not exists public.contract_awards (
    id uuid primary key default gen_random_uuid(),
    external_source_key text not null,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    ingestion_run_id uuid references public.contract_award_ingestion_runs(id) on delete set null,
    title text not null check (length(trim(title)) between 3 and 240),
    award_date date not null,
    effective_date date,
    option_exercise_date date,
    customer_name text not null check (length(trim(customer_name)) > 0),
    vendor_name text not null check (length(trim(vendor_name)) > 0),
    program_name text,
    award_vehicle text,
    award_number text,
    relevance_scope text not null check (relevance_scope in ('lunar','cislunar','space')),
    relevance_statement text not null check (length(trim(relevance_statement)) >= 20),
    is_space_or_lunar_relevant boolean not null default false,
    confidence_label text not null default 'medium' check (confidence_label in ('low','medium','high','official')),
    tier_visibility text not null default 'member' check (tier_visibility in ('public','member','scout','command')),
    publication_status text not null default 'draft' check (publication_status in ('draft','in_review','published','archived')),
    source_checked_at timestamptz not null,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (source_registry_id, external_source_key),
    constraint contract_awards_dates_order check (
        (effective_date is null or effective_date >= award_date)
        and (option_exercise_date is null or option_exercise_date >= award_date)
    ),
    constraint contract_awards_published_review check (
        publication_status <> 'published'
        or (is_space_or_lunar_relevant and reviewed_by is not null and reviewed_at is not null)
    )
);

create table if not exists public.contract_award_values (
    id uuid primary key default gen_random_uuid(),
    contract_award_id uuid not null unique references public.contract_awards(id) on delete cascade,
    value_state text not null default 'unknown' check (value_state in ('unknown','exact_cited','cited_range','analyst_estimate','withheld')),
    value_visibility text not null default 'scout' check (value_visibility in ('public','member','scout','command')),
    currency_code text not null default 'USD' check (currency_code ~ '^[A-Z]{3}$'),
    exact_cited_amount numeric(20,2),
    cited_range_low numeric(20,2),
    cited_range_high numeric(20,2),
    analyst_estimate numeric(20,2),
    estimate_methodology text,
    source_registry_id uuid references public.intelligence_data_sources(id) on delete restrict,
    source_citation_url text check (source_citation_url is null or source_citation_url ~ '^https://'),
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint contract_award_values_nonnegative check (
        coalesce(exact_cited_amount, 0) >= 0 and coalesce(cited_range_low, 0) >= 0
        and coalesce(cited_range_high, 0) >= 0 and coalesce(analyst_estimate, 0) >= 0
    ),
    constraint contract_award_values_range_order check (
        cited_range_low is null or cited_range_high is null or cited_range_high >= cited_range_low
    ),
    constraint contract_award_values_state_fields check (
        (value_state in ('unknown','withheld') and exact_cited_amount is null and cited_range_low is null and cited_range_high is null and analyst_estimate is null)
        or (value_state = 'exact_cited' and exact_cited_amount is not null and source_registry_id is not null and source_citation_url is not null)
        or (value_state = 'cited_range' and cited_range_low is not null and cited_range_high is not null and source_registry_id is not null and source_citation_url is not null)
        or (value_state = 'analyst_estimate' and analyst_estimate is not null and length(trim(estimate_methodology)) >= 20 and value_visibility in ('scout','command'))
    )
);

create table if not exists public.contract_award_citations (
    id uuid primary key default gen_random_uuid(),
    contract_award_id uuid not null references public.contract_awards(id) on delete cascade,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    citation_title text not null check (length(trim(citation_title)) > 0),
    citation_url text not null check (citation_url ~ '^https://'),
    source_published_at timestamptz,
    retrieved_at timestamptz not null default now(),
    is_primary boolean not null default false,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    unique (contract_award_id, source_registry_id, citation_url)
);

create table if not exists public.contract_award_source_checks (
    id uuid primary key default gen_random_uuid(),
    ingestion_run_id uuid not null references public.contract_award_ingestion_runs(id) on delete cascade,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    check_status text not null check (check_status in ('checked','pending_manual','unavailable','excluded')),
    checked_at timestamptz,
    citation_url text check (citation_url is null or citation_url ~ '^https://'),
    check_note text,
    created_at timestamptz not null default now(),
    unique (ingestion_run_id, source_registry_id)
);

create table if not exists public.contract_award_review_decisions (
    id uuid primary key default gen_random_uuid(),
    contract_award_id uuid not null references public.contract_awards(id) on delete cascade,
    decision text not null check (decision in ('approved','changes_requested','unpublished')),
    review_note text,
    reviewer_user_id uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now()
);

create table if not exists public.contract_award_audit_log (
    id bigint generated always as identity primary key,
    contract_award_id uuid not null,
    entity_type text not null check (entity_type in ('award','value','citation')),
    entity_id text not null,
    action text not null check (action in ('created','updated','deleted')),
    actor_user_id uuid references auth.users(id) on delete set null,
    before_snapshot jsonb,
    after_snapshot jsonb,
    created_at timestamptz not null default now()
);

create index if not exists contract_awards_award_date_idx on public.contract_awards (award_date desc, publication_status);
create index if not exists contract_awards_vendor_idx on public.contract_awards (lower(vendor_name), award_date desc);
create index if not exists contract_awards_customer_idx on public.contract_awards (lower(customer_name), award_date desc);
create index if not exists contract_awards_review_idx on public.contract_awards (publication_status, reviewed_at desc nulls last);
create index if not exists contract_awards_ingestion_idx on public.contract_awards (ingestion_run_id) where ingestion_run_id is not null;
create index if not exists contract_award_values_source_idx on public.contract_award_values (source_registry_id) where source_registry_id is not null;
create index if not exists contract_award_citations_award_idx on public.contract_award_citations (contract_award_id);
create index if not exists contract_award_citations_source_idx on public.contract_award_citations (source_registry_id);
create unique index if not exists contract_award_one_primary_citation_idx on public.contract_award_citations (contract_award_id) where is_primary;
create index if not exists contract_award_reviews_award_idx on public.contract_award_review_decisions (contract_award_id, created_at desc);
create index if not exists contract_award_audit_award_idx on public.contract_award_audit_log (contract_award_id, created_at desc);

create trigger set_contract_awards_updated_at before update on public.contract_awards
for each row execute function public.set_updated_at();
create trigger set_contract_award_values_updated_at before update on public.contract_award_values
for each row execute function public.set_updated_at();

create or replace function public.enforce_contract_award_publication()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
    if new.publication_status = 'published' and not exists (
        select 1 from public.intelligence_data_sources source
        where source.id = new.source_registry_id
          and source.license_status = 'approved'
          and source.analyst_review_state = 'approved'
          and source.publication_status = 'published'
    ) then raise exception 'published contract award requires an approved source registry entry'; end if;
    if new.publication_status = 'published' and not exists (
        select 1 from public.contract_award_citations citation
        where citation.contract_award_id = new.id and citation.is_primary
    ) then raise exception 'published contract award requires a primary citation'; end if;
    return new;
end; $$;
create trigger enforce_contract_award_publication before insert or update on public.contract_awards
for each row execute function public.enforce_contract_award_publication();

create or replace function public.audit_contract_award_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_award_id uuid; v_entity_type text; v_entity_id text;
begin
    v_entity_type := case tg_table_name when 'contract_awards' then 'award' when 'contract_award_values' then 'value' else 'citation' end;
    v_award_id := case when tg_table_name = 'contract_awards' then coalesce(new.id, old.id) else coalesce(new.contract_award_id, old.contract_award_id) end;
    v_entity_id := coalesce(new.id, old.id)::text;
    insert into public.contract_award_audit_log (contract_award_id, entity_type, entity_id, action, actor_user_id, before_snapshot, after_snapshot)
    values (v_award_id, v_entity_type, v_entity_id, case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
        auth.uid(), case when tg_op = 'INSERT' then null else to_jsonb(old) end, case when tg_op = 'DELETE' then null else to_jsonb(new) end);
    if tg_op = 'DELETE' then return old; end if;
    return new;
end; $$;
create trigger audit_contract_awards after insert or update or delete on public.contract_awards
for each row execute function public.audit_contract_award_change();
create trigger audit_contract_award_values after insert or update or delete on public.contract_award_values
for each row execute function public.audit_contract_award_change();
create trigger audit_contract_award_citations after insert or update or delete on public.contract_award_citations
for each row execute function public.audit_contract_award_change();

create or replace function public.review_contract_award(p_award_id uuid, p_decision text, p_note text default null)
returns public.contract_awards language plpgsql security definer set search_path = public, pg_temp as $$
declare v_award public.contract_awards;
begin
    if not app_private.has_any_role(array['editor','admin']) then raise exception 'editor or admin role required'; end if;
    if p_decision not in ('approved','changes_requested','unpublished') then raise exception 'invalid review decision'; end if;
    if p_decision = 'approved' and not exists (
        select 1 from public.contract_award_citations citation
        join public.intelligence_data_sources source on source.id = citation.source_registry_id
        where citation.contract_award_id = p_award_id and citation.is_primary
          and source.license_status = 'approved' and source.analyst_review_state = 'approved'
          and source.publication_status = 'published'
    ) then raise exception 'approval requires a primary citation from an approved source'; end if;
    update public.contract_awards set
        publication_status = case p_decision when 'approved' then 'published' when 'changes_requested' then 'in_review' else 'archived' end,
        reviewed_by = auth.uid(), reviewed_at = now(), updated_by = auth.uid()
    where id = p_award_id returning * into v_award;
    if v_award.id is null then raise exception 'contract award not found'; end if;
    insert into public.contract_award_review_decisions (contract_award_id, decision, review_note, reviewer_user_id)
    values (p_award_id, p_decision, nullif(trim(p_note), ''), auth.uid());
    return v_award;
end; $$;

alter table public.contract_award_ingestion_runs enable row level security;
alter table public.contract_awards enable row level security;
alter table public.contract_award_values enable row level security;
alter table public.contract_award_citations enable row level security;
alter table public.contract_award_source_checks enable row level security;
alter table public.contract_award_review_decisions enable row level security;
alter table public.contract_award_audit_log enable row level security;

create policy "Public reads approved public contract awards" on public.contract_awards for select to anon
using (publication_status = 'published' and tier_visibility = 'public' and is_space_or_lunar_relevant);
create policy "Members read entitled contract awards" on public.contract_awards for select to authenticated
using (publication_status = 'published' and is_space_or_lunar_relevant and app_private.can_read_tracker_tier(tier_visibility));
create policy "Staff manage contract awards" on public.contract_awards for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Public reads approved public contract values" on public.contract_award_values for select to anon
using (value_visibility = 'public' and value_state in ('exact_cited','cited_range') and exists (select 1 from public.contract_awards award where award.id = contract_award_id and award.publication_status = 'published' and award.tier_visibility = 'public' and award.is_space_or_lunar_relevant));
create policy "Members read entitled contract values" on public.contract_award_values for select to authenticated
using (app_private.can_read_tracker_tier(value_visibility) and exists (select 1 from public.contract_awards award where award.id = contract_award_id and award.publication_status = 'published' and award.is_space_or_lunar_relevant and app_private.can_read_tracker_tier(award.tier_visibility)));
create policy "Staff manage contract award values" on public.contract_award_values for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Public reads citations for public contract awards" on public.contract_award_citations for select to anon
using (exists (select 1 from public.contract_awards award where award.id = contract_award_id and award.publication_status = 'published' and award.tier_visibility = 'public' and award.is_space_or_lunar_relevant));
create policy "Members read citations for entitled contract awards" on public.contract_award_citations for select to authenticated
using (exists (select 1 from public.contract_awards award where award.id = contract_award_id and award.publication_status = 'published' and award.is_space_or_lunar_relevant and app_private.can_read_tracker_tier(award.tier_visibility)));
create policy "Staff manage contract award citations" on public.contract_award_citations for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff manage contract award ingestion runs" on public.contract_award_ingestion_runs for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff manage contract award source checks" on public.contract_award_source_checks for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff read contract award review decisions" on public.contract_award_review_decisions for select to authenticated
using (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff read contract award audit log" on public.contract_award_audit_log for select to authenticated
using (app_private.has_any_role(array['editor','analyst','admin']));

grant select on public.contract_awards, public.contract_award_values, public.contract_award_citations to anon, authenticated;
grant insert, update, delete on public.contract_awards, public.contract_award_values, public.contract_award_citations to authenticated;
grant select, insert, update on public.contract_award_ingestion_runs, public.contract_award_source_checks to authenticated;
grant select on public.contract_award_review_decisions, public.contract_award_audit_log to authenticated;
grant execute on function public.review_contract_award(uuid,text,text) to authenticated;
grant all on public.contract_award_ingestion_runs, public.contract_awards, public.contract_award_values, public.contract_award_citations, public.contract_award_source_checks, public.contract_award_review_decisions, public.contract_award_audit_log to service_role;
revoke all on function public.enforce_contract_award_publication() from public, anon, authenticated;
revoke all on function public.audit_contract_award_change() from public, anon, authenticated;
revoke all on function public.review_contract_award(uuid,text,text) from public, anon;
