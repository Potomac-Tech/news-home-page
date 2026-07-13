# Supabase Production Verification

Verified 2026-07-13 against the canonical project `xlpkdoeldtlhearqajat`. The retired project reference was not used.

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

## Role journey status

The production role model defines `member`, `scout`, `command_user`, `org_admin`, `editor`, `analyst`, and `admin` access. At verification time, production contained:

- zero approved member profiles;
- zero active role assignments; and
- zero active organization memberships.

Therefore, no secret-free, non-destructive authenticated accounts were available for the required role-by-role read/write journey tests. This portion remains blocked pending approved QA identities for Explorer, Scout, Command/organization admin, editor, analyst, and admin. Test accounts should use unique credentials, non-deliverable or controlled Potomac addresses, and explicit cleanup/rotation ownership.

## Completed production checks

- Confirmed private developer export Storage bucket.
- Confirmed service-only developer authorization and webhook-delivery RPCs.
- Confirmed webhook Vault integration and server worker secrets without reading or recording secret values.
- Confirmed five-minute `process-developer-jobs` Cron schedule.
- Invoked the signed Supabase-to-Cloudflare worker path and received HTTP 200.
- Ran Supabase security advisors; no new finding was associated with the developer runtime changes. Existing informational notices on intentionally inaccessible private-schema tables remain.
