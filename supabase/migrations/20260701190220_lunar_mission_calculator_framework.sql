do $$
begin
    create type public.lunar_calculator_status as enum (
        'draft',
        'review',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_calculator_visibility_tier as enum (
        'public',
        'explorer',
        'scout',
        'command'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_calculator_confidence_label as enum (
        'low',
        'medium',
        'high',
        'experimental'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_calculator_source_review_status as enum (
        'queued',
        'reviewed',
        'licensed',
        'restricted',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.lunar_calculator_definitions (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    name text not null,
    calculator_key text not null,
    category text not null default 'mission_planning',
    summary text not null default '',
    limitation_note text not null default '',
    output_unit_label text,
    default_confidence_label public.lunar_calculator_confidence_label not null
        default 'medium',
    publication_status public.lunar_calculator_status not null
        default 'draft',
    visibility_tier public.lunar_calculator_visibility_tier not null
        default 'explorer',
    minimum_saved_run_tier public.lunar_calculator_visibility_tier not null
        default 'scout',
    display_order integer not null default 100,
    current_version_id uuid,
    freshness_at timestamptz,
    analyst_review_state text not null default 'queued',
    analyst_reviewed_at timestamptz,
    analyst_reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_calculator_definitions_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint lunar_calculator_definitions_name_not_blank check (
        length(trim(name)) > 0
    ),
    constraint lunar_calculator_definitions_key_not_blank check (
        length(trim(calculator_key)) > 0
    ),
    constraint lunar_calculator_definitions_order_nonnegative check (
        display_order >= 0
    )
);

create unique index if not exists lunar_calculator_definitions_slug_key
on public.lunar_calculator_definitions (lower(slug));

create unique index if not exists lunar_calculator_definitions_key
on public.lunar_calculator_definitions (lower(calculator_key));

create index if not exists lunar_calculator_definitions_public_idx
on public.lunar_calculator_definitions (
    publication_status,
    visibility_tier,
    display_order,
    updated_at desc
);

drop trigger if exists set_lunar_calculator_definitions_updated_at
on public.lunar_calculator_definitions;
create trigger set_lunar_calculator_definitions_updated_at
before update on public.lunar_calculator_definitions
for each row execute function public.set_updated_at();

create table if not exists public.lunar_calculator_versions (
    id uuid primary key default gen_random_uuid(),
    calculator_id uuid not null
        references public.lunar_calculator_definitions(id) on delete cascade,
    version_label text not null,
    semantic_version text,
    change_summary text not null default '',
    formula_language text not null default 'json_logic',
    formula_manifest jsonb not null default '{}'::jsonb,
    input_schema jsonb not null default '{}'::jsonb,
    output_schema jsonb not null default '{}'::jsonb,
    publication_status public.lunar_calculator_status not null
        default 'draft',
    confidence_label public.lunar_calculator_confidence_label not null
        default 'medium',
    effective_at timestamptz,
    retired_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint lunar_calculator_versions_label_not_blank check (
        length(trim(version_label)) > 0
    ),
    constraint lunar_calculator_versions_formula_object check (
        jsonb_typeof(formula_manifest) = 'object'
    ),
    constraint lunar_calculator_versions_input_schema_object check (
        jsonb_typeof(input_schema) = 'object'
    ),
    constraint lunar_calculator_versions_output_schema_object check (
        jsonb_typeof(output_schema) = 'object'
    ),
    constraint lunar_calculator_versions_date_order check (
        retired_at is null
        or effective_at is null
        or retired_at >= effective_at
    )
);

create unique index if not exists lunar_calculator_versions_label_key
on public.lunar_calculator_versions (
    calculator_id,
    lower(version_label)
);

create index if not exists lunar_calculator_versions_calculator_idx
on public.lunar_calculator_versions (
    calculator_id,
    publication_status,
    effective_at desc nulls last
);

alter table public.lunar_calculator_definitions
drop constraint if exists lunar_calculator_definitions_current_version_fk;

alter table public.lunar_calculator_definitions
add constraint lunar_calculator_definitions_current_version_fk
foreign key (current_version_id)
references public.lunar_calculator_versions(id)
on delete set null;

create table if not exists public.lunar_calculator_assumptions (
    id uuid primary key default gen_random_uuid(),
    calculator_id uuid not null
        references public.lunar_calculator_definitions(id) on delete cascade,
    version_id uuid references public.lunar_calculator_versions(id)
        on delete cascade,
    assumption_key text not null,
    label text not null,
    description text not null default '',
    default_value_numeric numeric(18, 6),
    default_value_text text,
    default_value_json jsonb,
    unit_label text,
    min_value numeric(18, 6),
    max_value numeric(18, 6),
    is_required boolean not null default true,
    display_order integer not null default 100,
    confidence_label public.lunar_calculator_confidence_label not null
        default 'medium',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_calculator_assumptions_key_not_blank check (
        length(trim(assumption_key)) > 0
    ),
    constraint lunar_calculator_assumptions_label_not_blank check (
        length(trim(label)) > 0
    ),
    constraint lunar_calculator_assumptions_has_default check (
        default_value_numeric is not null
        or default_value_text is not null
        or default_value_json is not null
    ),
    constraint lunar_calculator_assumptions_range_order check (
        min_value is null
        or max_value is null
        or max_value >= min_value
    ),
    constraint lunar_calculator_assumptions_order_nonnegative check (
        display_order >= 0
    )
);

create unique index if not exists lunar_calculator_assumptions_key
on public.lunar_calculator_assumptions (
    calculator_id,
    coalesce(version_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(assumption_key)
);

create index if not exists lunar_calculator_assumptions_calculator_idx
on public.lunar_calculator_assumptions (
    calculator_id,
    version_id,
    display_order
);

drop trigger if exists set_lunar_calculator_assumptions_updated_at
on public.lunar_calculator_assumptions;
create trigger set_lunar_calculator_assumptions_updated_at
before update on public.lunar_calculator_assumptions
for each row execute function public.set_updated_at();

create table if not exists public.lunar_calculator_formula_steps (
    id uuid primary key default gen_random_uuid(),
    version_id uuid not null
        references public.lunar_calculator_versions(id) on delete cascade,
    step_key text not null,
    label text not null,
    formula_expression text not null,
    input_keys text[] not null default '{}'::text[],
    output_key text not null,
    output_unit_label text,
    explanation text not null default '',
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_calculator_formula_steps_key_not_blank check (
        length(trim(step_key)) > 0
    ),
    constraint lunar_calculator_formula_steps_label_not_blank check (
        length(trim(label)) > 0
    ),
    constraint lunar_calculator_formula_steps_expression_not_blank check (
        length(trim(formula_expression)) > 0
    ),
    constraint lunar_calculator_formula_steps_output_not_blank check (
        length(trim(output_key)) > 0
    ),
    constraint lunar_calculator_formula_steps_order_nonnegative check (
        display_order >= 0
    )
);

create unique index if not exists lunar_calculator_formula_steps_key
on public.lunar_calculator_formula_steps (version_id, lower(step_key));

create index if not exists lunar_calculator_formula_steps_version_idx
on public.lunar_calculator_formula_steps (version_id, display_order);

drop trigger if exists set_lunar_calculator_formula_steps_updated_at
on public.lunar_calculator_formula_steps;
create trigger set_lunar_calculator_formula_steps_updated_at
before update on public.lunar_calculator_formula_steps
for each row execute function public.set_updated_at();

create table if not exists public.lunar_calculator_validation_rules (
    id uuid primary key default gen_random_uuid(),
    calculator_id uuid not null
        references public.lunar_calculator_definitions(id) on delete cascade,
    version_id uuid references public.lunar_calculator_versions(id)
        on delete cascade,
    input_key text not null,
    rule_key text not null,
    rule_kind text not null,
    rule_config jsonb not null default '{}'::jsonb,
    message text not null,
    severity text not null default 'error',
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_calculator_validation_rules_input_not_blank check (
        length(trim(input_key)) > 0
    ),
    constraint lunar_calculator_validation_rules_rule_not_blank check (
        length(trim(rule_key)) > 0
    ),
    constraint lunar_calculator_validation_rules_kind_not_blank check (
        length(trim(rule_kind)) > 0
    ),
    constraint lunar_calculator_validation_rules_config_object check (
        jsonb_typeof(rule_config) = 'object'
    ),
    constraint lunar_calculator_validation_rules_message_not_blank check (
        length(trim(message)) > 0
    ),
    constraint lunar_calculator_validation_rules_severity check (
        severity in ('info', 'warning', 'error')
    ),
    constraint lunar_calculator_validation_rules_order_nonnegative check (
        display_order >= 0
    )
);

create unique index if not exists lunar_calculator_validation_rules_key
on public.lunar_calculator_validation_rules (
    calculator_id,
    coalesce(version_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(input_key),
    lower(rule_key)
);

create index if not exists lunar_calculator_validation_rules_lookup_idx
on public.lunar_calculator_validation_rules (
    calculator_id,
    version_id,
    input_key,
    display_order
);

drop trigger if exists set_lunar_calculator_validation_rules_updated_at
on public.lunar_calculator_validation_rules;
create trigger set_lunar_calculator_validation_rules_updated_at
before update on public.lunar_calculator_validation_rules
for each row execute function public.set_updated_at();

create table if not exists public.lunar_calculator_source_citations (
    id uuid primary key default gen_random_uuid(),
    calculator_id uuid references public.lunar_calculator_definitions(id)
        on delete cascade,
    version_id uuid references public.lunar_calculator_versions(id)
        on delete cascade,
    assumption_id uuid references public.lunar_calculator_assumptions(id)
        on delete cascade,
    formula_step_id uuid references public.lunar_calculator_formula_steps(id)
        on delete cascade,
    source_name text not null,
    title text not null,
    url text,
    publisher text,
    published_at timestamptz,
    retrieved_at timestamptz,
    citation_text text not null default '',
    supports_fields text[] not null default '{}'::text[],
    license_notes text,
    review_status public.lunar_calculator_source_review_status not null
        default 'queued',
    confidence_label public.lunar_calculator_confidence_label not null
        default 'medium',
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_calculator_source_citations_parent check (
        calculator_id is not null
        or version_id is not null
        or assumption_id is not null
        or formula_step_id is not null
    ),
    constraint lunar_calculator_source_citations_source_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint lunar_calculator_source_citations_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_calculator_source_citations_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint lunar_calculator_source_citations_order_nonnegative check (
        display_order >= 0
    )
);

create index if not exists lunar_calculator_source_citations_calculator_idx
on public.lunar_calculator_source_citations (
    calculator_id,
    review_status,
    display_order
);

create index if not exists lunar_calculator_source_citations_version_idx
on public.lunar_calculator_source_citations (
    version_id,
    review_status,
    display_order
);

drop trigger if exists set_lunar_calculator_source_citations_updated_at
on public.lunar_calculator_source_citations;
create trigger set_lunar_calculator_source_citations_updated_at
before update on public.lunar_calculator_source_citations
for each row execute function public.set_updated_at();

create table if not exists public.lunar_calculator_saved_runs (
    id uuid primary key default gen_random_uuid(),
    calculator_id uuid not null
        references public.lunar_calculator_definitions(id) on delete cascade,
    version_id uuid references public.lunar_calculator_versions(id)
        on delete set null,
    user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    title text not null,
    inputs jsonb not null default '{}'::jsonb,
    outputs jsonb not null default '{}'::jsonb,
    assumption_snapshot jsonb not null default '{}'::jsonb,
    formula_snapshot jsonb not null default '{}'::jsonb,
    validation_messages jsonb not null default '[]'::jsonb,
    confidence_label public.lunar_calculator_confidence_label not null
        default 'medium',
    visibility_scope text not null default 'private',
    last_run_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_calculator_saved_runs_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_calculator_saved_runs_inputs_object check (
        jsonb_typeof(inputs) = 'object'
    ),
    constraint lunar_calculator_saved_runs_outputs_object check (
        jsonb_typeof(outputs) = 'object'
    ),
    constraint lunar_calculator_saved_runs_assumptions_object check (
        jsonb_typeof(assumption_snapshot) = 'object'
    ),
    constraint lunar_calculator_saved_runs_formulas_object check (
        jsonb_typeof(formula_snapshot) = 'object'
    ),
    constraint lunar_calculator_saved_runs_messages_array check (
        jsonb_typeof(validation_messages) = 'array'
    ),
    constraint lunar_calculator_saved_runs_visibility_scope check (
        visibility_scope in ('private', 'organization')
    ),
    constraint lunar_calculator_saved_runs_org_scope check (
        visibility_scope = 'private'
        or organization_id is not null
    )
);

create index if not exists lunar_calculator_saved_runs_user_idx
on public.lunar_calculator_saved_runs (
    user_id,
    updated_at desc,
    calculator_id
);

create index if not exists lunar_calculator_saved_runs_organization_idx
on public.lunar_calculator_saved_runs (
    organization_id,
    updated_at desc
)
where organization_id is not null;

drop trigger if exists set_lunar_calculator_saved_runs_updated_at
on public.lunar_calculator_saved_runs;
create trigger set_lunar_calculator_saved_runs_updated_at
before update on public.lunar_calculator_saved_runs
for each row execute function public.set_updated_at();

create or replace function app_private.can_read_lunar_calculator(
    required_tier public.lunar_calculator_visibility_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select case required_tier
        when 'public' then true
        when 'explorer' then app_private.has_any_role(
            array['explorer', 'member', 'scout', 'command_user']
        )
        when 'scout' then app_private.has_any_role(
            array['scout', 'command_user']
        )
        when 'command' then app_private.has_any_role(
            array['command_user']
        )
        else false
    end
    or app_private.has_any_role(array['editor', 'analyst', 'admin']);
$$;

create or replace function app_private.can_save_lunar_calculator_run(
    required_tier public.lunar_calculator_visibility_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and app_private.can_read_lunar_calculator(required_tier);
$$;

create or replace function app_private.can_manage_lunar_calculators()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array['editor', 'analyst', 'admin']);
$$;

grant execute on function app_private.can_read_lunar_calculator(
    public.lunar_calculator_visibility_tier
) to anon, authenticated;
grant execute on function app_private.can_save_lunar_calculator_run(
    public.lunar_calculator_visibility_tier
) to authenticated;
grant execute on function app_private.can_manage_lunar_calculators()
to authenticated;

alter table public.lunar_calculator_definitions enable row level security;
alter table public.lunar_calculator_versions enable row level security;
alter table public.lunar_calculator_assumptions enable row level security;
alter table public.lunar_calculator_formula_steps enable row level security;
alter table public.lunar_calculator_validation_rules enable row level security;
alter table public.lunar_calculator_source_citations enable row level security;
alter table public.lunar_calculator_saved_runs enable row level security;

grant select (
    id,
    slug,
    name,
    calculator_key,
    category,
    summary,
    limitation_note,
    output_unit_label,
    default_confidence_label,
    publication_status,
    visibility_tier,
    minimum_saved_run_tier,
    display_order,
    current_version_id,
    freshness_at,
    analyst_review_state,
    analyst_reviewed_at,
    updated_at
) on public.lunar_calculator_definitions to anon, authenticated;

grant select (
    id,
    calculator_id,
    version_label,
    semantic_version,
    change_summary,
    formula_language,
    formula_manifest,
    input_schema,
    output_schema,
    publication_status,
    confidence_label,
    effective_at,
    retired_at,
    created_at
) on public.lunar_calculator_versions to anon, authenticated;

grant select (
    id,
    calculator_id,
    version_id,
    assumption_key,
    label,
    description,
    default_value_numeric,
    default_value_text,
    default_value_json,
    unit_label,
    min_value,
    max_value,
    is_required,
    display_order,
    confidence_label,
    updated_at
) on public.lunar_calculator_assumptions to anon, authenticated;

grant select (
    id,
    version_id,
    step_key,
    label,
    formula_expression,
    input_keys,
    output_key,
    output_unit_label,
    explanation,
    display_order,
    updated_at
) on public.lunar_calculator_formula_steps to anon, authenticated;

grant select (
    id,
    calculator_id,
    version_id,
    input_key,
    rule_key,
    rule_kind,
    rule_config,
    message,
    severity,
    display_order,
    updated_at
) on public.lunar_calculator_validation_rules to anon, authenticated;

grant select (
    id,
    calculator_id,
    version_id,
    assumption_id,
    formula_step_id,
    source_name,
    title,
    url,
    publisher,
    published_at,
    retrieved_at,
    citation_text,
    supports_fields,
    license_notes,
    review_status,
    confidence_label,
    display_order,
    updated_at
) on public.lunar_calculator_source_citations to anon, authenticated;

grant select, insert, update, delete on public.lunar_calculator_saved_runs
to authenticated;

grant insert, update, delete on
    public.lunar_calculator_definitions,
    public.lunar_calculator_versions,
    public.lunar_calculator_assumptions,
    public.lunar_calculator_formula_steps,
    public.lunar_calculator_validation_rules,
    public.lunar_calculator_source_citations
to authenticated;

grant all on
    public.lunar_calculator_definitions,
    public.lunar_calculator_versions,
    public.lunar_calculator_assumptions,
    public.lunar_calculator_formula_steps,
    public.lunar_calculator_validation_rules,
    public.lunar_calculator_source_citations,
    public.lunar_calculator_saved_runs
to service_role;

drop policy if exists "lunar_calculator_definitions_select_visible"
on public.lunar_calculator_definitions;
create policy "lunar_calculator_definitions_select_visible"
on public.lunar_calculator_definitions
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_calculator(visibility_tier)
);

drop policy if exists "lunar_calculator_definitions_manage_staff"
on public.lunar_calculator_definitions;
create policy "lunar_calculator_definitions_manage_staff"
on public.lunar_calculator_definitions
for all
to authenticated
using (app_private.can_manage_lunar_calculators())
with check (app_private.can_manage_lunar_calculators());

drop policy if exists "lunar_calculator_versions_select_visible"
on public.lunar_calculator_versions;
create policy "lunar_calculator_versions_select_visible"
on public.lunar_calculator_versions
for select
to anon, authenticated
using (
    publication_status = 'published'
    and exists (
        select 1
        from public.lunar_calculator_definitions calculator
        where calculator.id = lunar_calculator_versions.calculator_id
            and calculator.publication_status = 'published'
            and app_private.can_read_lunar_calculator(
                calculator.visibility_tier
            )
    )
);

drop policy if exists "lunar_calculator_versions_manage_staff"
on public.lunar_calculator_versions;
create policy "lunar_calculator_versions_manage_staff"
on public.lunar_calculator_versions
for all
to authenticated
using (app_private.can_manage_lunar_calculators())
with check (app_private.can_manage_lunar_calculators());

drop policy if exists "lunar_calculator_assumptions_select_visible"
on public.lunar_calculator_assumptions;
create policy "lunar_calculator_assumptions_select_visible"
on public.lunar_calculator_assumptions
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.lunar_calculator_definitions calculator
        where calculator.id = lunar_calculator_assumptions.calculator_id
            and calculator.publication_status = 'published'
            and app_private.can_read_lunar_calculator(
                calculator.visibility_tier
            )
    )
);

drop policy if exists "lunar_calculator_assumptions_manage_staff"
on public.lunar_calculator_assumptions;
create policy "lunar_calculator_assumptions_manage_staff"
on public.lunar_calculator_assumptions
for all
to authenticated
using (app_private.can_manage_lunar_calculators())
with check (app_private.can_manage_lunar_calculators());

drop policy if exists "lunar_calculator_formula_steps_select_visible"
on public.lunar_calculator_formula_steps;
create policy "lunar_calculator_formula_steps_select_visible"
on public.lunar_calculator_formula_steps
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.lunar_calculator_versions version
        join public.lunar_calculator_definitions calculator
            on calculator.id = version.calculator_id
        where version.id = lunar_calculator_formula_steps.version_id
            and version.publication_status = 'published'
            and calculator.publication_status = 'published'
            and app_private.can_read_lunar_calculator(
                calculator.visibility_tier
            )
    )
);

drop policy if exists "lunar_calculator_formula_steps_manage_staff"
on public.lunar_calculator_formula_steps;
create policy "lunar_calculator_formula_steps_manage_staff"
on public.lunar_calculator_formula_steps
for all
to authenticated
using (app_private.can_manage_lunar_calculators())
with check (app_private.can_manage_lunar_calculators());

drop policy if exists "lunar_calculator_validation_rules_select_visible"
on public.lunar_calculator_validation_rules;
create policy "lunar_calculator_validation_rules_select_visible"
on public.lunar_calculator_validation_rules
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.lunar_calculator_definitions calculator
        where calculator.id = lunar_calculator_validation_rules.calculator_id
            and calculator.publication_status = 'published'
            and app_private.can_read_lunar_calculator(
                calculator.visibility_tier
            )
    )
);

