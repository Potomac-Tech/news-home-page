do $$
begin
    create type public.experimental_test_data_comparison_status as enum (
        'completed',
        'needs_review',
        'failed'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.experimental_test_data_comparisons (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    upload_id uuid not null
        references public.experimental_test_data_uploads(id)
        on delete cascade,
    reference_dataset_id uuid not null
        references public.dataset_catalog_entries(id)
        on delete restrict,
    status public.experimental_test_data_comparison_status not null
        default 'completed',
    result_summary text not null,
    assumptions jsonb not null default '{}'::jsonb,
    limitations text[] not null default '{}'::text[],
    compatibility_score numeric(5,2),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint experimental_test_data_comparisons_summary_not_blank check (
        length(trim(result_summary)) > 0
    ),
    constraint experimental_test_data_comparisons_assumptions_object check (
        jsonb_typeof(assumptions) = 'object'
    ),
    constraint experimental_test_data_comparisons_limitations_present check (
        cardinality(limitations) > 0
    ),
    constraint experimental_test_data_comparisons_score_range check (
        compatibility_score is null
        or (compatibility_score >= 0 and compatibility_score <= 100)
    )
);

create index if not exists experimental_test_data_comparisons_user_created_idx
on public.experimental_test_data_comparisons (user_id, created_at desc);

create index if not exists experimental_test_data_comparisons_upload_idx
on public.experimental_test_data_comparisons (upload_id, created_at desc);

create index if not exists experimental_test_data_comparisons_dataset_idx
on public.experimental_test_data_comparisons (
    reference_dataset_id,
    created_at desc
);

drop trigger if exists set_experimental_test_data_comparisons_updated_at
on public.experimental_test_data_comparisons;
create trigger set_experimental_test_data_comparisons_updated_at
before update on public.experimental_test_data_comparisons
for each row execute function public.set_updated_at();

alter table public.experimental_test_data_comparisons enable row level security;

grant select, insert on public.experimental_test_data_comparisons to authenticated;
grant update, delete on public.experimental_test_data_comparisons to authenticated;
grant all on public.experimental_test_data_comparisons to service_role;

drop policy if exists "experimental_test_data_comparisons_select_owner_staff"
on public.experimental_test_data_comparisons;
create policy "experimental_test_data_comparisons_select_owner_staff"
on public.experimental_test_data_comparisons
for select
to authenticated
using (
    user_id = auth.uid()
    or app_private.has_any_role(array['editor', 'analyst', 'admin'])
);

drop policy if exists "experimental_test_data_comparisons_insert_paid_owner"
on public.experimental_test_data_comparisons;
create policy "experimental_test_data_comparisons_insert_paid_owner"
on public.experimental_test_data_comparisons
for insert
to authenticated
with check (
    user_id = auth.uid()
    and app_private.has_any_role(
        array['scout', 'command_user', 'editor', 'analyst', 'admin']
    )
    and exists (
        select 1
        from public.experimental_test_data_uploads upload
        where upload.id = upload_id
            and upload.user_id = auth.uid()
            and upload.validation_status in ('accepted', 'needs_review')
    )
    and exists (
        select 1
        from public.dataset_catalog_entries dataset
        where dataset.id = reference_dataset_id
            and dataset.publication_status = 'published'
            and dataset.published_at is not null
            and dataset.published_at <= now()
            and dataset.availability_state in ('available', 'preview')
            and (
                dataset.access_tier_required is null
                or dataset.access_tier_required in ('member', 'scout')
                or app_private.has_any_role(array['command_user', 'admin'])
            )
    )
);

drop policy if exists "experimental_test_data_comparisons_update_staff"
on public.experimental_test_data_comparisons;
create policy "experimental_test_data_comparisons_update_staff"
on public.experimental_test_data_comparisons
for update
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "experimental_test_data_comparisons_delete_staff"
on public.experimental_test_data_comparisons;
create policy "experimental_test_data_comparisons_delete_staff"
on public.experimental_test_data_comparisons
for delete
to authenticated
using (app_private.has_role('admin'));
