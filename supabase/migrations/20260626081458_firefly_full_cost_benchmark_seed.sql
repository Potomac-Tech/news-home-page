create temporary table firefly_benchmark_sources (
    source_key text primary key,
    title text not null,
    publisher text not null,
    document_type text not null,
    url text not null,
    published_at date,
    retrieved_at timestamptz not null,
    citation_text text not null,
    summary text not null,
    license_notes text not null,
    confidence_label text not null,
    display_order integer not null
) on commit drop;

insert into firefly_benchmark_sources (
    source_key,
    title,
    publisher,
    document_type,
    url,
    published_at,
    retrieved_at,
    citation_text,
    summary,
    license_notes,
    confidence_label,
    display_order
) values
    (
        'nasa_2021_firefly_clps_award',
        'NASA Selects Firefly Aerospace for Artemis Commercial Moon Delivery in 2023',
        'NASA',
        'news_release',
        'https://www.nasa.gov/news-release/nasa-selects-firefly-aerospace-for-artemis-commercial-moon-delivery-in-2023/',
        '2021-02-04',
        '2026-06-26 00:00:00+00'::timestamptz,
        'NASA release 21-012 announcing approximately $93.3M for Firefly to deliver 10 science investigations and technology demonstrations.',
        'Establishes the original Firefly Blue Ghost CLPS award and payload manifest context.',
        'Public NASA page; cite NASA release context.',
        'medium',
        10
    ),
    (
        'ap_2025_firefly_delivery_payload_cost',
        '2 private lunar landers head toward the moon in a roundabout journey',
        'Associated Press',
        'news_report',
        'https://apnews.com/article/moon-landings-nasa-japan-spacex-8b6e29d17c463e8760c9baa2a75db54a',
        '2025-01-15',
        '2026-06-26 00:00:00+00'::timestamptz,
        'AP reported NASA paying $101M to Firefly for the mission and another $44M for the experiments.',
        'Provides the full NASA-paid delivery plus payload/experiment cost basis used for the benchmark baseline.',
        'AP content terms apply; quote only short excerpts and keep derived values attributed.',
        'medium',
        20
    ),
    (
        'firefly_2025_data_addendum',
        'Firefly Aerospace Receives $10 Million NASA Contract Addendum for Blue Ghost Mission 1 Lunar Data',
        'Firefly Aerospace',
        'company_release',
        'https://fireflyspace.com/news/firefly-aerospace-receives-10-million-nasa-contract-addendum-for-blue-ghost-mission-1-lunar-data/',
        '2025-09-22',
        '2026-06-26 00:00:00+00'::timestamptz,
        'Firefly announced a $10M NASA CLPS contract addendum for additional Blue Ghost Mission 1 lunar data.',
        'Establishes the data addendum that must be included but not used alone as the benchmark.',
        'Company public release; use with NASA/AP corroboration where possible.',
        'medium',
        30
    ),
    (
        'nasa_clps_deliveries_bg1',
        'Commercial Lunar Payload Services (CLPS) Deliveries',
        'NASA Science',
        'reference_page',
        'https://science.nasa.gov/lunar-science/clps-deliveries/',
        null,
        '2026-06-26 00:00:00+00'::timestamptz,
        'NASA Science lists Firefly Blue Ghost 1 TO19D as a CLPS delivery with 10 NASA science payloads to Mare Crisium.',
        'Supports the interpretation of the payload/experiment cost as NASA CLPS/PRISM science payload context.',
        'Public NASA page; verify page date before external reuse.',
        'medium',
        40
    );

insert into public.lunar_economy_model_versions (
    version_key,
    version_name,
    status,
    summary,
    methodology_markdown,
    model_scope,
    currency_code,
    valid_from,
    is_public,
    published_at
)
select
    'firefly-blue-ghost-full-cost-benchmark-v1',
    'Firefly Blue Ghost full NASA-paid cost benchmark v1',
    'active'::public.lunar_economy_record_status,
    'Benchmark for lunar surface data that counts the NASA-paid delivery mission, science payload/PRISM cost basis, and the later Blue Ghost data addendum.',
    'Baseline benchmark = $101M Firefly delivery mission + $44M NASA science/technology payload cost basis + $10M Blue Ghost data addendum = $155M. The model also stores a lower reference using the original $93.3M NASA award announcement, yielding $147.3M. The benchmark must not be calculated from only the $10M data addendum.',
    'lunar_surface_data_benchmark',
    'USD',
    '2026-06-26',
    true,
    '2026-06-26 00:00:00+00'::timestamptz
