import type { Metadata } from "next";
import Link from "next/link";
import {
    absoluteSiteUrl,
    jsonLdScript,
    organizationJsonLd,
    siteConfig,
} from "../_data/site";
import {
    type DatasetCatalogEntry,
    type DatasetCatalogSource,
    loadDatasetCatalog,
} from "../_data/datasets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Dataset Catalog",
    description:
        "Potomac dataset catalog for public lunar science archives and proprietary lunar intelligence data products.",
    alternates: {
        canonical: "/datasets",
    },
    openGraph: {
        title: "Dataset Catalog | Potomac",
        description:
            "Potomac dataset catalog for public lunar science archives and proprietary lunar intelligence data products.",
        url: absoluteSiteUrl("/datasets"),
        siteName: siteConfig.name,
        type: "website",
    },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
});

function statusLabel(value: string | null | undefined) {
    if (!value) {
        return "Public";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function tierLabel(value: string | null) {
    if (!value) {
        return "Public";
    }

    return value === "command" ? "Command" : statusLabel(value);
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return dateFormatter.format(date);
}

function kindLabel(value: string) {
    if (value === "public_science") {
        return "Public Science";
    }

    if (value === "potomac_proprietary") {
        return "Potomac Proprietary";
    }

    if (value === "derived_model") {
        return "Derived Model";
    }

    return statusLabel(value);
}

function catalogJsonLd(entries: DatasetCatalogEntry[]) {
    return {
        "@context": "https://schema.org",
        "@type": "DataCatalog",
        name: "Potomac lunar dataset catalog",
        url: absoluteSiteUrl("/datasets"),
        provider: organizationJsonLd(),
        dataset: entries.map((entry) => ({
            "@type": "Dataset",
            name: entry.title,
            description: entry.summary,
            url: entry.source_landing_url ?? absoluteSiteUrl("/datasets"),
            license: entry.source_license,
            isAccessibleForFree: entry.access_tier_required === null,
            creator: entry.owner_name
                ? {
                      "@type": "Organization",
                      name: entry.owner_name,
                  }
                : organizationJsonLd(),
            distribution:
                entry.sample_url || entry.demo_url
                    ? [
                          {
                              "@type": "DataDownload",
                              contentUrl: entry.sample_url ?? entry.demo_url,
                              name: entry.sample_url ? "Sample" : "Demo",
                          },
                      ]
                    : undefined,
        })),
    };
}

function Metric({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="border-l border-potomac-gold/35 pl-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
            <dd className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                {detail}
            </dd>
        </div>
    );
}

function MetaGrid({
    items,
}: {
    items: Array<{ label: string; value: string | null | undefined }>;
}) {
    const visibleItems = items.filter((item) => item.value);

    return (
        <dl className="grid gap-4 sm:grid-cols-2">
            {visibleItems.map((item) => (
                <div
                    key={`${item.label}-${item.value}`}
                    className="border-l border-white/10 pl-3"
                >
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        {item.label}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-potomac-cream/75">
                        {item.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function SourceList({ sources }: { sources: DatasetCatalogSource[] }) {
    if (!sources.length) {
        return (
            <p className="text-sm leading-6 text-potomac-cream/55">
                Public source metadata is pending.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {sources.map((source) => (
                <div
                    key={source.id}
                    className="border-l border-potomac-gold/35 pl-4"
                >
                    {source.source_url ? (
                        <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-white transition hover:text-potomac-gold"
                        >
                            {source.source_name}
                        </a>
                    ) : (
                        <p className="font-semibold text-white">
                            {source.source_name}
                        </p>
                    )}
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        {source.source_publisher ?? "Publisher pending"} |{" "}
                        {statusLabel(source.source_type)} |{" "}
                        {statusLabel(source.confidence_label)}
                    </p>
                    {source.citation_text ? (
                        <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                            {source.citation_text}
                        </p>
                    ) : null}
                    {source.license_notes ? (
                        <p className="mt-2 text-xs leading-5 text-potomac-cream/50">
                            {source.license_notes}
                        </p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

function DatasetCard({ entry }: { entry: DatasetCatalogEntry }) {
    const dataTypes = entry.data_types.join(", ");

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                        <span className="text-potomac-gold">
                            {kindLabel(entry.dataset_kind)}
                        </span>
                        <span>{statusLabel(entry.availability_state)}</span>
                        <span>{tierLabel(entry.access_tier_required)}</span>
                    </div>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white">
                        {entry.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-potomac-cream/75">
                        {entry.summary}
                    </p>
                </div>
                <div className="rounded border border-potomac-gold/30 px-5 py-4 lg:min-w-72">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Availability
                    </p>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                        {entry.availability_note ??
                            statusLabel(entry.availability_state)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        Release {formatDate(entry.release_target_date)}
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1fr]">
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Catalog Metadata
                    </p>
                    <div className="mt-4">
                        <MetaGrid
                            items={[
                                {
                                    label: "Provider",
                                    value: entry.provider_name,
                                },
                                {
                                    label: "Collection",
                                    value: entry.collection_name,
                                },
                                {
                                    label: "Coverage",
                                    value: entry.geography_scope,
                                },
                                {
                                    label: "Mission",
                                    value: entry.mission_name,
                                },
                                {
                                    label: "Instrument",
                                    value: entry.instrument_name,
                                },
                                {
                                    label: "Data types",
                                    value: dataTypes,
                                },
                                {
                                    label: "Update cadence",
                                    value: entry.update_frequency,
                                },
                                {
                                    label: "Source reviewed",
                                    value: formatDate(entry.source_retrieved_at),
                                },
                            ]}
                        />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                        {entry.sample_url && entry.is_sample_available ? (
                            <a
                                href={entry.sample_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Sample
                            </a>
                        ) : null}
                        {entry.demo_url && entry.is_demo_available ? (
                            <a
                                href={entry.demo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Demo
                            </a>
                        ) : null}
                        {entry.source_landing_url ? (
                            <a
                                href={entry.source_landing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-cream/70 transition hover:border-potomac-gold hover:text-potomac-gold"
                            >
                                Source
                            </a>
                        ) : null}
                    </div>
                    {entry.sample_note ? (
                        <p className="mt-4 text-xs leading-5 text-potomac-cream/50">
                            {entry.sample_note}
                        </p>
                    ) : null}
                </section>
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Source Metadata
                    </p>
                    <div className="mt-4">
                        <SourceList sources={entry.sources} />
                    </div>
                </section>
            </div>
        </article>
    );
}

export default async function DatasetsPage() {
    const entries = await loadDatasetCatalog();
    const publicCount = entries.filter(
        (entry) => entry.access_tier_required === null
    ).length;
    const proprietaryCount = entries.filter(
        (entry) => entry.dataset_kind === "potomac_proprietary"
    ).length;
    const sampleCount = entries.filter(
        (entry) => entry.is_sample_available || entry.is_demo_available
    ).length;
    const sourceCount = new Set(
        entries.flatMap((entry) => entry.sources.map((source) => source.id))
    ).size;

    return (
        <section className="bg-grid-pattern">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(catalogJsonLd(entries)),
                }}
            />
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Lunar data catalog
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Dataset Catalog
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Public NASA and science archives alongside Potomac
                            proprietary lunar intelligence datasets, with
                            source metadata, tier labels, availability states,
                            and sample or demo indicators.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Catalog scope
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            Public and paid data
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Catalog records describe availability and access
                            requirements. Raw paid datasets remain behind
                            member workflows.
                        </p>
                        <Link
                            href="/member/marketplace"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Marketplace
                        </Link>
                    </aside>
                </div>

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                        label="Cataloged"
                        value={String(entries.length)}
                        detail="Dataset entries"
                    />
                    <Metric
                        label="Public"
                        value={String(publicCount)}
                        detail="Open source access"
                    />
                    <Metric
                        label="Potomac"
                        value={String(proprietaryCount)}
                        detail="Proprietary entries"
                    />
                    <Metric
                        label="Sources"
                        value={String(sourceCount)}
                        detail={`${sampleCount} samples or demos`}
                    />
                </dl>

                <div className="mt-12 space-y-6">
                    {entries.map((entry) => (
                        <DatasetCard key={entry.dataset_key} entry={entry} />
                    ))}
                </div>
            </div>
        </section>
    );
}
