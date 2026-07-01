import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDataMarketplaceAccessContext } from "../../../lib/auth/data-marketplace";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    type DataMarketplaceCitation,
    type DataMarketplaceOffer,
    type DataMarketplaceRequest,
    loadDataMarketplaceDashboard,
} from "../../_data/dataMarketplace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Data Marketplace",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

function statusLabel(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function tierLabel(value: string) {
    return value === "command" ? "Command" : "Scout";
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

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return dateTimeFormatter.format(date);
}

function formatCoverage(offer: DataMarketplaceOffer) {
    if (!offer.coverage_start_at && !offer.coverage_end_at) {
        return "Not set";
    }

    if (!offer.coverage_end_at) {
        return `From ${formatDate(offer.coverage_start_at)}`;
    }

    if (!offer.coverage_start_at) {
        return `Through ${formatDate(offer.coverage_end_at)}`;
    }

    return `${formatDate(offer.coverage_start_at)} - ${formatDate(
        offer.coverage_end_at
    )}`;
}

function confidenceLabel(value: string, score: number) {
    return `${statusLabel(value)} | ${Number(score).toFixed(0)}%`;
}

function renderParagraphs(value: string | null | undefined) {
    return (value ?? "")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Data marketplace
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Marketplace request and offer records are paid-member
                        data and are not rendered from local fallback data.
                        Configure the Potomac Supabase public environment
                        variables and sign in with Scout or Command access.
                    </p>
                    <Link
                        href="/apply"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Apply for access
                    </Link>
                </div>
            </div>
        </section>
    );
}

function LockedGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Data marketplace
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Scout or Command access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Data requests, dataset offers, source evidence, and
                        extraction confidence are reserved for paid Scout
                        members, Command organization users, and authorized
                        staff.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                        <Link
                            href="/command"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Command access
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function EmptyMarketplace() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Data marketplace
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        No published marketplace listings are available yet.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        The marketplace will populate after analysts approve and
                        publish extracted data requests or dataset offers.
                    </p>
                    <Link
                        href="/member"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Member workspace
                    </Link>
                </div>
            </div>
        </section>
    );
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

    if (!visibleItems.length) {
        return (
            <p className="text-sm leading-6 text-potomac-cream/55">
                Mission metadata pending.
            </p>
        );
    }

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