where not exists (
    select 1
    from public.lunar_economy_model_versions model_version
    where lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
);

update public.lunar_economy_model_versions as model_version
set
    version_name = 'Firefly Blue Ghost full NASA-paid cost benchmark v1',
    status = 'active'::public.lunar_economy_record_status,
    summary = 'Benchmark for lunar surface data that counts the NASA-paid delivery mission, science payload/PRISM cost basis, and the later Blue Ghost data addendum.',
    methodology_markdown = 'Baseline benchmark = $101M Firefly delivery mission + $44M NASA science/technology payload cost basis + $10M Blue Ghost data addendum = $155M. The model also stores a lower reference using the original $93.3M NASA award announcement, yielding $147.3M. The benchmark must not be calculated from only the $10M data addendum.',
    model_scope = 'lunar_surface_data_benchmark',
    currency_code = 'USD',
    valid_from = '2026-06-26',
    valid_to = null,
    is_public = true,
    published_at = '2026-06-26 00:00:00+00'::timestamptz,
    updated_at = now()
where lower(model_version.version_key) =
    'firefly-blue-ghost-full-cost-benchmark-v1';

update public.lunar_economy_source_documents as source_document
set
    title = seed.title,
    publisher = seed.publisher,
    document_type = seed.document_type,
    url = seed.url,
    published_at = seed.published_at,
    retrieved_at = seed.retrieved_at,
    citation_text = seed.citation_text,
    summary = seed.summary,
    license_notes = seed.license_notes,
    review_status = 'approved'::public.lunar_economy_source_review_status,
    confidence_label =
        seed.confidence_label::public.lunar_economy_confidence_label,
    is_public = true,
    display_order = seed.display_order,
    updated_at = now()
from firefly_benchmark_sources seed
join public.lunar_economy_model_versions model_version
    on lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
where source_document.model_version_id = model_version.id
    and lower(source_document.source_key) = seed.source_key;

insert into public.lunar_economy_source_documents (
    model_version_id,
    source_key,
    title,
    publisher,
    document_type,
    url,
    published_at,
    retrieved_at,
    citation_text,
    summary,
    license_notes,
    review_status,
    confidence_label,
    is_public,
    display_order
)
select
    model_version.id,
    seed.source_key,
    seed.title,
    seed.publisher,
    seed.document_type,
    seed.url,
    seed.published_at,
    seed.retrieved_at,
    seed.citation_text,
    seed.summary,
    seed.license_notes,
    'approved'::public.lunar_economy_source_review_status,
    seed.confidence_label::public.lunar_economy_confidence_label,
    true,
    seed.display_order
from firefly_benchmark_sources seed
join public.lunar_economy_model_versions model_version
    on lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
where not exists (
    select 1
    from public.lunar_economy_source_documents existing_source
    where existing_source.model_version_id = model_version.id
        and lower(existing_source.source_key) = seed.source_key
);

create temporary table firefly_benchmark_assumptions (
    assumption_key text primary key,
    assumption_name text not null,
    category text not null,
    value_numeric numeric(24, 6),
    value_text text,
    unit_name text,
    unit_symbol text,
    confidence_label text not null,
    source_note text not null,
    rationale text not null,
    display_order integer not null,
    source_keys text[] not null
) on commit drop;

