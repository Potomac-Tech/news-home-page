# Codex Automation Memory

This file is the persistent operating memory for the Potomac News & Intelligence automation. Every automation run must read this file before reading the task list.

## Canonical Project Facts

- Workspace: `C:\Users\JacobMatthews\Documents\Potomac Website`
- Task list: `docs/potomac-news-intelligence-tasks.md`
- Canonical Supabase project ref: `xlpkdoeldtlhearqajat`
- Never use Supabase project ref `nwoluvjdojzayozyzlob`; it is the wrong project for this workspace.
- The current product direction is a Potomac-branded, news-first lunar industry intelligence terminal using Next.js and Supabase.

## Run Order

1. Read this memory file.
2. Read `docs/potomac-news-intelligence-tasks.md`.
3. Find the first unchecked task, working from the top of the file downward.
4. Complete as many unchecked tasks as practical in the current run.
5. After each completed task, update its checkbox to `[x]`, add a short non-technical summary, add verification results, and commit that task before starting the next task.

## Task Completion Rules

- Preserve unrelated user changes.
- Keep implementation scope limited to the active task and its direct dependencies.
- If a task is complete, mark it `[x]`.
- Fill `Non-technical summary` with a short explanation that a non-technical stakeholder can understand.
- Fill `Verification` with test/build/lint results, manual verification notes, or a clear explanation of why verification could not be run.
- If a task is blocked, leave it unchecked and fill `Blocked reason` with the specific blocker and next needed action.
- Do not mark blocked tasks complete.
- Commit after each completed task with a clear task-specific commit message.

## Supabase Rules

- Use Supabase Auth for login, sessions, member identity, and access control.
- Use Supabase Postgres for application data.
- Use Supabase Storage for uploads and downloadable methodology/source files.
- Use Row Level Security on tables exposed through Supabase APIs.
- Store authorization in normalized tables or trusted app metadata, not in user-editable metadata.
- Use Supabase Edge Functions or scheduled jobs where appropriate for feed ingestion, economy recalculation, data-market extraction, and notifications.
- Before making schema changes, follow the Supabase skill guidance: check current documentation, prefer iterative SQL through MCP/CLI before creating clean migrations, and verify changes.

## Firefly Benchmark Rule

The Firefly lunar surface data benchmark must estimate the full NASA-paid cost to obtain the data. The model must include:

- Original mission cost: approximately `$100M`
- Data addendum: `$10M`
- PRISM contracts: approximately `$45M`

Do not calculate the benchmark from only the `$10M` data addendum.

## Product Rules

- Public pages should expose SEO/AEO-rich summaries, snippets, citations, and metadata.
- Members remain the user-facing and RBAC term for people with approved access; Explorer is the approved free base membership tier, Scout is the professional paid tier, and Command is the enterprise organization tier.
- Full article bodies require approved Explorer membership or higher.
- Early versions should focus on a lunar industry terminal: lunar news, lunar launches, satellites/spacecraft/landers, lunar procurements, lunar regulatory intelligence, lunar company profiles, lunar economy intelligence, and lunar mission calculators.
- Broader non-lunar space industry terminal functionality is a future nice-to-have and should not displace the lunar MVP unless explicitly requested.
- Approved Explorer, Scout, and Command members should have direct member-to-member chat with role-aware discovery, organization/privacy boundaries, reporting and blocking controls, moderation/audit trails, and notification support.
- Community workflow scope includes direct messages, moderated forums, and RFQ posting/response workflows.
- Scout membership is self-serve through Stripe at `$25k/user/year`.
- Scout and Command should include paid intelligence features such as exports, API access, webhooks, advanced alerts, and higher limits where appropriate.
- Command membership is organization-level and handled through manual sales/admin approval.
- Export-control, ITAR/EAR, CUI, and classified-content guardrails are not an MVP blocker, but they must be planned before production launch of uploads, chat, forums, RFQs, or user-generated marketplace content.
- The visual system should preserve Potomac's dark gray, gold, cream, and lunar command-center brand language.

## Requirements Matrix Additions

| ID | Area | Requirement | Access | Priority |
| --- | --- | --- | --- | --- |
| R-TIER-001 | Tiers | Product tiers are Explorer, Scout, and Command. Explorer is the approved free base membership, Scout maps to Professional, and Command maps to Enterprise. Users are still referred to as members in RBAC and user-facing copy where appropriate. | Public+ | P0 |
| R-SCOPE-001 | Lunar terminal scope | Early versions focus on a lunar industry terminal covering lunar news, launches, satellites/spacecraft/landers, procurements, regulatory intelligence, company profiles, mission calculators, datasets, and lunar economy intelligence. Broader space industry coverage remains future optional scope. | Public+ | P0 |
| R-MSG-001 | Direct member chat | Approved Explorer, Scout, and Command members can start and continue direct conversations, with role-aware discovery, organization-aware privacy controls, read/unread state, reporting/blocking, moderation review, audit logging, and future notification hooks. | Explorer+ | P1 |
| R-COMM-001 | Forums | Approved members can participate in moderated forums organized around lunar markets, missions, datasets, procurement, regulatory issues, and events. | Explorer+ | P1 |
| R-RFQ-001 | RFQs | Scout and Command members can post, browse, and respond to RFQs with moderation, audit logging, organization attribution, and entitlement-aware visibility. | Scout+ | P1 |
| R-SEARCH-001 | Search and command palette | Members can search across public/gated articles, events, lunar companies, datasets, data requests/offers, jobs, procurement, regulatory items, methodology sources, and dashboard modules, with a keyboard command palette for fast navigation. | Explorer+ | P0 |
| R-WATCH-001 | Watchlists and saved work | Scout and Command members can save articles, searches, companies, missions, procurements, regulatory items, datasets, and marketplace records to watchlists or reading lists. | Scout+ | P1 |
| R-ALERT-001 | Alerts and notifications | The platform supports an alerts center, in-app badges, and email notifications for watched lunar companies, missions, procurements, regulatory items, datasets, events, marketplace records, and Command intelligence. | Scout+ | P1 |
| R-DATAOPS-001 | Data operations trust layer | Dynamic intelligence modules must track data source registry entries, source license review status, freshness timestamps, citations, confidence labels, quality scores, and analyst review state. | Internal+ | P0 |
| R-LUNAR-001 | Lunar object tracking | The terminal tracks lunar launches, satellites, spacecraft, landers, payloads, mission status, launch windows, landing sites, operators, instruments, and source citations. | Explorer+ | P1 |
| R-LUNAR-002 | Lunar procurement and regulatory intelligence | The terminal tracks lunar-relevant procurements, awards, SBIR/STTR items, regulatory filings, comment periods, policy milestones, compliance guidance, and risk notes. | Scout+ | P1 |
| R-LUNAR-003 | Lunar company profiles | The terminal provides lunar company profiles with sectors, programs, contracts, facilities, leadership, financials where public or licensed, news, relationships, and comparison support. | Explorer+ | P1 |
| R-CALC-001 | Lunar mission calculators | The terminal includes calculators for lunar mission cost, launch windows, link budget, thermal/radiation/power budgets, and other lunar mission planning assumptions. | Explorer+ | P1 |
| R-API-001 | Paid exports and API | Scout and Command features include CSV/PDF exports, versioned API access, webhooks, developer documentation, usage limits, and audit logging where appropriate. | Scout+ | P1 |
| R-TRUST-001 | Legal and trust | Public and member surfaces include Terms, Privacy, Cookies, Accessibility, Data Safety, account deletion, cookie preferences, security baseline, accessibility testing, analytics, observability, and performance targets. | All | P0 |