function SourceEvidence({
    sources,
}: {
    sources: DataMarketplaceCitation[];
}) {
    if (!sources.length) {
        return (
            <p className="text-sm leading-6 text-potomac-cream/55">
                No approved source evidence is linked to this listing yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {sources.map((citation) => (
                <div
                    key={citation.id}
                    className="border-l border-potomac-gold/35 pl-4"
                >
                    {citation.source ? (
                        <>
                            {citation.source.url ? (
                                <a
                                    href={citation.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-white transition hover:text-potomac-gold"
                                >
                                    {citation.source.title}
                                </a>
                            ) : (
                                <p className="font-semibold text-white">
                                    {citation.source.title}
                                </p>
                            )}
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                {citation.source.publisher ?? "Publisher pending"}{" "}
                                | {citation.source.document_type} |{" "}
                                {tierLabel(citation.source.access_tier_required)}
                                + source
                            </p>
                            {citation.source.summary ? (
                                <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                                    {citation.source.summary}
                                </p>
                            ) : null}
                            {citation.source.citation_text ? (
                                <p className="mt-2 text-xs leading-5 text-potomac-cream/50">
                                    {citation.source.citation_text}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="text-sm leading-6 text-potomac-cream/60">
                            Source record gated or unavailable at the current
                            tier.
                        </p>
                    )}
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        {statusLabel(citation.relationship_type)} |{" "}
                        {statusLabel(citation.confidence_label)}
                        {citation.page_reference
                            ? ` | ${citation.page_reference}`
                            : ""}
                    </p>
                    {citation.rationale ? (
                        <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                            {citation.rationale}
                        </p>
                    ) : null}
                </div>
            ))}
        </div>
    );
}

function RequestCard({ request }: { request: DataMarketplaceRequest }) {
    const requester =
        request.requester_organization ?? request.requester_name ?? "Requester pending";

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                        <span className="text-potomac-gold">
                            {statusLabel(request.status)}
                        </span>
                        <span>{tierLabel(request.access_tier_required)}+</span>
                        <span>{confidenceLabel(request.confidence_label, request.confidence_score)}</span>
                    </div>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white">
                        {request.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-potomac-cream/75">
                        {request.request_summary}
                    </p>
                </div>
                <div className="rounded border border-potomac-gold/30 px-5 py-4 lg:min-w-72">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Needed by
                    </p>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                        {formatDate(request.needed_by)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        Priority {request.priority_score} | {requester}
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1fr]">
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Mission Metadata
                    </p>
                    <div className="mt-4">
                        <MetaGrid
                            items={[
                                { label: "Data type", value: request.data_type },
                                {
                                    label: "Format",
                                    value: request.requested_format,
                                },
                                {
                                    label: "Mission",
                                    value: request.mission_name,
                                },
                                {
                                    label: "Mission phase",
                                    value: request.mission_phase,
                                },
                                {
                                    label: "Lunar region",
                                    value: request.lunar_region,
                                },
                                {
                                    label: "Location",
                                    value: request.location_name,
                                },
                                {
                                    label: "Instrument",
                                    value: request.instrument_name,
                                },
                                {
                                    label: "Published",
                                    value: formatDateTime(request.published_at),
                                },
                            ]}
                        />
                    </div>
                </section>
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Analyst Detail
                    </p>
                    <div className="mt-4 space-y-4 text-sm leading-6 text-potomac-cream/70">
                        {renderParagraphs(
                            request.extraction_rationale ??
                                request.analyst_notes ??
                                "No analyst rationale is published yet."
                        ).map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </section>
            </div>

            <section className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                    Source Evidence
                </p>
                <div className="mt-4">
                    <SourceEvidence sources={request.sources} />
                </div>
            </section>
        </article>
    );
}

function OfferCard({ offer }: { offer: DataMarketplaceOffer }) {
    const provider =
        offer.provider_organization ?? offer.provider_name ?? "Provider pending";

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                        <span className="text-potomac-gold">
                            {statusLabel(offer.status)}
                        </span>
                        <span>{tierLabel(offer.access_tier_required)}+</span>
                        <span>{confidenceLabel(offer.confidence_label, offer.confidence_score)}</span>
                    </div>
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-white">
                        {offer.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-potomac-cream/75">
                        {offer.offer_summary}
                    </p>
                </div>
                <div className="rounded border border-potomac-gold/30 px-5 py-4 lg:min-w-72">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Availability
                    </p>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                        {statusLabel(offer.availability_state ?? offer.status)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                        {provider}
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1fr]">
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Mission Metadata
                    </p>
                    <div className="mt-4">
                        <MetaGrid
                            items={[
                                { label: "Data type", value: offer.data_type },
                                {
                                    label: "Delivery",
                                    value: offer.delivery_mode,
                                },
                                {
                                    label: "Coverage",
                                    value: formatCoverage(offer),
                                },
                                {
                                    label: "Mission",
                                    value: offer.mission_name,
                                },
                                {
                                    label: "Mission phase",
                                    value: offer.mission_phase,
                                },
                                {
                                    label: "Lunar region",
                                    value: offer.lunar_region,
                                },
                                {
                                    label: "Location",
                                    value: offer.location_name,
                                },
                                {
                                    label: "Instrument",
                                    value: offer.instrument_name,
                                },
                            ]}
                        />
                    </div>
                    {offer.sample_url ? (
                        <a
                            href={offer.sample_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Sample
                        </a>
                    ) : null}
                </section>
                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Analyst Detail
                    </p>
                    <div className="mt-4 space-y-4 text-sm leading-6 text-potomac-cream/70">
                        {renderParagraphs(
                            offer.extraction_rationale ??
                                offer.analyst_notes ??
                                "No analyst rationale is published yet."
                        ).map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </section>
            </div>

            <section className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                    Source Evidence
                </p>
                <div className="mt-4">
                    <SourceEvidence sources={offer.sources} />
                </div>
            </section>
        </article>
    );
}

export default async function DataMarketplacePage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getDataMarketplaceAccessContext({
        supabase,
        nextPath: "/member/marketplace",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canReadDataMarketplace) {
        return <LockedGate />;
    }

    const dashboard = await loadDataMarketplaceDashboard(supabase);
    const totalListings = dashboard.requests.length + dashboard.offers.length;

    if (!totalListings) {
        return <EmptyMarketplace />;
    }

    const accessibleSourceIds = new Set(
        [...dashboard.requests, ...dashboard.offers].flatMap((listing) =>
            listing.sources
                .map((citation) => citation.source?.id)
                .filter((id): id is string => Boolean(id))
        )
    );
    const commandOnlyListings = [
        ...dashboard.requests,
        ...dashboard.offers,
    ].filter((listing) => listing.access_tier_required === "command").length;
    const highConfidenceListings = [
        ...dashboard.requests,
        ...dashboard.offers,
    ].filter((listing) => listing.confidence_label === "high").length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Scout and Command intelligence
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Data Marketplace
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Approved lunar data requests and dataset offers with
                            mission context, source evidence, confidence labels,
                            and tier-aware visibility.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access state
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            {statusLabel(access.roleId)} role
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Listings are filtered by Supabase RLS before this
                            page renders. Scout users see Scout-eligible
                            records; Command users also see Command-only
                            records.
                        </p>
                        <Link
                            href="/member"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                    </aside>
                </div>

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                        label="Requests"
                        value={String(dashboard.requests.length)}
                        detail="Approved listings"
                    />
                    <Metric
                        label="Offers"
                        value={String(dashboard.offers.length)}
                        detail="Available datasets"
                    />
                    <Metric
                        label="Sources"
                        value={String(accessibleSourceIds.size)}
                        detail="Accessible evidence"
                    />
                    <Metric
                        label="Confidence"
                        value={String(highConfidenceListings)}
                        detail={`${commandOnlyListings} Command-only`}
                    />
                </dl>

                <section className="mt-12">
                    <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="font-serif text-3xl text-white">
                                Data Requests
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                                Published demand signals for lunar or
                                space-sector datasets.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-6">
                        {dashboard.requests.length ? (
                            dashboard.requests.map((request) => (
                                <RequestCard key={request.id} request={request} />
                            ))
                        ) : (
                            <div className="glass-card rounded p-6 text-potomac-cream/75">
                                No approved data requests are visible at this
                                tier yet.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-12">
                    <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="font-serif text-3xl text-white">
                                Data Offers
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                                Published dataset supply signals with provider,
                                availability, and delivery context.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-6">
                        {dashboard.offers.length ? (
                            dashboard.offers.map((offer) => (
                                <OfferCard key={offer.id} offer={offer} />
                            ))
                        ) : (
                            <div className="glass-card rounded p-6 text-potomac-cream/75">
                                No approved data offers are visible at this tier
                                yet.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}