insert into firefly_benchmark_assumptions (
    assumption_key,
    assumption_name,
    category,
    value_numeric,
    value_text,
    unit_name,
    unit_symbol,
    confidence_label,
    source_note,
    rationale,
    display_order,
    source_keys
) values
    (
        'original_mission_delivery_cost_usd',
        'Original Blue Ghost mission delivery cost',
        'cost_basis',
        101000000,
        null,
        'U.S. dollars',
        'USD',
        'medium',
        'Baseline uses AP-reported NASA payment of $101M to Firefly for the mission delivery.',
        'This is the mission-cost component that prevents the benchmark from collapsing to the $10M data addendum alone.',
        10,
        array[
            'ap_2025_firefly_delivery_payload_cost',
            'nasa_2021_firefly_clps_award'
        ]
    ),
    (
        'original_award_reference_usd',
        'Original NASA task-order award reference',
        'cost_basis_reference',
        93300000,
        null,
        'U.S. dollars',
        'USD',
        'medium',
        'NASA announced approximately $93.3M for the original Firefly CLPS delivery award in 2021.',
        'Stored as a lower reference for the delivery component; the daily benchmark baseline uses the later $101M payment figure.',
        20,
        array['nasa_2021_firefly_clps_award']
    ),
    (
        'prism_payload_cost_usd',
        'NASA science payload and PRISM cost basis',
        'cost_basis',
        44000000,
        null,
        'U.S. dollars',
        'USD',
        'medium',
        'AP reported another $44M for the experiments; NASA CLPS pages identify Blue Ghost Mission 1 as delivering 10 NASA science payloads.',
        'This approximates the PRISM/science payload contracts that generated the lunar data, separate from delivery services.',
        30,
        array[
            'ap_2025_firefly_delivery_payload_cost',
            'nasa_clps_deliveries_bg1'
        ]
    ),
    (
        'data_addendum_usd',
        'Blue Ghost additional lunar data addendum',
        'cost_basis',
        10000000,
        null,
        'U.S. dollars',
        'USD',
        'medium',
        'Firefly announced a $10M NASA contract addendum for additional Blue Ghost Mission 1 lunar data.',
        'This is included as an incremental data purchase but is not a stand-alone benchmark for the full NASA-paid cost of obtaining the data.',
        40,
        array['firefly_2025_data_addendum']
    ),
    (
        'full_nasa_paid_cost_baseline_usd',
        'Full NASA-paid data benchmark baseline',
        'derived_total',
        155000000,
        null,
        'U.S. dollars',
        'USD',
        'medium',
        'Calculated as $101M mission delivery + $44M PRISM/science payload cost + $10M data addendum.',
        'Represents the baseline estimate of what NASA paid across mission delivery, payload generation, and additional data acquisition.',
        50,
        array[
            'ap_2025_firefly_delivery_payload_cost',
            'firefly_2025_data_addendum',
            'nasa_clps_deliveries_bg1'
        ]
    ),
    (
        'full_nasa_paid_cost_lower_reference_usd',
        'Full NASA-paid data benchmark lower reference',
        'derived_total',
        147300000,
        null,
        'U.S. dollars',
        'USD',
        'low',
        'Calculated as $93.3M original NASA award reference + $44M PRISM/science payload cost + $10M data addendum.',
        'Provides a conservative lower reference when using the 2021 award announcement rather than the later AP-reported mission payment figure.',
        60,
        array[
            'nasa_2021_firefly_clps_award',
            'ap_2025_firefly_delivery_payload_cost',
            'firefly_2025_data_addendum'
        ]
    ),
    (
        'benchmark_formula',
        'Benchmark formula',
        'methodology',
        null,
        'Firefly full-cost benchmark = delivery mission cost + PRISM/science payload cost + data addendum. Do not use the data addendum by itself.',
        null,
        null,
        'medium',
        'Formula follows the Firefly benchmark rule in Potomac automation memory.',
        'The formula forces total NASA-paid cost accounting before comparing lunar surface data economics.',
        70,
        array[
            'nasa_2021_firefly_clps_award',
            'ap_2025_firefly_delivery_payload_cost',
            'firefly_2025_data_addendum',
            'nasa_clps_deliveries_bg1'
        ]
    );

