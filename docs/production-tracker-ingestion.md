# Production Tracker Ingestion

`POST /api/internal/trackers/ingest` runs server-side ingestion for approved
public sources. It requires `TRACKER_INGESTION_SECRET` and accepts one JSON job:

- `launches`: Launch Library 2 hourly. Rows enter as drafts, retain
  existing publication status on refresh, and include a primary citation.
- `space-weather`: NOAA SWPC every 15 minutes. Published snapshots include
  source and retrieval timestamps plus calculated freshness states.
- `contract-awards`: USAspending every day at 06:23 UTC. Directly lunar
  contract candidates enter as drafts with an official citation and cited value.
- `stock-quotes`: Alpha Vantage `GLOBAL_QUOTE` in two five-symbol batches at
  22:15 and 22:17 UTC on weekdays. Free quotes are end-of-day values. The
  database refuses reservations above 20 calls per UTC day, leaving five calls
  below Alpha Vantage's 25-call free-tier ceiling.

Supabase Cron calls the endpoint through `pg_net`. The endpoint URL and bearer
secret are stored in Supabase Vault as `production_tracker_ingestion_url` and
`production_tracker_ingestion_secret`. The Cloudflare secret and Vault secret
must match. Never expose either through a `NEXT_PUBLIC_*` variable.

`ALPHA_VANTAGE_API_KEY` is a Cloudflare server-side secret. It is never stored
in Supabase, returned by the ingestion route, included in source URLs, or
exposed through a `NEXT_PUBLIC_*` variable.

Launch and contract ingestion do not auto-publish API output. An editor or admin
must complete review before members can read imported rows. Failed runs retain a
bounded error summary in the corresponding ingestion-run table.
