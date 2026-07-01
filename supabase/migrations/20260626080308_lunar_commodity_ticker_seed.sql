create temporary table lunar_commodity_ticker_seed (
    slug text primary key,
    name text not null,
    symbol text not null,
    category text not null,
    unit_name text not null,
    unit_symbol text not null,
    description text not null,
    lunar_relevance text not null,
    update_cadence text not null,
    confidence_label text not null,
    display_order integer not null,
    pricing_method text not null,
    price_value numeric(20, 6) not null,
    source_name text not null,
    source_url text not null,
    source_note text not null,
    citation_title text not null,
    citation_publisher text not null,
    citation_published_at date,
    citation_summary text not null,
    license_notes text not null
) on commit drop;

insert into lunar_commodity_ticker_seed (
    slug,
    name,
    symbol,
    category,
    unit_name,
    unit_symbol,
    description,
    lunar_relevance,
    update_cadence,
    confidence_label,
    display_order,
    pricing_method,
    price_value,
    source_name,
    source_url,
    source_note,
    citation_title,
    citation_publisher,
    citation_published_at,
    citation_summary,
    license_notes
) values
    (
        'water-ice',
        'Water ice',
        'H2O',
        'Volatile',
        'kilogram',
        'kg',
        'Polar or bound water resource proxy for life support and propellant feedstock.',
        'Water ice is a priority ISRU target for sustaining crews and producing oxygen-hydrogen propellant.',
        'weekly',
        'experimental',
        10,
        'proxy_formula',
        0.001000,
        'NASA ISRU water resource proxy',
        'https://www.nasa.gov/overview-in-situ-resource-utilization/',
        'Initial public ticker value is a terrestrial water placeholder and excludes lunar extraction, purification, storage, and delivery costs.',
        'Overview: In-Situ Resource Utilization',
        'NASA',
        '2023-07-17',
        'NASA describes lunar water ice as a resource that could support sustained exploration and propellant production.',
        'Public NASA page; verify before commercial redistribution.'
    ),
    (
        'oxygen',
        'Oxygen',
        'O2',
        'Volatile',
        'kilogram',
        'kg',
        'Breathing gas and oxidizer proxy derived from water electrolysis or regolith processing.',
        'Oxygen is a core lunar consumable for crewed systems and rocket oxidizer supply.',
        'weekly',
        'low',
        20,
        'proxy_formula',
        0.180000,
        'BLS oxygen PPI proxy via FRED',
        'https://fred.stlouisfed.org/series/PCU325120325120A',
        'Seed value is an analyst USD-per-kilogram placeholder anchored to industrial oxygen price-index monitoring.',
        'Producer Price Index by Industry: Industrial Gas Manufacturing: Oxygen',
        'U.S. Bureau of Labor Statistics via FRED',
        null,
        'The series gives a public oxygen industrial-gas price-index reference for ongoing proxy refreshes.',
        'FRED/BLS data terms apply; store as source reference, not redistributed raw dataset.'
    ),
    (
        'hydrogen',
        'Hydrogen',
        'H2',
        'Volatile',
        'kilogram',
        'kg',
        'Fuel and chemical feedstock proxy for lunar water electrolysis and propellant systems.',
        'Hydrogen is paired with oxygen for lunar propellant production and surface power studies.',
        'weekly',
        'low',
        30,
        'proxy_formula',
        2.000000,
        'DOE clean hydrogen cost proxy',
        'https://www.hydrogen.energy.gov/docs/hydrogenprogramlibraries/pdfs/24005-clean-hydrogen-production-cost-pem-electrolyzer.pdf',
        'Seed value follows the public DOE 2026 clean-hydrogen cost target as a terrestrial proxy, not a lunar delivered price.',
        'Clean Hydrogen Production Cost Scenarios with PEM Electrolyzer Technology',
        'U.S. Department of Energy',
        '2024-05-01',
        'DOE frames clean-hydrogen cost targets that can anchor a transparent terrestrial reference for hydrogen proxies.',
        'Public DOE report; cite report and preserve context.'
    ),
    (
        'helium-3',
        'Helium-3',
        'HE3',
        'Volatile',
        'kilogram',
        'kg',
        'Scarce isotope proxy for quantum, cryogenic, and long-horizon fusion market monitoring.',
        'Helium-3 is frequently cited as a potential lunar regolith harvest target, but source and extraction economics remain highly uncertain.',
        'monthly',
        'experimental',
        40,
        'analyst_estimate',
        17500000.000000,
        'NASA lunar resource-seeking technology note',
        'https://www.nasa.gov/technology/nasa-fosters-development-of-lunar-resource-seeking-technologies/',
        'Seed value is a high-uncertainty analyst placeholder for scarce isotope monitoring and must not be treated as a live lunar contract price.',
        'NASA Fosters Development of Lunar Resource-Seeking Technologies',
        'NASA',
        '2026-05-01',
        'NASA notes technologies for extracting resources such as hydrogen and helium-3 from lunar regolith.',
        'Public NASA page; verify publication metadata before external reuse.'
    ),
    (
        'helium',
        'Helium',
        'HE',
        'Volatile',
        'kilogram',
        'kg',
        'Cryogenic and pressurant gas proxy for surface systems, science payloads, and launch infrastructure.',
        'Helium availability is relevant to lunar surface operations, cryogenic systems, and prospective rare-gas resource recovery.',
        'weekly',
        'medium',
        50,
        'direct_market',
        67.000000,
        'USGS helium 2026 proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-helium.pdf',
        'Seed value converts the USGS Grade-A helium base price reference into an approximate kilogram proxy for ticker display.',
        'Mineral Commodity Summaries 2026: Helium',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS provides public helium supply, production, and base-price reference data.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'nitrogen',
        'Nitrogen',
        'N2',
        'Volatile',
        'kilogram',
        'kg',
        'Buffer gas and industrial gas proxy for habitats, purging, and process operations.',
        'Nitrogen is operationally important for breathing atmospheres, pressure management, and surface processing.',
        'weekly',
        'low',
        60,
        'proxy_formula',
        0.080000,
        'BLS nitrogen PPI proxy via FRED',
        'https://fred.stlouisfed.org/series/PCU3251203251207',
        'Seed value is an analyst USD-per-kilogram placeholder anchored to industrial nitrogen price-index monitoring.',
        'Producer Price Index by Industry: Industrial Gas Manufacturing: Nitrogen',
        'U.S. Bureau of Labor Statistics via FRED',
        null,
        'The series gives a public nitrogen industrial-gas price-index reference for ongoing proxy refreshes.',
        'FRED/BLS data terms apply; store as source reference, not redistributed raw dataset.'
    ),
    (
        'carbon-dioxide',
        'Carbon dioxide',
        'CO2',
        'Volatile',
        'kilogram',
        'kg',
        'Carbon-bearing volatile proxy for life-support loops, propellant chemistry, and process feedstocks.',
        'Carbon dioxide is relevant to closed-loop habitats, Sabatier methane production, and volatile inventories.',
        'weekly',
        'low',
        70,
        'proxy_formula',
        0.120000,
        'BLS carbon dioxide PPI proxy via FRED',
        'https://fred.stlouisfed.org/series/PCU3251203251204',
        'Seed value is an analyst USD-per-kilogram placeholder anchored to industrial carbon dioxide price-index monitoring.',
        'Producer Price Index by Industry: Industrial Gas Manufacturing: Carbon Dioxide',
        'U.S. Bureau of Labor Statistics via FRED',
        null,
        'The series gives a public carbon dioxide industrial-gas price-index reference for ongoing proxy refreshes.',
        'FRED/BLS data terms apply; store as source reference, not redistributed raw dataset.'
    ),
    (
        'methane',
        'Methane',
        'CH4',
        'Volatile',
        'kilogram',
        'kg',
        'Fuel proxy for methane-oxygen propulsion and surface chemical processing.',
        'Methane is relevant to propellant architectures that convert hydrogen and carbon dioxide into storable fuel.',
        'weekly',
        'low',
        80,
        'proxy_formula',
        0.160000,
        'EIA Henry Hub natural gas proxy',
        'https://www.eia.gov/outlooks/steo/report/natgas.php',
        'Seed value derives from natural-gas energy-price monitoring and excludes liquefaction, purification, and lunar logistics.',
        'Short-Term Energy Outlook: Natural Gas',
        'U.S. Energy Information Administration',
        null,
        'EIA publishes Henry Hub natural gas price context that can anchor methane fuel proxy refreshes.',
        'Public EIA content; cite report context and retrieval date.'
    ),
    (
        'silicon',
        'Silicon',
        'SI',
        'Regolith mineral',
        'kilogram',
        'kg',
        'Solar, electronics, glass, and structural-material proxy for oxygen-rich lunar regolith processing.',
        'Silicon-bearing minerals are abundant in lunar regolith and relevant to construction, photovoltaic, and oxygen extraction studies.',
        'weekly',
        'medium',
        90,
        'direct_market',
        2.900000,
        'USGS MCS 2026 silicon proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded terrestrial silicon commodity proxy for display and should be refreshed from analyst-reviewed source tables.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'aluminum',
        'Aluminum',
        'AL',
        'Regolith metal',
        'kilogram',
        'kg',
        'Structural metal proxy for lunar regolith extraction and in-space manufacturing cases.',
        'Aluminum-bearing minerals are relevant to lightweight structures, power systems, and regolith processing.',
        'weekly',
        'medium',
        100,
        'direct_market',
        2.550000,
        'USGS MCS 2026 aluminum proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded terrestrial aluminum proxy for display and should be refreshed from analyst-reviewed source tables.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'iron',
        'Iron',
        'FE',
        'Regolith metal',
        'kilogram',
        'kg',
        'Bulk structural metal proxy for regolith beneficiation and construction inputs.',
        'Iron-bearing phases are important for oxygen extraction, construction materials, shielding, and manufacturing feedstock.',
        'weekly',
        'medium',
        110,
        'direct_market',
        0.100000,
        'USGS MCS 2026 iron ore proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded iron-ore-equivalent terrestrial proxy, not refined metal parity.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'titanium',
        'Titanium',
        'TI',
        'Regolith metal',
        'kilogram',
        'kg',
        'High-value metal proxy for ilmenite-rich regolith and advanced structures.',
        'Titanium-bearing lunar minerals are relevant to oxygen extraction, high-strength parts, and ilmenite prospecting.',
        'weekly',
        'medium',
        120,
        'direct_market',
        7.500000,
        'USGS MCS 2026 titanium proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded terrestrial titanium proxy spanning mineral and metal reference ranges.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'magnesium',
        'Magnesium',
        'MG',
        'Regolith metal',
        'kilogram',
        'kg',
        'Light-metal proxy for alloys, construction, and oxygen-bearing mineral processing.',
        'Magnesium-bearing minerals are present in lunar materials and may support alloy and ISRU production chains.',
        'weekly',
        'medium',
        130,
        'direct_market',
        3.800000,
        'USGS MCS 2026 magnesium proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded terrestrial magnesium metal proxy for display.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'calcium',
        'Calcium',
        'CA',
        'Regolith mineral',
        'kilogram',
        'kg',
        'Anorthite and oxide proxy for construction feedstock and oxygen-rich mineral processing.',
        'Calcium-bearing lunar minerals are important for regolith chemistry, cement-like materials, and construction studies.',
        'monthly',
        'low',
        140,
        'proxy_formula',
        4.000000,
        'USGS MCS 2026 lime/calcium proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a low-confidence calcium-equivalent proxy derived from terrestrial calcium-bearing commodity context.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'rare-earth-oxides',
        'Rare earth oxides',
        'REO',
        'Strategic mineral',
        'kilogram',
        'kg',
        'Mixed rare-earth oxide proxy for KREEP terrain monitoring and high-value materials.',
        'Rare-earth-bearing lunar terrains matter for strategic mineral narratives and long-horizon resource assessment.',
        'weekly',
        'medium',
        150,
        'direct_market',
        9.000000,
        'USGS MCS 2026 rare earths proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded mixed-REO terrestrial proxy and does not model specific oxide baskets.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'platinum-group-metals',
        'Platinum group metals',
        'PGM',
        'Strategic metal',
        'kilogram',
        'kg',
        'High-value metal basket proxy for speculative lunar and asteroid-adjacent resource tracking.',
        'PGM monitoring helps compare lunar resource narratives against mature terrestrial precious-metal markets.',
        'weekly',
        'medium',
        160,
        'direct_market',
        32000.000000,
        'USGS MCS 2026 platinum group proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded platinum-group basket proxy and should be replaced by explicit basket methodology.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'nickel',
        'Nickel',
        'NI',
        'Regolith metal',
        'kilogram',
        'kg',
        'Alloy and battery-metal proxy for high-value extraction comparisons.',
        'Nickel can inform lunar resource comparisons with terrestrial alloy, battery, and meteoritic-material markets.',
        'weekly',
        'medium',
        170,
        'direct_market',
        15.500000,
        'USGS MCS 2026 nickel proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded terrestrial nickel proxy for display.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'sulfur',
        'Sulfur',
        'S',
        'Volatile/mineral',
        'kilogram',
        'kg',
        'Chemical feedstock proxy for industrial processing, concrete concepts, and volatile inventories.',
        'Sulfur is relevant to some lunar construction and chemistry concepts and to volatile accounting.',
        'weekly',
        'medium',
        180,
        'direct_market',
        0.080000,
        'USGS MCS 2026 sulfur proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded terrestrial sulfur proxy for display.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'potassium-compounds',
        'Potassium compounds',
        'K2O',
        'Strategic mineral',
        'kilogram K2O equivalent',
        'kg K2O',
        'KREEP and fertilizer/feedstock proxy for potassium-bearing lunar material monitoring.',
        'Potassium abundance is useful for KREEP terrain interpretation and future resource comparison work.',
        'weekly',
        'medium',
        190,
        'direct_market',
        0.320000,
        'USGS MCS 2026 potash proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded potash/K2O-equivalent terrestrial proxy for display.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    ),
    (
        'phosphorus-compounds',
        'Phosphorus compounds',
        'P2O5',
        'Strategic mineral',
        'kilogram P2O5 equivalent',
        'kg P2O5',
        'Fertilizer and KREEP-related phosphate proxy for surface-resource planning.',
        'Phosphorus-bearing phases are relevant to KREEP studies, agriculture concepts, and closed-loop settlement assumptions.',
        'weekly',
        'medium',
        200,
        'direct_market',
        0.950000,
        'USGS MCS 2026 phosphate proxy',
        'https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf',
        'Seed value is a rounded phosphate/P2O5-equivalent terrestrial proxy for display.',
        'Mineral Commodity Summaries 2026',
        'U.S. Geological Survey',
        '2026-02-01',
        'USGS MCS gives public mineral commodity statistics used for terrestrial proxy references.',
        'USGS public-domain publication; confirm any third-party material notices.'
    );

update public.lunar_commodities as commodity
set
    name = seed.name,
    symbol = seed.symbol,
    category = seed.category,
    unit_name = seed.unit_name,
    unit_symbol = seed.unit_symbol,
    description = seed.description,
    lunar_relevance = seed.lunar_relevance,
    status = 'active'::public.commodity_record_status,
    update_cadence = seed.update_cadence,
    confidence_label =
        seed.confidence_label::public.commodity_confidence_label,
    display_order = seed.display_order,
    updated_at = now()
from lunar_commodity_ticker_seed as seed
where lower(commodity.slug) = seed.slug;

insert into public.lunar_commodities (
    slug,
    name,
    symbol,
    category,
    unit_name,
    unit_symbol,
    description,
    lunar_relevance,
    status,
    update_cadence,
    confidence_label,
    display_order
)
select
    seed.slug,
    seed.name,
    seed.symbol,
    seed.category,
    seed.unit_name,
    seed.unit_symbol,
    seed.description,
    seed.lunar_relevance,
    'active'::public.commodity_record_status,
    seed.update_cadence,
    seed.confidence_label::public.commodity_confidence_label,
    seed.display_order
from lunar_commodity_ticker_seed as seed
where not exists (
    select 1
    from public.lunar_commodities as commodity
    where lower(commodity.slug) = seed.slug
);

update public.lunar_commodity_proxy_models as proxy_model
set
    pricing_method = seed.pricing_method::public.commodity_pricing_method,
    formula_markdown =
        'Public ticker uses the latest displayable source-backed observation as a terrestrial or industrial proxy until lunar spot markets exist.',
    assumptions = jsonb_build_object(
        'ticker_seed', '2026-06 public commodity ticker',
        'basis', seed.source_note,
        'source_url', seed.source_url,
        'lunar_adjustment', 'none',
        'exclusions', jsonb_build_array(
            'lunar extraction cost',
            'launch or surface logistics',
            'processing losses',
            'property-rights risk',
            'customer exclusivity premium'
        )
    ),
    output_unit_symbol = seed.unit_symbol,
    update_cadence = seed.update_cadence,
    confidence_label =
        seed.confidence_label::public.commodity_confidence_label,
    status = 'active'::public.commodity_record_status,
    effective_from = '2026-06-26'::date,
    effective_to = null,
    updated_at = now()
from lunar_commodity_ticker_seed as seed
join public.lunar_commodities as commodity
    on lower(commodity.slug) = seed.slug
where proxy_model.commodity_id = commodity.id
    and lower(proxy_model.model_name) = 'public ticker proxy v1';

insert into public.lunar_commodity_proxy_models (
    commodity_id,
    model_name,
    pricing_method,
    formula_markdown,
    assumptions,
    output_unit_symbol,
    update_cadence,
    confidence_label,
    status,
    effective_from
)
select
    commodity.id,
    'Public ticker proxy v1',
    seed.pricing_method::public.commodity_pricing_method,
    'Public ticker uses the latest displayable source-backed observation as a terrestrial or industrial proxy until lunar spot markets exist.',
    jsonb_build_object(
        'ticker_seed', '2026-06 public commodity ticker',
        'basis', seed.source_note,
        'source_url', seed.source_url,
        'lunar_adjustment', 'none',
        'exclusions', jsonb_build_array(
            'lunar extraction cost',
            'launch or surface logistics',
            'processing losses',
            'property-rights risk',
            'customer exclusivity premium'
        )
    ),
    seed.unit_symbol,
    seed.update_cadence,
    seed.confidence_label::public.commodity_confidence_label,
    'active'::public.commodity_record_status,
    '2026-06-26'::date
from lunar_commodity_ticker_seed as seed
join public.lunar_commodities as commodity
    on lower(commodity.slug) = seed.slug
where not exists (
    select 1
    from public.lunar_commodity_proxy_models as existing_proxy_model
    where existing_proxy_model.commodity_id = commodity.id
        and lower(existing_proxy_model.model_name) =
            'public ticker proxy v1'
);

update public.lunar_commodity_price_observations as observation
set
    proxy_model_id = proxy_model.id,
    price_value = seed.price_value,
    currency_code = 'USD',
    unit_symbol = seed.unit_symbol,
    source_url = seed.source_url,
    source_retrieved_at = '2026-06-26 00:00:00+00'::timestamptz,
    confidence_label =
        seed.confidence_label::public.commodity_confidence_label,
    notes = seed.source_note,
    is_displayable = true,
    updated_at = now()
from lunar_commodity_ticker_seed as seed
join public.lunar_commodities as commodity
    on lower(commodity.slug) = seed.slug
join lateral (
    select existing_proxy_model.id
    from public.lunar_commodity_proxy_models as existing_proxy_model
    where existing_proxy_model.commodity_id = commodity.id
        and lower(existing_proxy_model.model_name) =
            'public ticker proxy v1'
    order by existing_proxy_model.created_at desc
    limit 1
) as proxy_model on true
where observation.commodity_id = commodity.id
    and observation.observed_at =
        '2026-06-26 00:00:00+00'::timestamptz
    and lower(observation.source_name) = lower(seed.source_name);

insert into public.lunar_commodity_price_observations (
    commodity_id,
    proxy_model_id,
    observed_at,
    price_value,
    currency_code,
    unit_symbol,
    source_name,
    source_url,
    source_retrieved_at,
    confidence_label,
    notes,
    is_displayable
)
select
    commodity.id,
    proxy_model.id,
    '2026-06-26 00:00:00+00'::timestamptz,
    seed.price_value,
    'USD',
    seed.unit_symbol,
    seed.source_name,
    seed.source_url,
    '2026-06-26 00:00:00+00'::timestamptz,
    seed.confidence_label::public.commodity_confidence_label,
    seed.source_note,
    true
from lunar_commodity_ticker_seed as seed
join public.lunar_commodities as commodity
    on lower(commodity.slug) = seed.slug
join lateral (
    select existing_proxy_model.id
    from public.lunar_commodity_proxy_models as existing_proxy_model
    where existing_proxy_model.commodity_id = commodity.id
        and lower(existing_proxy_model.model_name) =
            'public ticker proxy v1'
    order by existing_proxy_model.created_at desc
    limit 1
) as proxy_model on true
where not exists (
    select 1
    from public.lunar_commodity_price_observations as observation
    where observation.commodity_id = commodity.id
        and observation.observed_at =
            '2026-06-26 00:00:00+00'::timestamptz
        and lower(observation.source_name) = lower(seed.source_name)
);

insert into public.lunar_commodity_source_citations (
    commodity_id,
    proxy_model_id,
    price_observation_id,
    citation_type,
    title,
    publisher,
    url,
    published_at,
    retrieved_at,
    summary,
    license_notes,
    display_order
)
select
    commodity.id,
    proxy_model.id,
    observation.id,
    'ticker_price_source',
    seed.citation_title,
    seed.citation_publisher,
    seed.source_url,
    seed.citation_published_at,
    '2026-06-26 00:00:00+00'::timestamptz,
    seed.citation_summary,
    seed.license_notes,
    10
from lunar_commodity_ticker_seed as seed
join public.lunar_commodities as commodity
    on lower(commodity.slug) = seed.slug
join lateral (
    select existing_proxy_model.id
    from public.lunar_commodity_proxy_models as existing_proxy_model
    where existing_proxy_model.commodity_id = commodity.id
        and lower(existing_proxy_model.model_name) =
            'public ticker proxy v1'
    order by existing_proxy_model.created_at desc
    limit 1
) as proxy_model on true
join public.lunar_commodity_price_observations as observation
    on observation.commodity_id = commodity.id
    and observation.observed_at =
        '2026-06-26 00:00:00+00'::timestamptz
    and lower(observation.source_name) = lower(seed.source_name)
where not exists (
    select 1
    from public.lunar_commodity_source_citations as citation
    where citation.price_observation_id = observation.id
        and lower(citation.title) = lower(seed.citation_title)
        and citation.citation_type = 'ticker_price_source'
);