update public.lunar_economy_model_assumptions as assumption
set
    assumption_name = seed.assumption_name,
    category = seed.category,
    value_numeric = seed.value_numeric,
    value_text = seed.value_text,
    unit_name = seed.unit_name,
    unit_symbol = seed.unit_symbol,
    confidence_label =
        seed.confidence_label::public.lunar_economy_confidence_label,
    is_public = true,
    source_note = seed.source_note,
    rationale = seed.rationale,
    display_order = seed.display_order,
    updated_at = now()
from firefly_benchmark_assumptions seed
join public.lunar_economy_model_versions model_version
    on lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
where assumption.model_version_id = model_version.id
    and lower(assumption.assumption_key) = seed.assumption_key;

insert into public.lunar_economy_model_assumptions (
    model_version_id,
    assumption_key,
    assumption_name,
    category,
    value_numeric,
    value_text,
    unit_name,
    unit_symbol,
    confidence_label,
    is_public,
    source_note,
    rationale,
    display_order
)
select
    model_version.id,
    seed.assumption_key,
    seed.assumption_name,
    seed.category,
    seed.value_numeric,
    seed.value_text,
    seed.unit_name,
    seed.unit_symbol,
    seed.confidence_label::public.lunar_economy_confidence_label,
    true,
    seed.source_note,
    seed.rationale,
    seed.display_order
from firefly_benchmark_assumptions seed
join public.lunar_economy_model_versions model_version
    on lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
where not exists (
    select 1
    from public.lunar_economy_model_assumptions existing_assumption
    where existing_assumption.model_version_id = model_version.id
        and lower(existing_assumption.assumption_key) = seed.assumption_key
);

insert into public.lunar_economy_assumption_sources (
    assumption_id,
    source_document_id,
    relationship_type,
    notes,
    display_order
)
select
    assumption.id,
    source_document.id,
    'supports',
    'Firefly benchmark source mapping for '
        || seed.assumption_key,
    source_document.display_order
from firefly_benchmark_assumptions seed
join public.lunar_economy_model_versions model_version
    on lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
join public.lunar_economy_model_assumptions assumption
    on assumption.model_version_id = model_version.id
    and lower(assumption.assumption_key) = seed.assumption_key
cross join lateral unnest(seed.source_keys) as source_key(value)
join public.lunar_economy_source_documents source_document
    on source_document.model_version_id = model_version.id
    and lower(source_document.source_key) = source_key.value
where not exists (
    select 1
    from public.lunar_economy_assumption_sources existing_link
    where existing_link.assumption_id = assumption.id
        and existing_link.source_document_id = source_document.id
        and lower(existing_link.relationship_type) = 'supports'
);

update public.lunar_economy_scenario_estimates as scenario
set
    scenario_name = 'Baseline full NASA-paid Firefly data benchmark',
    scenario_type = 'baseline'::public.lunar_economy_scenario_type,
    estimate_value = 155000000,
    range_low_value = 147300000,
    range_high_value = 155000000,
    currency_code = 'USD',
    confidence_score = 72,
    confidence_label = 'medium'::public.lunar_economy_confidence_label,
    methodology_notes = 'Includes Firefly delivery mission cost, NASA science payload/PRISM cost basis, and the Blue Ghost data addendum. Excludes any non-NASA commercial cost recovery and does not treat the $10M data addendum as the full benchmark.',
    primary_source_document_id = source_document.id,
    publication_status =
        'published'::public.lunar_economy_publication_status,
    is_public = true,
    updated_at = now()
from public.lunar_economy_model_versions model_version
join public.lunar_economy_source_documents source_document
    on source_document.model_version_id = model_version.id
    and lower(source_document.source_key) =
        'ap_2025_firefly_delivery_payload_cost'
where scenario.model_version_id = model_version.id
    and lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
    and lower(scenario.scenario_key) =
        'baseline_full_nasa_paid_cost'
    and scenario.estimate_date = '2026-06-26'::date;

