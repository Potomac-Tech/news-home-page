# Codex Automation Memory

This file is the persistent operating memory for the Potomac News & Intelligence automation. Every automation run must read this file before reading the task list.

## Canonical Project Facts

- Workspace: `C:\Users\JacobMatthews\Documents\Potomac Website`
- Task list: `docs/potomac-news-intelligence-tasks.md`
- Canonical Supabase project ref: `xlpkdoeldtlhearqajat`
- Never use Supabase project ref `nwoluvjdojzayozyzlob`; it is the wrong project for this workspace.
- The current product direction is a Potomac-branded, news-first lunar intelligence platform using Next.js and Supabase.

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
- Full article bodies require approved free Member access or higher.
- Approved Members should have access to member-to-member chat with role-aware discovery, organization/privacy boundaries, reporting and blocking controls, moderation/audit trails, and notification support.
- Scout membership is self-serve through Stripe at `$25k/user/year`.
- Command membership is organization-level and handled through manual sales/admin approval.
- The visual system should preserve Potomac's dark gray, gold, cream, and lunar command-center brand language.

## Requirements Matrix Additions

| ID | Area | Requirement | Access | Priority |
| --- | --- | --- | --- | --- |
| R-MSG-001 | Member chat | Approved Members can start and continue member-to-member conversations, with role-aware discovery, organization-aware privacy controls, read/unread state, reporting/blocking, moderation review, audit logging, and future notification hooks. | Member+ | P1 |
