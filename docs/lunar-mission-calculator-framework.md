# Lunar Mission Calculator Framework

Task 061 adds the reusable database foundation for lunar mission planning
calculators.

## Migration

`supabase/migrations/20260701190220_lunar_mission_calculator_framework.sql`

## Tables

- `lunar_calculator_definitions` stores named calculators, categories,
  summaries, limitation notes, output units, confidence labels, publication
  state, display order, current version, freshness, analyst review state, and
  tier gates.
- `lunar_calculator_versions` stores version history, change summaries,
  formula manifests, input schemas, output schemas, lifecycle dates, and
  confidence labels.
- `lunar_calculator_assumptions` stores default assumptions, units, ranges,
  required flags, confidence labels, and calculator/version scoping.
- `lunar_calculator_formula_steps` stores ordered formula steps with input
  keys, output keys, output units, expressions, and plain-language
  explanations.
- `lunar_calculator_validation_rules` stores input validation rules, rule
  configuration, severity, and user-facing messages.
- `lunar_calculator_source_citations` stores source names, URLs, publishers,
  citation text, supported fields, license notes, review status, and
  confidence labels.
- `lunar_calculator_saved_runs` stores member-owned saved runs with inputs,
  outputs, assumption snapshots, formula snapshots, validation messages, and
  private or organization visibility.

## Access Model

Calculator definitions use `visibility_tier`:

- `public` calculators can be discovered publicly after publication.
- `explorer` calculators require approved Explorer membership or higher.
- `scout` calculators require Scout, Command, or staff access.
- `command` calculators require Command or staff access.

Saved runs use `minimum_saved_run_tier`, which defaults to Scout. Members can
see their own saved runs, organization members can see organization-scoped
runs, and staff can manage the framework.

Authorization uses normalized role assignments through private helper
functions. The migration does not use user-editable metadata for access
decisions.

## RLS and Grants

Every new public table has Row Level Security enabled. The migration includes
explicit Data API read grants for `anon` and `authenticated`, authenticated
write grants for staff-managed framework tables, authenticated saved-run
grants, and full `service_role` access for trusted backend work. This follows
the current Supabase behavior where new public tables may need explicit grants
before `supabase-js` can read them.

## Coverage

The framework supports:

- named calculators
- assumptions and formulas
- source citations and license review notes
- units and input/output schemas
- confidence notes
- version history
- input validation
- saved runs
- tier-based access

Task 062 should seed or implement the initial cost, launch-window, RF
link-budget, thermal, radiation, and power calculators against this framework.

## Verification Notes

Static checks confirmed the migration includes required calculator definition,
assumption, formula, source citation, unit, confidence, version, validation,
saved-run, grant, RLS, and policy structures.

Live migration application and RLS behavior still need the broader historical
migrations applied to the canonical Supabase project, real runtime keys, and
seeded Explorer, Scout, Command, organization, and staff test users.
