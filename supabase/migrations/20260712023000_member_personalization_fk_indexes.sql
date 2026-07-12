create index if not exists member_engagement_organization_idx
on public.member_engagement_events (organization_id)
where organization_id is not null;

create index if not exists member_custom_cards_organization_idx
on public.member_custom_intelligence_cards (organization_id)
where organization_id is not null;
