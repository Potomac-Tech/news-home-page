grant select (
    id,
    name,
    slug,
    status,
    website_url
) on public.sponsors to anon;

grant select (
    id,
    placement_key,
    name,
    surface,
    description,
    format,
    dimensions,
    status,
    programmatic_allowed
) on public.ad_placements to anon;

grant select (
    id,
    sponsor_id,
    name,
    status,
    starts_at,
    ends_at
) on public.sponsor_campaigns to anon;

grant select (
    id,
    campaign_id,
    placement_id,
    status,
    starts_at,
    ends_at,
    priority,
    creative_url,
    creative_alt_text,
    utm_campaign
) on public.sponsor_campaign_placements to anon;

create or replace function app_private.has_live_public_sponsor_campaign(
    target_sponsor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.sponsor_campaigns campaign
        join public.sponsor_campaign_placements campaign_placement
            on campaign_placement.campaign_id = campaign.id
        join public.ad_placements placement
            on placement.id = campaign_placement.placement_id
        where campaign.sponsor_id = target_sponsor_id
            and campaign.status = 'active'
            and current_date between campaign.starts_at and campaign.ends_at
            and campaign_placement.status = 'live'
            and current_date between
                campaign_placement.starts_at
                and campaign_placement.ends_at
            and placement.status = 'active'
    );
$$;

create or replace function app_private.has_live_public_ad_placement(
    target_placement_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.sponsor_campaign_placements campaign_placement
        join public.sponsor_campaigns campaign
            on campaign.id = campaign_placement.campaign_id
        join public.sponsors sponsor
            on sponsor.id = campaign.sponsor_id
        where campaign_placement.placement_id = target_placement_id
            and campaign_placement.status = 'live'
            and current_date between
                campaign_placement.starts_at
                and campaign_placement.ends_at
            and campaign.status = 'active'
            and current_date between campaign.starts_at and campaign.ends_at
            and sponsor.status = 'active'
    );
$$;

create or replace function app_private.is_live_public_sponsor_campaign(
    target_campaign_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.sponsor_campaigns campaign
        join public.sponsors sponsor
            on sponsor.id = campaign.sponsor_id
        where campaign.id = target_campaign_id
            and campaign.status = 'active'
            and current_date between campaign.starts_at and campaign.ends_at
            and sponsor.status = 'active'
    );
$$;

create or replace function app_private.is_live_public_campaign_placement(
    target_campaign_placement_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.sponsor_campaign_placements campaign_placement
        join public.ad_placements placement
            on placement.id = campaign_placement.placement_id
        join public.sponsor_campaigns campaign
            on campaign.id = campaign_placement.campaign_id
        join public.sponsors sponsor
            on sponsor.id = campaign.sponsor_id
        where campaign_placement.id = target_campaign_placement_id
            and campaign_placement.status = 'live'
            and current_date between
                campaign_placement.starts_at
                and campaign_placement.ends_at
            and placement.status = 'active'
            and campaign.status = 'active'
            and current_date between campaign.starts_at and campaign.ends_at
            and sponsor.status = 'active'
    );
$$;

grant execute on function
    app_private.has_live_public_sponsor_campaign(uuid),
    app_private.has_live_public_ad_placement(uuid),
    app_private.is_live_public_sponsor_campaign(uuid),
    app_private.is_live_public_campaign_placement(uuid)
to anon, authenticated;

drop policy if exists "sponsors_select_public_active" on public.sponsors;
create policy "sponsors_select_public_active"
on public.sponsors
for select
to anon
using (
    status = 'active'
    and app_private.has_live_public_sponsor_campaign(id)
);

drop policy if exists "ad_placements_select_public_active"
on public.ad_placements;
create policy "ad_placements_select_public_active"
on public.ad_placements
for select
to anon
using (
    status = 'active'
    and (
        programmatic_allowed
        or app_private.has_live_public_ad_placement(id)
    )
);

drop policy if exists "sponsor_campaigns_select_public_active"
on public.sponsor_campaigns;
create policy "sponsor_campaigns_select_public_active"
on public.sponsor_campaigns
for select
to anon
using (app_private.is_live_public_sponsor_campaign(id));

drop policy if exists "sponsor_campaign_placements_select_public_live"
on public.sponsor_campaign_placements;
create policy "sponsor_campaign_placements_select_public_live"
on public.sponsor_campaign_placements
for select
to anon
using (app_private.is_live_public_campaign_placement(id));
