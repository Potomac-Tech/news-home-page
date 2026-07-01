# Lunar Mission Calculators

Task 062 adds the initial calculator set on `/calculators`.

## Calculators

- Lunar mission cost
- Launch-window screen
- RF link budget
- Thermal balance
- Radiation exposure
- Surface power budget

Each calculator includes editable inputs, units, a visible formula description,
source citations, confidence labels, and limitation notes. Saved-run persistence
is labeled as Scout+ because Task 061 added the schema for saved runs, but the
remote schema and signed-in test users are not available yet.

## Access and Data

The current implementation uses local fallback calculator definitions in
`next-app/app/_data/lunarCalculators.ts`. This gives the product a working
calculator surface before the historical Supabase migrations are applied to the
canonical `xlpkdoeldtlhearqajat` project.

Future work should load published calculator definitions, assumptions,
versions, citations, and saved runs from the Task 061 schema once the database
is applied and seeded.

## Verification Notes

Local checks confirmed `/calculators` renders the six calculator names,
assumption inputs, formula notes, limitation notes, citation links, confidence
labels, and Scout+ saved-run label. Build and lint verification are recorded in
the automation task list.
