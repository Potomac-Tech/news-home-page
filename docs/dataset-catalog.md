# Dataset Catalog

Task 037 adds the first public dataset catalog foundation. It is scoped to the
canonical Potomac Supabase project ref `xlpkdoeldtlhearqajat`.

## Database Objects

- `dataset_catalog_entries`: catalog-level dataset records for public
  NASA/science archives, Potomac proprietary datasets, partner datasets, and
  derived models.
- `dataset_catalog_sources`: source metadata and citation records attached to
  catalog entries.

Catalog entries include availability state, tier requirement, provider/owner,
mission and instrument context, data type labels, source landing URL, source
license notes, sample/demo flags, sample/demo URLs, release target date, and
publication state.

## Seeded Catalog Entries

- NASA PDS Lunar Orbital Data Explorer.
- LRO LROC Reduced Data Records.
- USGS Unified Geologic Map of the Moon.
- Potomac Lunar Site Intelligence Demo.
- Potomac Lunar Economy Benchmark Pack.

## Access Model

Published catalog entries are readable by public visitors. Public source rows
are readable when their parent catalog entry is published. Editors, analysts,
and admins can read and manage draft, published, and archived catalog records.

This task does not expose raw paid datasets. Tier requirements are catalog
metadata only. Task 038 should add release-state calculations and one-year
exclusivity behavior.

## UI

- `/datasets`: public dataset catalog route.
- The route loads live Supabase catalog records when Potomac public Supabase
  configuration is available.
- Without Supabase configuration, the route renders the same curated seeded
  entries as local fallback content.
- The route includes DataCatalog/Dataset structured data and is listed in the
  sitemap.