insert into public.lunar_economy_scenario_estimates (
    model_version_id,
    scenario_key,
    scenario_name,
    scenario_type,
    estimate_date,
    estimate_value,
    range_low_value,
    range_high_value,
    currency_code,
    confidence_score,
    confidence_label,
    methodology_notes,
    primary_source_document_id,
    publication_status,
    is_public
)
select
    model_version.id,
    'baseline_full_nasa_paid_cost',
    'Baseline full NASA-paid Firefly data benchmark',
    'baseline'::public.lunar_economy_scenario_type,
    '2026-06-26'::date,
    155000000,
    147300000,
    155000000,
    'USD',
    72,
    'medium'::public.lunar_economy_confidence_label,
    'Includes Firefly delivery mission cost, NASA science payload/PRISM cost basis, and the Blue Ghost data addendum. Excludes any non-NASA commercial cost recovery and does not treat the $10M data addendum as the full benchmark.',
    source_document.id,
    'published'::public.lunar_economy_publication_status,
    true
from public.lunar_economy_model_versions model_version
join public.lunar_economy_source_documents source_document
    on source_document.model_version_id = model_version.id
    and lower(source_document.source_key) =
        'ap_2025_firefly_delivery_payload_cost'
where lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
    and not exists (
        select 1
        from public.lunar_economy_scenario_estimates existing_scenario
        where existing_scenario.model_version_id = model_version.id
            and lower(existing_scenario.scenario_key) =
                'baseline_full_nasa_paid_cost'
            and existing_scenario.estimate_date = '2026-06-26'::date
    );

update public.lunar_economy_daily_outputs as daily_output
set
    scenario_estimate_id = scenario.id,
    headline_value = 155000000,
    range_low_value = 147300000,
    range_high_value = 155000000,
    currency_code = 'USD',
    confidence_score = 72,
    confidence_label = 'medium'::public.lunar_economy_confidence_label,
    methodology_note = 'Firefly benchmark uses full NASA-paid cost basis: delivery mission + PRISM/science payload cost + data addendum.',
    source_count = 4,
    freshness_at = '2026-06-26 00:00:00+00'::timestamptz,
    publication_status =
        'published'::public.lunar_economy_publication_status,
    is_public = true,
    updated_at = now()
from public.lunar_economy_model_versions model_version
join public.lunar_economy_scenario_estimates scenario
    on scenario.model_version_id = model_version.id
    and lower(scenario.scenario_key) =
        'baseline_full_nasa_paid_cost'
    and scenario.estimate_date = '2026-06-26'::date
where daily_output.model_version_id = model_version.id
    and lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
    and daily_output.output_date = '2026-06-26'::date
    and lower(daily_output.scenario_key) =
        'baseline_full_nasa_paid_cost';

insert into public.lunar_economy_daily_outputs (
    model_version_id,
    scenario_estimate_id,
    output_date,
    scenario_key,
    headline_value,
    range_low_value,
    range_high_value,
    currency_code,
    confidence_score,
    confidence_label,
    methodology_note,
    source_count,
    freshness_at,
    publication_status,
    is_public
)
select
    model_version.id,
    scenario.id,
    '2026-06-26'::date,
    'baseline_full_nasa_paid_cost',
    155000000,
    147300000,
    155000000,
    'USD',
    72,
    'medium'::public.lunar_economy_confidence_label,
    'Firefly benchmark uses full NASA-paid cost basis: delivery mission + PRISM/science payload cost + data addendum.',
    4,
    '2026-06-26 00:00:00+00'::timestamptz,
    'published'::public.lunar_economy_publication_status,
    true
from public.lunar_economy_model_versions model_version
join public.lunar_economy_scenario_estimates scenario
    on scenario.model_version_id = model_version.id
    and lower(scenario.scenario_key) =
        'baseline_full_nasa_paid_cost'
    and scenario.estimate_date = '2026-06-26'::date
where lower(model_version.version_key) =
        'firefly-blue-ghost-full-cost-benchmark-v1'
    and not exists (
        select 1
        from public.lunar_economy_daily_outputs existing_output
        where existing_output.model_version_id = model_version.id
            and existing_output.output_date = '2026-06-26'::date
            and lower(existing_output.scenario_key) =
                'baseline_full_nasa_paid_cost'
    );