drop policy if exists "lunar_calculator_validation_rules_manage_staff"
on public.lunar_calculator_validation_rules;
create policy "lunar_calculator_validation_rules_manage_staff"
on public.lunar_calculator_validation_rules
for all
to authenticated
using (app_private.can_manage_lunar_calculators())
with check (app_private.can_manage_lunar_calculators());

drop policy if exists "lunar_calculator_source_citations_select_visible"
on public.lunar_calculator_source_citations;
create policy "lunar_calculator_source_citations_select_visible"
on public.lunar_calculator_source_citations
for select
to anon, authenticated
using (
    review_status in ('reviewed', 'licensed')
    and (
        (
            calculator_id is not null
            and exists (
                select 1
                from public.lunar_calculator_definitions calculator
                where calculator.id =
                    lunar_calculator_source_citations.calculator_id
                    and calculator.publication_status = 'published'
                    and app_private.can_read_lunar_calculator(
                        calculator.visibility_tier
                    )
            )
        )
        or (
            version_id is not null
            and exists (
                select 1
                from public.lunar_calculator_versions version
                join public.lunar_calculator_definitions calculator
                    on calculator.id = version.calculator_id
                where version.id =
                    lunar_calculator_source_citations.version_id
                    and version.publication_status = 'published'
                    and calculator.publication_status = 'published'
                    and app_private.can_read_lunar_calculator(
                        calculator.visibility_tier
                    )
            )
        )
        or (
            assumption_id is not null
            and exists (
                select 1
                from public.lunar_calculator_assumptions assumption
                join public.lunar_calculator_definitions calculator
                    on calculator.id = assumption.calculator_id
                where assumption.id =
                    lunar_calculator_source_citations.assumption_id
                    and calculator.publication_status = 'published'
                    and app_private.can_read_lunar_calculator(
                        calculator.visibility_tier
                    )
            )
        )
        or (
            formula_step_id is not null
            and exists (
                select 1
                from public.lunar_calculator_formula_steps formula_step
                join public.lunar_calculator_versions version
                    on version.id = formula_step.version_id
                join public.lunar_calculator_definitions calculator
                    on calculator.id = version.calculator_id
                where formula_step.id =
                    lunar_calculator_source_citations.formula_step_id
                    and version.publication_status = 'published'
                    and calculator.publication_status = 'published'
                    and app_private.can_read_lunar_calculator(
                        calculator.visibility_tier
                    )
            )
        )
    )
);

