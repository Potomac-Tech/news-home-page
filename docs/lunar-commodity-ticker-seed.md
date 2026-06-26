# Lunar Commodity Ticker Seed

Task 028 adds the first public lunar-resource commodity ticker seed set for the
canonical Potomac Supabase project ref `xlpkdoeldtlhearqajat`.

## Seed Scope

The migration `20260626080308_lunar_commodity_ticker_seed.sql` creates 20 active
commodity entries:

1. Water ice (`H2O`)
2. Oxygen (`O2`)
3. Hydrogen (`H2`)
4. Helium-3 (`HE3`)
5. Helium (`HE`)
6. Nitrogen (`N2`)
7. Carbon dioxide (`CO2`)
8. Methane (`CH4`)
9. Silicon (`SI`)
10. Aluminum (`AL`)
11. Iron (`FE`)
12. Titanium (`TI`)
13. Magnesium (`MG`)
14. Calcium (`CA`)
15. Rare earth oxides (`REO`)
16. Platinum group metals (`PGM`)
17. Nickel (`NI`)
18. Sulfur (`S`)
19. Potassium compounds (`K2O`)
20. Phosphorus compounds (`P2O5`)

Each seeded commodity includes:

- Active public display status, category, unit, update cadence, display order,
  and confidence label.
- A `Public ticker proxy v1` model with explicit assumptions that the value is a
  terrestrial or industrial proxy and excludes lunar extraction, launch/surface
  logistics, processing losses, property-rights risk, and exclusivity premiums.
- One displayable `2026-06-26` price/proxy observation with source notes.
- One source citation attached to the displayable observation.

## Source Pattern

The seed intentionally uses public references such as NASA ISRU pages, NASA
technology notes, DOE hydrogen analysis, EIA natural-gas reporting, FRED/BLS
industrial gas indexes, and USGS Mineral Commodity Summaries. These are starting
references for a public ticker, not a production pricing methodology.

## Analyst Refresh Notes

- Treat all values as public proxy seeds until Task 031 adds the analyst-facing
  methodology/source table workflow.
- Keep `is_displayable = true` only for observations that have a reviewed source
  URL, source note, confidence label, and citation.
- Replace rounded proxy values with methodology-backed estimates once the lunar
  economy model and source tables are available.
- Do not use these values as lunar delivered prices; they intentionally exclude
  lunar mission, extraction, processing, and legal-risk premiums.
