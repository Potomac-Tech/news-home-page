"use client";

import { useMemo, useState } from "react";

export type IntelligenceColumn<T> = {
    key: string;
    label: string;
    getValue: (row: T) => string | number | null | undefined;
    defaultVisible?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    align?: "left" | "right";
};

export type IntelligenceSourceMeta = {
    label: string;
    url?: string | null;
    freshness?: string | null;
    confidence?: "low" | "medium" | "high" | "experimental" | string | null;
};

export type IntelligenceChartPoint = {
    label: string;
    value: number;
    tooltip: string;
};

export type IntelligenceExportEntitlement = {
    canExportCsv: boolean;
    canExportPdf: boolean;
    lockedReason?: string;
};

export type IntelligenceDataExplorerProps<T> = {
    title: string;
    description?: string;
    rows: T[];
    columns: Array<IntelligenceColumn<T>>;
    getRowId: (row: T) => string;
    getSourceMeta?: (row: T) => IntelligenceSourceMeta[];
    chartPoints?: IntelligenceChartPoint[];
    exportFileName: string;
    entitlement: IntelligenceExportEntitlement;
    emptyLabel?: string;
    pageSizeOptions?: number[];
};

type SortState = {
    key: string;
    direction: "asc" | "desc";
} | null;

function normalizeValue(value: string | number | null | undefined) {
    if (value == null) {
        return "";
    }

    return String(value);
}

