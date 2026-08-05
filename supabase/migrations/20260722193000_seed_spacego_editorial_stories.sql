-- Seed original Cabeus briefs derived from attributed SPACE <GO> reporting.
with seed_articles (
    slug, title, dek, public_summary, public_teaser_markdown,
    public_key_points, intro_markdown, hero_image_url, hero_image_alt,
    published_at, seo_description, aeo_summary
) as (
    values
    (
        'space-collar-workforce-lunar-economy',
        'The lunar workforce is expanding beyond astronauts and engineers',
        'A sustained lunar presence will depend on a broader class of space-focused operators, tradespeople, analysts, financiers, insurers, lawyers, and logistics specialists.',
        'The emerging lunar economy needs more than launch and spacecraft talent. It also needs the commercial, operational, legal, and industrial workforce required to keep remote infrastructure functioning.',
        'The Explorer brief maps the workforce categories most likely to become lunar bottlenecks and identifies the demand signals organizations should track.',
        '["Lunar infrastructure creates demand across operations, construction, power, logistics, communications, cybersecurity, finance, insurance, and law.","Workforce classification and training systems have not yet caught up with the breadth of commercial space activity.","Employers that combine domain expertise with lunar operating knowledge may build a durable execution advantage."]'::jsonb,
        'Meet the Future contributor Rich Cooper describes these roles as space collar jobs: work that enables, finances, governs, protects, and expands activity beyond Earth. For the lunar industry, the concept is useful because it exposes the people and capabilities hidden behind a mission architecture.',
        '/space-collar-lunar-workforce.png',
        'Lunar surface operations team supporting power, logistics, and mission systems',
        '2026-07-14 12:00:00+00'::timestamptz,
        'How the emerging space collar workforce will support lunar infrastructure, logistics, finance, law, insurance, cybersecurity, and operations.',
        'Sustained lunar operations will require a cross-disciplinary workforce spanning technical, commercial, legal, financial, and operational roles.'
    ),
    (
        'clps-2-lunar-logistics-market',
        'CLPS 2.0 points toward a higher-cadence lunar logistics market',
        'NASA''s draft follow-on procurement signals more competition, heavier deliveries, standardized interfaces, and a longer runway for commercial lunar transportation.',
        'A proposed successor to the current Commercial Lunar Payload Services contract would shift the market from occasional payload delivery toward a more repeatable logistics network for sustained operations.',
        'The Explorer brief separates the draft procurement signal from awarded revenue and identifies the logistics, interface, and supply-chain indicators to monitor next.',
        '["The draft vehicle is designed to admit new providers and remove underperforming ones over a contract period extending into the next decade.","Medium- and heavy-class landers would expand the addressable market beyond small science payloads.","Standard interfaces and repeatable production are likely to matter as much as headline mission count."]'::jsonb,
        'SpaceGo reporting describes a draft NASA procurement intended to increase the frequency and capacity of commercial lunar deliveries. The strategic signal is not a single forecast number; it is the agency''s move toward a market structure that can support recurring surface operations.',
        '/commercial-lunar-delivery-pipeline.webp',
        'Commercial lunar lander delivering instruments and cargo to the Moon',
        '2026-06-15 12:00:00+00'::timestamptz,
        'What NASA''s draft CLPS 2.0 procurement could mean for lunar logistics, lander competition, payload interfaces, and surface infrastructure.',
        'CLPS 2.0 is a procurement signal for a larger, more standardized, and more competitive lunar logistics market; final awards remain the key revenue evidence.'
    ),
    (
        'crewed-lunar-rover-surface-mobility-market',
        'Crewed lunar rover awards open the surface mobility market',
        'Competing rover awards to Astrolab and Lunar Outpost create a funded path toward extending astronaut range and commercial operations at the lunar south pole.',
        'Crew-capable lunar vehicles turn mobility into a service layer, with implications for science range, cargo movement, infrastructure maintenance, and future commercial use.',
        'The Explorer brief examines the downstream surface-services market and the milestones that will distinguish a durable mobility platform from a one-mission vehicle.',
        '["NASA''s dual-provider strategy preserves competition and reduces dependence on a single vehicle architecture.","Rovers expand the practical operating radius around landing sites and surface infrastructure.","Power, maintenance, communications, navigation, payload integration, and spares become follow-on markets."]'::jsonb,
        'SpaceGo reported roughly $440 million in NASA awards for crew-capable lunar rover efforts led by Astrolab and Lunar Outpost. The immediate value is funded vehicle development; the larger signal is the emergence of mobility as shared lunar infrastructure.',
        '/crewed-lunar-rover-market.png',
        'Two crew-capable lunar rover concepts operating near the lunar south pole',
        '2026-06-14 12:00:00+00'::timestamptz,
        'How NASA''s crewed lunar rover awards could create a wider market for mobility, power, communications, navigation, and surface logistics.',
        'Crewed rover awards create a funded path toward lunar mobility and downstream demand for power, maintenance, communications, navigation, and cargo services.'
    ),
    (
        'artemis-iii-crew-integration-schedule',
        'Artemis III crew selection sharpens the integration schedule',
        'Naming a four-person crew gives NASA''s orbital test a more concrete operating sequence and raises the visibility of dependencies across Orion and commercial lander interfaces.',
        'Artemis III is positioned as an integrated orbital test intended to reduce risk before a later lunar landing, making docking, communications, procedures, and supplier readiness central schedule indicators.',
        'The Explorer brief identifies the integration milestones that matter most to suppliers, investors, and lunar program planners as the mission approaches.',
        '["The mission is intended to test integrated systems and rendezvous procedures before a crewed lunar landing attempt.","A named crew increases training and procedure dependencies alongside hardware readiness.","Interface milestones across government and commercial systems are the leading schedule signals to watch."]'::jsonb,
        'SpaceGo reported NASA''s selection of four astronauts for Artemis III and framed the mission as a critical risk-reduction step. For the lunar market, the important change is a more observable integration campaign connecting spacecraft, lander test articles, crews, facilities, and procedures.',
        '/artemis-iii-crew-integration.png',
        'Four astronauts reviewing an integrated spacecraft test plan',
        '2026-06-09 12:00:00+00'::timestamptz,
        'Why the Artemis III crew announcement makes integrated hardware, docking, communications, training, and supplier milestones more important schedule signals.',
        'A named Artemis III crew makes integration and training milestones more observable while focusing schedule risk on interfaces across government and commercial systems.'
    )
)
insert into public.editorial_articles (
    slug, status, access_tier_required, title, dek, public_summary,
    public_teaser_markdown, public_key_points, intro_markdown,
    hero_image_url, hero_image_alt, published_at, seo_title,
    seo_description, aeo_summary, metadata
)
select
    slug, 'published'::public.editorial_article_status,
    'member'::public.membership_tier, title, dek, public_summary,
    public_teaser_markdown, public_key_points, intro_markdown,
    hero_image_url, hero_image_alt, published_at, title,
    seo_description, aeo_summary,
    jsonb_build_object(
        'source_feed', 'mtf_spacego',
        'source_attribution', 'Meet the Future / SPACE <GO>',
        'seed_type', 'original_editorial_summary'
    )