drop policy if exists "lunar_calculator_source_citations_manage_staff"
on public.lunar_calculator_source_citations;
create policy "lunar_calculator_source_citations_manage_staff"
on public.lunar_calculator_source_citations
for all
to authenticated
using (app_private.can_manage_lunar_calculators())
with check (app_private.can_manage_lunar_calculators());

drop policy if exists "lunar_calculator_saved_runs_select_owner_org_staff"
on public.lunar_calculator_saved_runs;
create policy "lunar_calculator_saved_runs_select_owner_org_staff"
on public.lunar_calculator_saved_runs
for select
to authenticated
using (
    user_id = auth.uid()
    or (
        visibility_scope = 'organization'
        and organization_id is not null
        and (
            app_private.is_org_member(organization_id)
            or app_private.is_org_admin(organization_id)
        )
    )
    or app_private.can_manage_lunar_calculators()
);

drop policy if exists "lunar_calculator_saved_runs_insert_owner"
on public.lunar_calculator_saved_runs;
create policy "lunar_calculator_saved_runs_insert_owner"
on public.lunar_calculator_saved_runs
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.lunar_calculator_definitions calculator
        where calculator.id = lunar_calculator_saved_runs.calculator_id
            and calculator.publication_status = 'published'
            and app_private.can_save_lunar_calculator_run(
                calculator.minimum_saved_run_tier
            )
    )
    and (
        visibility_scope = 'private'
        or (
            organization_id is not null
            and (
                app_private.is_org_member(organization_id)
                or app_private.is_org_admin(organization_id)
            )
        )
    )
);

drop policy if exists "lunar_calculator_saved_runs_update_owner_staff"
on public.lunar_calculator_saved_runs;
create policy "lunar_calculator_saved_runs_update_owner_staff"
on public.lunar_calculator_saved_runs
for update
to authenticated
using (
    user_id = auth.uid()
    or app_private.can_manage_lunar_calculators()
)
with check (
    (
        user_id = auth.uid()
        or app_private.can_manage_lunar_calculators()
    )
    and (
        visibility_scope = 'private'
        or (
            organization_id is not null
            and (
                app_private.is_org_member(organization_id)
                or app_private.is_org_admin(organization_id)
            )
        )
    )
);

drop policy if exists "lunar_calculator_saved_runs_delete_owner_staff"
on public.lunar_calculator_saved_runs;
create policy "lunar_calculator_saved_runs_delete_owner_staff"
on public.lunar_calculator_saved_runs
for delete
to authenticated
using (
    user_id = auth.uid()
    or app_private.can_manage_lunar_calculators()
);
