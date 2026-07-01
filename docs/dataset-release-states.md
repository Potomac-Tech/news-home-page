# Dataset Release States

Task 038 adds release-state metadata and first-pass timing logic to the dataset
catalog.

## Release States

- `command_exclusive`: Command-only access is represented for at least one year
  after the exclusive access start timestamp.
- `scout_delayed`: A public demo or catalog teaser can be visible before a
  later Scout release date.
- `public_demo`: Public source-hosted data or a public demo is available now.
- `unavailable`: The catalog can show planned data categories while clearly
  marking that access is not available.

## Timing Fields

`dataset_catalog_entries` now stores:

- `exclusive_access_starts_at`
- `exclusive_access_ends_at`
- `scout_release_at`
- `public_release_at`
- `release_state_note`
- `unavailable_reason`

The migration enforces that `command_exclusive` entries have at least a one-year
exclusive window when both exclusive timestamps are present, and prevents
unavailable entries from omitting an unavailable reason.

## UI

`/datasets` renders the effective release state, exclusive window, Scout release
date, public/demo release date, and unavailable reason where applicable. The
display is catalog-level metadata only; it does not grant raw dataset access.