from seed_articles
on conflict (lower(slug)) do update set
    status = excluded.status,
    access_tier_required = excluded.access_tier_required,
    title = excluded.title,
    dek = excluded.dek,
    public_summary = excluded.public_summary,
    public_teaser_markdown = excluded.public_teaser_markdown,
    public_key_points = excluded.public_key_points,
    intro_markdown = excluded.intro_markdown,
    hero_image_url = excluded.hero_image_url,
    hero_image_alt = excluded.hero_image_alt,
    published_at = excluded.published_at,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    aeo_summary = excluded.aeo_summary,
    metadata = excluded.metadata;

with seed_bodies (slug, body_markdown, body_excerpt) as (
    values
    (
        'space-collar-workforce-lunar-economy',
        E'A lunar mission is the visible output of a much larger operating system. Engineers and astronauts remain central, but sustained activity also requires power technicians, construction specialists, mission operators, supply-chain managers, data analysts, accountants, lawyers, insurers, cybersecurity teams, and procurement professionals. Treating these functions as secondary understates their effect on schedule, cost, and mission resilience.\n\nThe near-term workforce market will form around programs with funded hardware and recurring operations. Employers should watch awarded task orders, planned landing cadence, surface-power deployments, relay-service procurements, and data-delivery requirements. Those signals translate architecture into specific staffing needs.\n\nThe largest risk is a mismatch between specialized lunar knowledge and established professional disciplines. Organizations that develop this combined expertise before demand peaks will be better positioned to execute and to price risk.\n\nFor universities and workforce programs, the practical opportunity is to add lunar systems, regulation, mission economics, and operational data to existing engineering, business, policy, and skilled-trade pathways.',
        'The lunar economy needs technical, commercial, legal, financial, and operational expertise working as one system.'
    ),
    (
        'clps-2-lunar-logistics-market',
        E'The draft CLPS successor should be read as a market-design signal rather than booked revenue. NASA is testing a structure that could support more providers, larger landers, feasibility work, and recurring task orders over a longer period. Final requirements, appropriations, and individual awards will determine how much of that ambition becomes funded demand.\n\nFor lander companies, higher cadence changes the operating model. Repeatable production, common payload interfaces, supplier resilience, and mission recovery become more important than optimizing every flight as a bespoke project.\n\nThe opportunity extends beyond prime lander contracts. Heavier deliveries create demand for payload integration, deployment mechanisms, surface power, communications, navigation, thermal systems, ground operations, and data services.\n\nThe next evidence to track is the final solicitation, contract ceiling, eligible service categories, domestic-content rules, on-ramp process, and first task orders. Until those items are final, mission-volume estimates should be treated as planning assumptions rather than a revenue forecast.',
        'The draft CLPS successor is a market signal; final requirements and task orders will determine funded demand.'
    ),
    (
        'crewed-lunar-rover-surface-mobility-market',
        E'Surface mobility changes the economics of a landing site. Without a vehicle, crew and cargo operations remain concentrated near the lander. A reliable rover expands the reachable science area, links distributed infrastructure, supports inspection and repair, and reduces the labor required to move equipment.\n\nNASA''s dual-provider approach creates competitive pressure while preserving architectural diversity. The commercial question is whether each provider can move from development hardware to a service with measurable availability, payload capacity, range, charging requirements, maintenance intervals, and mission-support pricing.\n\nThe surrounding market includes charging and power management, navigation aids, communications coverage, route planning, dust mitigation, replacement parts, robotic attachments, cargo handling, and fleet telemetry.\n\nInvestors and suppliers should track design reviews, uncrewed demonstrations, delivery contracts, launch assignments, south-pole communications coverage, and the allocation of vehicle capacity between NASA and commercial users.',
        'Crew-capable rovers can turn lunar mobility into shared infrastructure and create demand for supporting services.'
    ),
    (
        'artemis-iii-crew-integration-schedule',
        E'Crew selection starts a tighter cycle of training, procedure validation, simulator work, medical planning, and mission-specific integration. Each change to hardware or mission design can now propagate into crew preparation and operational certification.\n\nThe core value of Artemis III is risk retirement across interfaces. Orion, docking systems, communications, ground operations, and commercial lander test articles must function as one mission architecture. Interface testing and end-to-end demonstrations are more informative than isolated hardware completion.\n\nFor suppliers and investors, the most useful indicators are completed design and safety reviews, delivered flight hardware, integrated software tests, docking demonstrations, crew-training milestones, and closure of major anomalies.\n\nA successful orbital test would improve confidence in later landing missions and clarify demand timing for surface systems. A delay could shift payload schedules, communications deployments, rover operations, and commercial lunar revenue across the supply chain.',
        'The Artemis III crew announcement makes integrated systems and training milestones more concrete schedule indicators.'
    )
)
insert into public.editorial_article_bodies (article_id, body_markdown, body_excerpt)
select article.id, seed.body_markdown, seed.body_excerpt
from seed_bodies seed
join public.editorial_articles article on lower(article.slug) = lower(seed.slug)
on conflict (article_id) do update set
    body_markdown = excluded.body_markdown,
    body_excerpt = excluded.body_excerpt;

