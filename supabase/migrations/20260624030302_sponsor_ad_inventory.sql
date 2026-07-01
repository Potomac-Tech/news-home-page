do $$
begin
    create type public.sponsor_status as enum (
        'prospect',
        'active',
        'paused',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.ad_placement_status as enum (
        'draft',
        'available',
        'reserved',
        'active',
        'retired'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.sponsor_campaign_status as enum (
        'draft',
        'reserved',
        'active',
        'completed',
        'canceled'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.sponsor_campaign_placement_status as enum (
        'planned',
        'live',
        'paused',
        'completed',
        'canceled'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.sponsors (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null,
    status public.sponsor_status not null default 'prospect',
    website_url text,
    industry text,
    primary_contact_name text,
    primary_contact_email text,
    billing_contact_email text,
    notes text,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint sponsors_name_not_blank check (length(trim(name)) > 0),
    constraint sponsors_slug_not_blank check (length(trim(slug)) > 0),
    constraint sponsors_primary_contact_email_format check (
        primary_contact_email is null
        or primary_contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
    constraint sponsors_billing_contact_email_format check (
        billing_contact_email is null
        or billing_contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    )
);

create unique index if not exists sponsors_slug_key
on public.sponsors (lower(slug));

create index if not exists sponsors_status_name_idx
on public.sponsors (status, name);

drop trigger if exists set_sponsors_updated_at on public.sponsors;
create trigger set_sponsors_updated_at
before update on public.sponsors
for each row execute function public.set_updated_at();

create table if not exists public.ad_placements (
    id uuid primary key default gen_random_uuid(),
    placement_key text not null,
    name text not null,
    surface text not null,
    description text not null default '',
    format text not null default 'native',
    dimensions text,
    status public.ad_placement_status not null default 'draft',
    default_rate_cents integer not null default 0,
    currency_code text not null default 'USD',
    programmatic_allowed boolean not null default false,
    reporting_fields jsonb not null default
        '["impressions", "clicks", "conversions"]'::jsonb,
    notes text,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ad_placements_key_not_blank check (
        length(trim(placement_key)) > 0
    ),
    constraint ad_placements_name_not_blank check (length(trim(name)) > 0),
    constraint ad_placements_surface_not_blank check (length(trim(surface)) > 0),
    constraint ad_placements_format_not_blank check (length(trim(format)) > 0),
    constraint ad_placements_default_rate_nonnegative check (
        default_rate_cents >= 0
    ),
    constraint ad_placements_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    ),
    constraint ad_placements_reporting_fields_array check (
        jsonb_typeof(reporting_fields) = 'array'
    )
);

create unique index if not exists ad_placements_key_key
on public.ad_placements (lower(placement_key));

create index if not exists ad_placements_status_surface_idx
on public.ad_placements (status, surface);

drop trigger if exists set_ad_placements_updated_at on public.ad_placements;
create trigger set_ad_placements_updated_at
before update on public.ad_placements
for each row execute function public.set_updated_at();

create table if not exists public.sponsor_campaigns (
    id uuid primary key default gen_random_uuid(),
    sponsor_id uuid not null references public.sponsors(id) on delete cascade,
    name text not null,
    status public.sponsor_campaign_status not null default 'draft',
    starts_at date not null,
    ends_at date not null,
    gross_contract_value_cents integer not null default 0,
    discount_percent numeric(5, 2) not null default 0,
    discount_reason text,
    net_contract_value_cents integer not null default 0,
    currency_code text not null default 'USD',
    external_order_id text,
    reporting_owner text,
    reporting_notes text,
    last_reported_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint sponsor_campaigns_name_not_blank check (length(trim(name)) > 0),
    constraint sponsor_campaigns_end_after_start check (ends_at >= starts_at),
    constraint sponsor_campaigns_gross_nonnegative check (
        gross_contract_value_cents >= 0
    ),
    constraint sponsor_campaigns_discount_range check (
        discount_percent >= 0
        and discount_percent <= 100
    ),
    constraint sponsor_campaigns_net_nonnegative check (
        net_contract_value_cents >= 0
    ),
    constraint sponsor_campaigns_net_not_above_gross check (
        net_contract_value_cents <= gross_contract_value_cents
    ),
    constraint sponsor_campaigns_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    )
);

create index if not exists sponsor_campaigns_sponsor_status_idx
on public.sponsor_campaigns (sponsor_id, status, starts_at desc);

create index if not exists sponsor_campaigns_status_dates_idx
on public.sponsor_campaigns (status, starts_at, ends_at);

drop trigger if exists set_sponsor_campaigns_updated_at
on public.sponsor_campaigns;
create trigger set_sponsor_campaigns_updated_at
before update on public.sponsor_campaigns
for each row execute function public.set_updated_at();

create table if not exists public.sponsor_campaign_placements (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null
        references public.sponsor_campaigns(id) on delete cascade,
    placement_id uuid not null references public.ad_placements(id) on delete restrict,
    status public.sponsor_campaign_placement_status not null default 'planned',
    starts_at date not null,
    ends_at date not null,
    priority integer not null default 100,
    share_of_voice_percent numeric(5, 2),
    flight_rate_cents integer not null default 0,
    booked_impressions integer,
    delivered_impressions integer not null default 0,
    clicks integer not null default 0,
    conversions integer not null default 0,
    creative_url text,
    creative_alt_text text,
    reporting_url text,
    utm_campaign text,
    notes text,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint sponsor_campaign_placements_end_after_start check (
        ends_at >= starts_at
    ),
    constraint sponsor_campaign_placements_priority_nonnegative check (
        priority >= 0
    ),
    constraint sponsor_campaign_placements_share_range check (
        share_of_voice_percent is null
        or (
            share_of_voice_percent >= 0
            and share_of_voice_percent <= 100
        )
    ),
    constraint sponsor_campaign_placements_flight_rate_nonnegative check (
        flight_rate_cents >= 0
    ),
    constraint sponsor_campaign_placements_booked_nonnegative check (
        booked_impressions is null
        or booked_impressions >= 0
    ),
    constraint sponsor_campaign_placements_delivered_nonnegative check (
        delivered_impressions >= 0
    ),
    constraint sponsor_campaign_placements_clicks_nonnegative check (
        clicks >= 0
    ),
    constraint sponsor_campaign_placements_conversions_nonnegative check (
        conversions >= 0
    )
);

create unique index if not exists sponsor_campaign_placements_flight_key
on public.sponsor_campaign_placements (
    campaign_id,
    placement_id,
    starts_at,
    ends_at
);

create index if not exists sponsor_campaign_placements_campaign_idx
on public.sponsor_campaign_placements (campaign_id, status, starts_at);

create index if not exists sponsor_campaign_placements_placement_idx
on public.sponsor_campaign_placements (placement_id, status, starts_at);

drop trigger if exists set_sponsor_campaign_placements_updated_at
on public.sponsor_campaign_placements;
create trigger set_sponsor_campaign_placements_updated_at
before update on public.sponsor_campaign_placements
for each row execute function public.set_updated_at();

alter table public.sponsors enable row level security;
alter table public.ad_placements enable row level security;
alter table public.sponsor_campaigns enable row level security;
alter table public.sponsor_campaign_placements enable row level security;

grant select, insert, update, delete on
    public.sponsors,
    public.ad_placements,
    public.sponsor_campaigns,
    public.sponsor_campaign_placements
to authenticated;

grant all on
    public.sponsors,
    public.ad_placements,
    public.sponsor_campaigns,
    public.sponsor_campaign_placements
to service_role;

drop policy if exists "sponsors_select_staff" on public.sponsors;
create policy "sponsors_select_staff"
on public.sponsors
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "sponsors_manage_staff" on public.sponsors;
create policy "sponsors_manage_staff"
on public.sponsors
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "ad_placements_select_staff" on public.ad_placements;
create policy "ad_placements_select_staff"
on public.ad_placements
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "ad_placements_manage_staff" on public.ad_placements;
create policy "ad_placements_manage_staff"
on public.ad_placements
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "sponsor_campaigns_select_staff"
on public.sponsor_campaigns;
create policy "sponsor_campaigns_select_staff"
on public.sponsor_campaigns
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "sponsor_campaigns_manage_staff"
on public.sponsor_campaigns;
create policy "sponsor_campaigns_manage_staff"
on public.sponsor_campaigns
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "sponsor_campaign_placements_select_staff"
on public.sponsor_campaign_placements;
create policy "sponsor_campaign_placements_select_staff"
on public.sponsor_campaign_placements
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "sponsor_campaign_placements_manage_staff"
on public.sponsor_campaign_placements;
create policy "sponsor_campaign_placements_manage_staff"
on public.sponsor_campaign_placements
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));
