# Supabase Production Verification

Verified 2026-07-14 against the canonical project `xlpkdoeldtlhearqajat`. The retired project reference was not used.

## Migration reconciliation

- The repository contains 73 named SQL migrations and production contains the same 73 migration names.
- Production also retains five unnamed legacy migrations from 2025. These predate the current repository migration series.
- Several migrations applied through MCP have a production timestamp later than their local filename timestamp. Matching by migration name and schema evidence confirms that these are applied migrations, not missing changes.
- No production-intended local migration name is absent remotely.

### Local test seed remediation

`seed_local_test_users` had already been applied to production before this audit, despite being intended only for local QA. Because it contained deterministic users and a shared password, the tracked `remove_production_local_test_users` remediation deleted the four seeded Auth identities and the deterministic test organization. Verification returned zero matching users and zero matching organizations.

The historical migration entry remains because deleting or rewriting production migration history would create unsafe drift. The seed must not be reapplied. Future production role testing requires purpose-built QA accounts created through Supabase Auth with unique credentials and normal approval/entitlement workflows.

## RLS structural audit

The production catalog was queried through `pg_class` and `pg_policies`. Every representative table below has RLS enabled and at least one read policy. Member-owned write surfaces also have insert/update/delete or all-command policies.

| Area | Representative table | RLS | Read policy | Required write policy |
| --- | --- | --- | --- | --- |
| Article bodies | `editorial_article_bodies` | Pass | Pass | Staff-managed |
| Search | `intelligence_search_records` | Pass | Pass | Staff-managed |
| Saved work | `member_watchlists` | Pass | Pass | Pass |
| Alerts | `member_alert_rules` | Pass | Pass | Pass |
| Direct chat | `member_chat_messages` | Pass | Pass | Pass |
| Forums | `member_forum_posts` | Pass | Pass | Pass |
| RFQs | `rfq_posts` | Pass | Pass | Pass |
| Lunar missions | `lunar_missions` | Pass | Pass | Staff-managed |
| Procurement | `lunar_procurements` | Pass | Pass | Staff-managed |
| Regulatory | `lunar_regulatory_records` | Pass | Pass | Staff-managed |
| Companies | `lunar_companies` | Pass | Pass | Staff-managed |
| Calculators | `lunar_calculator_saved_runs` | Pass | Pass | Pass |
| Datasets | `dataset_catalog_entries` | Pass | Pass | Staff-managed |
| Test-data uploads | `experimental_test_data_uploads` | Pass | Pass | Pass |
| Developer API keys | `developer_api_keys` | Pass | Pass | Pass |
| Developer exports | `developer_export_jobs` | Pass | Pass | Pass |
| Audit logs | `access_audit_events` | Pass | Pass | Controlled writer policies |

This is a structural policy check, not a substitute for authenticated browser and Data API tests under each role.

## Authenticated role journeys

Six dedicated QA identities now cover Explorer, Scout, Cabeus Council/organization admin, editor, analyst, and admin. Each identity was created through Supabase Auth with a unique random credential, auto-confirmed in the canonical dashboard, assigned an approved profile and completed profile record, and given only the normalized roles and entitlements required for its persona. The Cabeus Council identity belongs to a non-billable QA organization with an active organization-level Cabeus Council entitlement. The Scout and Cabeus Council entitlements expire after 30 days so stale test access does not remain open indefinitely.

Credentials were held only for the active QA session, then the sessions were revoked and the in-memory values were cleared. They are not stored in the repository, migration history, task documentation, user metadata, or any `NEXT_PUBLIC_*` value. The unsafe deterministic local seed remains removed and must not be reapplied.

Authenticated Data API verification completed successfully:

- All six personas signed in through the canonical Auth API.
- Each persona could read its own approved profile, completed-profile record, normalized role assignments, and applicable entitlement under RLS.
- The suite issued 102 authenticated read requests: every persona queried the representative table for each of the 17 required protected areas, with no HTTP or PostgREST failures.
- The suite issued 25 allowed and denied write checks covering article bodies, search, saved work, alerts, direct chat, forums, RFQs, lunar missions, procurement, regulatory records, companies, calculators, datasets, test-data uploads, developer API keys, developer exports, and audit logs. All 25 matched the expected policy decision.
- Explorer was denied paid saved-work, alert, RFQ, upload, developer-platform, and Scout-calculator writes. Scout was allowed the corresponding paid-owner workflows. Members could write only to prepared conversations and forums in which they had access. Editor, analyst, and admin writes were accepted only on their intended staff surfaces.
- Draft RFQ creation was verified with `return=minimal`; draft rows are intentionally not selectable through the RFQ read policy, so `return=representation` correctly does not expose the new row.
- All temporary articles, messages, posts, RFQs, saved work, alerts, uploads, API/export records, calculator records, intelligence records, and audit events created by the suite were removed. A final cleanup query returned zero remaining temporary content rows.

## Completed production checks

- Confirmed private developer export Storage bucket.
- Confirmed service-only developer authorization and webhook-delivery RPCs.
- Confirmed webhook Vault integration and server worker secrets without reading or recording secret values.
- Confirmed five-minute `process-developer-jobs` Cron schedule.
- Invoked the signed Supabase-to-Cloudflare worker path and received HTTP 200.
- Ran Supabase security advisors; no new finding was associated with the developer runtime changes. Existing informational notices on intentionally inaccessible private-schema tables remain.