delete from public.editorial_article_citations
where article_id in (
    select id from public.editorial_articles
    where metadata ->> 'source_feed' = 'mtf_spacego'
);

with seed_citations (slug, title, url, published_on, summary) as (
    values
    ('space-collar-workforce-lunar-economy', 'Beyond Blue and White: The Rise of Space Collar Jobs', 'https://mtf.tv/beyond-blue-and-white-the-rise-of-space-collar-jobs', '2026-07-14'::date, 'Rich Cooper outlines the technical, commercial, policy, and operational professions needed to support a growing space economy.'),
    ('clps-2-lunar-logistics-market', 'NASA Launches CLPS 2.0 to Boost Lunar Deliveries', 'https://mtf.tv/clps-2-0-nasa', '2026-06-15'::date, 'Kevin Cirilli reports on NASA''s draft CLPS follow-on vehicle, provider competition, delivery ambitions, and standardization goals.'),
    ('crewed-lunar-rover-surface-mobility-market', 'NASA''s $440M for crewed moon buggies', 'https://mtf.tv/nasa-funds-moon-buggies-for-artemis-program', '2026-06-14'::date, 'Kevin Cirilli reports on NASA''s awards to Astrolab and Lunar Outpost and the role of mobility in sustained lunar operations.'),
    ('artemis-iii-crew-integration-schedule', 'NASA announces crew for crucial Artemis III', 'https://mtf.tv/nasa-artemis-rocket-launch', '2026-06-09'::date, 'Kevin Cirilli reports on the crew announcement, orbital test objectives, commercial interfaces, and Artemis schedule context.')
)
insert into public.editorial_article_citations (
    article_id, citation_type, label, title, publisher, author, url,
    published_on, accessed_on, summary, sort_order, metadata
)
select
    article.id, 'source'::public.editorial_citation_type,
    'Source reporting', seed.title, 'Meet the Future / SPACE <GO>',
    case when seed.slug = 'space-collar-workforce-lunar-economy' then 'Rich Cooper' else 'Kevin Cirilli' end,
    seed.url, seed.published_on, current_date, seed.summary, 0,
    '{"source_feed":"mtf_spacego"}'::jsonb
from seed_citations seed
join public.editorial_articles article on lower(article.slug) = lower(seed.slug);