function labelize(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function csvCell(value: string | number | null | undefined) {
    const normalized = normalizeValue(value);

    if (/[",\n\r]/.test(normalized)) {
        return `"${normalized.replaceAll('"', '""')}"`;
    }

    return normalized;
}

function downloadCsv({
    fileName,
    headers,
    rows,
}: {
    fileName: string;
    headers: string[];
    rows: Array<Array<string | number | null | undefined>>;
}) {
    const csv = [
        headers.map(csvCell).join(","),
        ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
}

function confidenceClass(value: string | null | undefined) {
    if (value === "high") {
        return "border-emerald-300/30 text-emerald-100";
    }

    if (value === "medium") {
        return "border-potomac-gold/40 text-potomac-gold";
    }

    if (value === "low") {
        return "border-red-300/30 text-red-100";
    }

    return "border-white/15 text-potomac-cream/70";
}

export function IntelligenceDataExplorer<T>({
    title,
    description,
    rows,
    columns,
    getRowId,
    getSourceMeta,
    chartPoints = [],
    exportFileName,
    entitlement,
    emptyLabel = "No records match the current view.",
    pageSizeOptions = [10, 25, 50],
}: IntelligenceDataExplorerProps<T>) {
    const defaultVisibleColumns = columns
        .filter((column) => column.defaultVisible !== false)
        .map((column) => column.key);
    const [query, setQuery] = useState("");
    const [sortState, setSortState] = useState<SortState>(null);
    const [pageSize, setPageSize] = useState(pageSizeOptions[0] ?? 10);
    const [page, setPage] = useState(1);
    const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);

    const selectedColumns = useMemo(
        () =>
            columns.filter((column) =>
                visibleColumns.includes(column.key)
            ),
        [columns, visibleColumns]
    );

    const filteredRows = useMemo(() => {
        const filterableColumns = columns.filter(
            (column) => column.filterable !== false
        );
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return rows;
        }

        return rows.filter((row) =>
            filterableColumns.some((column) =>
                normalizeValue(column.getValue(row))
                    .toLowerCase()
                    .includes(normalizedQuery)
            )
        );
    }, [columns, query, rows]);

    const sortedRows = useMemo(() => {
        if (!sortState) {
            return filteredRows;
        }

        const column = columns.find((item) => item.key === sortState.key);

        if (!column) {
            return filteredRows;
        }

        return [...filteredRows].sort((a, b) => {
            const aValue = column.getValue(a);
            const bValue = column.getValue(b);

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortState.direction === "asc"
                    ? aValue - bValue
                    : bValue - aValue;
            }

            const result = normalizeValue(aValue).localeCompare(
                normalizeValue(bValue),
                undefined,
                { numeric: true, sensitivity: "base" }
            );

            return sortState.direction === "asc" ? result : -result;
        });
    }, [columns, filteredRows, sortState]);

    const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
    const safePage = Math.min(page, pageCount);
    const pagedRows = sortedRows.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );
    const maxChartValue = Math.max(
        ...chartPoints.map((point) => point.value),
        1
    );

    function toggleSort(column: IntelligenceColumn<T>) {
        if (!column.sortable) {
            return;
        }

        setSortState((current) => {
            if (current?.key !== column.key) {
                return { key: column.key, direction: "asc" };
            }

            if (current.direction === "asc") {
                return { key: column.key, direction: "desc" };
            }

            return null;
        });
    }

    function toggleColumn(key: string) {
        setVisibleColumns((current) => {
            if (current.includes(key)) {
                const next = current.filter((item) => item !== key);

                return next.length ? next : current;
            }

            return [...current, key];
        });
    }

    return (
        <section className="rounded border border-white/10 bg-black/20">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 p-5">
                <div>
                    <h2 className="font-serif text-2xl text-white">{title}</h2>
                    {description ? (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-potomac-cream/70">
                            {description}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        disabled={!entitlement.canExportCsv}
                        title={
                            entitlement.canExportCsv
                                ? "Download the current table as CSV"
                                : entitlement.lockedReason
                        }
                        onClick={() =>
                            downloadCsv({
                                fileName: exportFileName,
                                headers: selectedColumns.map(
                                    (column) => column.label
                                ),
                                rows: sortedRows.map((row) =>
                                    selectedColumns.map((column) =>
                                        column.getValue(row)
                                    )
                                ),
                            })
                        }
                        className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-potomac-cream/35"
                    >
                        CSV
                    </button>
                    <button
                        type="button"
                        disabled={!entitlement.canExportPdf}
                        title={
                            entitlement.canExportPdf
                                ? "Open the browser print dialog for PDF export"
                                : entitlement.lockedReason
                        }
                        onClick={() => window.print()}
                        className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-potomac-cream/35"
                    >
                        PDF
                    </button>
                </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_18rem]">
                <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                        <input
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Filter records"
                            className="w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold"
                        />
                        <select
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(Number(event.target.value));
                                setPage(1);
                            }}
                            className="rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
                        >
                            {pageSizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option} rows
                                </option>
                            ))}
                        </select>
                    </div>

                    <details className="rounded border border-white/10 p-4">
                        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Columns
                        </summary>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {columns.map((column) => (
                                <label
                                    key={column.key}
                                    className="flex items-center gap-3 text-sm text-potomac-cream/75"
                                >
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(
                                            column.key
                                        )}
                                        onChange={() =>
                                            toggleColumn(column.key)
                                        }
                                        className="h-4 w-4 accent-potomac-gold"
                                    />
                                    {column.label}
                                </label>
                            ))}
                        </div>
                    </details>

                    <div className="overflow-x-auto rounded border border-white/10">
                        <table className="min-w-full border-collapse text-left text-sm">
                            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                <tr>
                                    {selectedColumns.map((column) => (
                                        <th
                                            key={column.key}
                                            scope="col"
                                            className={
                                                column.align === "right"
                                                    ? "px-4 py-3 text-right"
                                                    : "px-4 py-3"
                                            }
                                        >
                                            <button
                                                type="button"
                                                disabled={!column.sortable}
                                                onClick={() =>
                                                    toggleSort(column)
                                                }
                                                className="font-bold uppercase tracking-[0.16em] disabled:cursor-default"
                                            >
                                                {column.label}
                                                {sortState?.key ===
                                                column.key
                                                    ? sortState.direction ===
                                                      "asc"
                                                        ? " up"
                                                        : " down"
                                                    : ""}
                                            </button>
                                        </th>
                                    ))}
                                    {getSourceMeta ? (
                                        <th scope="col" className="px-4 py-3">
                                            Sources
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {pagedRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                selectedColumns.length +
                                                (getSourceMeta ? 1 : 0)
                                            }
                                            className="px-4 py-8 text-center text-potomac-cream/60"
                                        >
                                            {emptyLabel}
                                        </td>
                                    </tr>
                                ) : (
                                    pagedRows.map((row) => (
                                        <tr
                                            key={getRowId(row)}
                                            className="border-t border-white/10"
                                        >
                                            {selectedColumns.map((column) => (
                                                <td
                                                    key={column.key}
                                                    className={
                                                        column.align === "right"
                                                            ? "px-4 py-4 text-right text-potomac-cream/80"
                                                            : "px-4 py-4 text-potomac-cream/80"
                                                    }
                                                >
                                                    {normalizeValue(
                                                        column.getValue(row)
                                                    ) || "Not set"}
                                                </td>
                                            ))}
                                            {getSourceMeta ? (
                                                <td className="min-w-[14rem] px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {getSourceMeta(row).map(
                                                            (source) => (
                                                                <span
                                                                    key={`${getRowId(row)}-${source.label}`}
                                                                    title={
                                                                        source.freshness
                                                                            ? `Freshness: ${source.freshness}`
                                                                            : undefined
                                                                    }
                                                                    className={`rounded border px-2 py-1 text-xs ${confidenceClass(
                                                                        source.confidence
                                                                    )}`}
                                                                >
                                                                    {source.url ? (
                                                                        <a href={source.url}>
                                                                            {
                                                                                source.label
                                                                            }
                                                                        </a>
                                                                    ) : (
                                                                        source.label
                                                                    )}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-potomac-cream/65">
                        <p>
                            Showing {pagedRows.length} of {sortedRows.length}{" "}
                            records
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setPage((current) => current - 1)}
                                className="rounded border border-white/15 px-4 py-2 disabled:cursor-not-allowed disabled:text-potomac-cream/30"
                            >
                                Prev
                            </button>
                            <span>
                                {safePage} / {pageCount}
                            </span>
                            <button
                                type="button"
                                disabled={safePage >= pageCount}
                                onClick={() => setPage((current) => current + 1)}
                                className="rounded border border-white/15 px-4 py-2 disabled:cursor-not-allowed disabled:text-potomac-cream/30"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="rounded border border-white/10 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Chart
                    </h3>
                    {chartPoints.length === 0 ? (
                        <p className="mt-4 text-sm leading-6 text-potomac-cream/65">
                            Data table fallback active. Add chart points to
                            render a compact comparison chart.
                        </p>
                    ) : (
                        <div className="mt-5 space-y-4">
                            {chartPoints.map((point) => (
                                <div key={point.label}>
                                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                        <span className="text-potomac-cream/75">
                                            {point.label}
                                        </span>
                                        <span
                                            title={point.tooltip}
                                            className="text-potomac-gold"
                                        >
                                            {point.value.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-3 rounded bg-white/10">
                                        <div
                                            className="h-3 rounded bg-potomac-gold"
                                            style={{
                                                width: `${Math.max(
                                                    4,
                                                    (point.value /
                                                        maxChartValue) *
                                                        100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!entitlement.canExportCsv || !entitlement.canExportPdf ? (
                        <p className="mt-5 text-xs leading-5 text-potomac-cream/55">
                            {entitlement.lockedReason ??
                                "Exports require an eligible membership tier."}
                        </p>
                    ) : null}
                </aside>
            </div>
        </section>
    );
}
