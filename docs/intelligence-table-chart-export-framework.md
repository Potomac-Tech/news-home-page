# Intelligence Table, Chart, and Export Framework

Task 069 adds a reusable UI framework for data-heavy Potomac intelligence modules.

## Component

`app/_components/IntelligenceDataExplorer.tsx` exports a client component for repeated table/chart/export surfaces.

It supports:

- Search filtering across configured columns.
- Sortable columns.
- Pagination with configurable page sizes.
- Column picker with at least one visible column preserved.
- Source columns through `getSourceMeta`.
- Freshness tooltips on source badges.
- Confidence labels on source badges.
- Compact chart rendering with per-point tooltips.
- Data-table fallback when no chart points are supplied.
- CSV export for entitled users.
- Browser print-to-PDF export for entitled users.
- Locked export states with tier/entitlement copy.
- Responsive horizontal table scrolling for dense datasets.

## Usage Shape

Modules should provide typed rows, column definitions, row IDs, optional source metadata, optional chart points, and an entitlement object.

```tsx
<IntelligenceDataExplorer
    title="Lunar Procurement Watch"
    rows={records}
    columns={[
        {
            key: "title",
            label: "Title",
            getValue: (row) => row.title,
            sortable: true,
        },
        {
            key: "dueDate",
            label: "Due",
            getValue: (row) => row.dueDate,
            sortable: true,
        },
    ]}
    getRowId={(row) => row.id}
    getSourceMeta={(row) => row.sources}
    chartPoints={records.map((row) => ({
        label: row.agency,
        value: row.estimatedValue,
        tooltip: `${row.agency}: ${row.estimatedValue}`,
    }))}
    exportFileName="potomac-lunar-procurement.csv"
    entitlement={{
        canExportCsv: access.canExport,
        canExportPdf: access.canExport,
        lockedReason: "Exports require Scout or Cabeus Council access.",
    }}
/>
```

## Entitlement Rule

Scout and Cabeus Council modules can pass `canExportCsv` and `canExportPdf` from the feature access guard. Public or Explorer-only modules should pass `false` with a clear locked reason unless the product decision explicitly allows public exports.

## Implementation Notes

The framework does not add a charting dependency. It uses a compact accessible bar chart for first-pass intelligence modules and falls back to the table when chart data is absent. Future modules can wrap richer chart libraries behind the same typed data contract if the product needs advanced visualizations.
