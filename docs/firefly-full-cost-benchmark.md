# Firefly Full-Cost Benchmark

Task 030 implements the Firefly Blue Ghost lunar surface data benchmark on the
lunar economy model schema. It is scoped to the canonical Potomac Supabase
project ref `xlpkdoeldtlhearqajat`.

## Benchmark Rule

The benchmark must estimate the full NASA-paid cost to obtain the Blue Ghost
lunar surface data. It must not use only the `$10M` data addendum.

Baseline formula:

```text
$101M Firefly delivery mission
+ $44M NASA science payload / PRISM cost basis
+ $10M Blue Ghost data addendum
= $155M full NASA-paid baseline
```

Lower reference:

```text
$93.3M original NASA award reference
+ $44M NASA science payload / PRISM cost basis
+ $10M Blue Ghost data addendum
= $147.3M lower reference
```

The migration stores the baseline as a published scenario and daily output for
`2026-06-26`, with a range of `$147.3M` to `$155M` and a confidence score of 72.

## Sources

- NASA 2021 release announcing approximately `$93.3M` for Firefly's original
  CLPS delivery award.
- Associated Press 2025 report stating NASA was paying `$101M` for the Firefly
  mission and another `$44M` for experiments.
- Firefly 2025 release announcing the `$10M` NASA CLPS data addendum.
- NASA Science CLPS deliveries page identifying Blue Ghost Mission 1 as the
  Firefly TO19D delivery with 10 NASA science payloads.

## Stored Records

The seed migration creates or updates:

- One active model version:
  `firefly-blue-ghost-full-cost-benchmark-v1`.
- Four approved public source documents.
- Seven public assumptions covering mission delivery, original award reference,
  PRISM/payload cost basis, data addendum, baseline total, lower reference, and
  formula.
- One published scenario estimate:
  `baseline_full_nasa_paid_cost`.
- One published daily output for `2026-06-26`.

Future methodology work can replace the Associated Press payload-cost proxy with
direct NASA budget/source tables if those are identified, but the benchmark must
continue to include the mission and payload cost basis alongside the data
addendum.
