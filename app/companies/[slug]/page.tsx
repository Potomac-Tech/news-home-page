import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLunarMarketIntelAccess } from "../../../lib/auth/lunar-market-intel";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    canReadCompanyTier,
    companyTierLabel,
    formatCompanyDate,
    formatCompanyFreshness,
    formatCompanyLabel,
    formatCompanyMoney,
    loadLunarCompanyBySlug,
    type LunarCompanyRecord,
    type LunarCompanyTier,
} from "../../_data/lunarCompanies";

export const dynamic = "force-dynamic";

type PageParams = {
    slug: string;
};

type AccessFlags = {
    canReadMember: boolean;
    canReadScout: boolean;
    canReadCommand: boolean;
};

export async function generateMetadata({
    params,
}: {
    params: Promise<PageParams>;
}): Promise<Metadata> {
    const { slug } = await params;
    const company = await loadLunarCompanyBySlug({ slug });

    if (!company) {
        return {
            title: "Company Not Found",
        };
    }

    return {
        title: `${company.name} Lunar Company Profile`,
        description: company.summary,
        alternates: {
            canonical: `/companies/${company.slug}`,
        },
    };
}

function canRead(tier: LunarCompanyTier, access: AccessFlags) {
    return canReadCompanyTier({
        tier,
        canReadMember: access.canReadMember,
        canReadScout: access.canReadScout,
        canReadCommand: access.canReadCommand,
    });
}

function Metric({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="border-l border-potomac-gold/35 pl-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
            {detail ? (
                <dd className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                    {detail}
                </dd>
            ) : null}
        </div>
    );
}

function LockedPanel({ tier }: { tier: LunarCompanyTier }) {
    return (
        <section className="glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                {companyTierLabel(tier)} detail
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
                Company intelligence is gated.
            </h2>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                Scout and Command users can unlock contract, financial,
                relationship, and comparison details where the underlying
                source rights and RLS policies allow access.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    href="/pricing"
                    className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Compare tiers
                </Link>
                <Link
                    href="/command"
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Command access
                </Link>
            </div>
        </section>
    );
}

function DetailSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">{title}</h2>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function CompanyDetails({
    company,
    access,
}: {
    company: LunarCompanyRecord;
    access: AccessFlags;
}) {
    const facilities = company.facilities.filter((item) =>
        canRead(item.visibilityTier, access)
    );
    const leaders = company.leadership.filter((item) =>
        canRead(item.visibilityTier, access)
    );
    const contracts = company.contracts.filter((item) =>
        canRead(item.visibilityTier, access)
    );
    const financials = company.financials.filter((item) =>
        canRead(item.visibilityTier, access)
    );
    const newsLinks = company.newsLinks.filter((item) =>
        canRead(item.visibilityTier, access)
    );
    const relationships = company.relationships.filter((item) =>
        canRead(item.visibilityTier, access)
    );
    const comparisonAttributes = company.comparisonAttributes.filter((item) =>
        canRead(item.visibilityTier, access)
    );

    return (
        <div className="space-y-8">
            <DetailSection title="Facilities">
                {facilities.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {facilities.map((facility) => (
                            <article
                                key={facility.id}
                                className="rounded border border-white/10 bg-white/[0.02] p-4"
                            >
                                <h3 className="font-semibold text-white">
                                    {facility.name}
                                </h3>
                                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                    {formatCompanyLabel(facility.type)} |{" "}
                                    {facility.location ?? "Location pending"}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                    {facility.lunarRole}
                                </p>
                                <p className="mt-3 text-xs text-potomac-cream/50">
                                    {facility.capabilities.join(", ") ||
                                        "Capabilities pending"}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        Facility records are not visible for this access level.
                    </p>
                )}
            </DetailSection>

            <DetailSection title="Leadership">
                {leaders.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {leaders.map((leader) => (
                            <article
                                key={leader.id}
                                className="rounded border border-white/10 bg-white/[0.02] p-4"
                            >
                                <h3 className="font-semibold text-white">
                                    {leader.name}
                                </h3>
                                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                    {leader.title}
                                </p>
                                {leader.biography ? (
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                        {leader.biography}
                                    </p>
                                ) : null}
                                {leader.profileUrl ? (
                                    <a
                                        href={leader.profileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:text-potomac-cream"
                                    >
                                        Profile source
                                    </a>
                                ) : null}
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        Leadership records are not visible for this access level.
                    </p>
                )}
            </DetailSection>

            <DetailSection title="Contracts and Financials">
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-4">
                        {contracts.length ? (
                            contracts.map((contract) => (
                                <article
                                    key={contract.id}
                                    className="rounded border border-white/10 bg-white/[0.02] p-4"
                                >
                                    <h3 className="font-semibold text-white">
                                        {contract.title}
                                    </h3>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {contract.customerName ?? "Customer TBD"} |{" "}
                                        {formatCompanyLabel(contract.status)}
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                        {contract.lunarScopeNote}
                                    </p>
                                    <p className="mt-3 text-sm text-potomac-cream/60">
                                        Ceiling:{" "}
                                        <span className="text-white">
                                            {formatCompanyMoney(
                                                contract.ceilingValue,
                                                contract.currencyCode
                                            )}
                                        </span>
                                    </p>
                                </article>
                            ))
                        ) : (
                            <p className="text-sm text-potomac-cream/60">
                                Contract rows are gated or not attached yet.
                            </p>
                        )}
                    </div>
                    <div className="space-y-4">
                        {financials.length ? (
                            financials.map((financial) => (
                                <article
                                    key={financial.id}
                                    className="rounded border border-white/10 bg-white/[0.02] p-4"
                                >
                                    <h3 className="font-semibold text-white">
                                        {financial.metricLabel}
                                    </h3>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {financial.periodLabel ?? "Current"} |{" "}
                                        {companyTierLabel(
                                            financial.visibilityTier
                                        )}
                                    </p>
                                    <p className="mt-3 text-2xl font-semibold text-white">
                                        {financial.valueText ??
                                            formatCompanyMoney(
                                                financial.valueNumeric,
                                                financial.currencyCode
                                            )}
                                    </p>
                                    {financial.licenseNotes ? (
                                        <p className="mt-3 text-xs leading-5 text-potomac-cream/50">
                                            {financial.licenseNotes}
                                        </p>
                                    ) : null}
                                </article>
                            ))
                        ) : (
                            <p className="text-sm text-potomac-cream/60">
                                Financial metrics are gated or not attached yet.
                            </p>
                        )}
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Comparison Attributes">
                {comparisonAttributes.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                            <thead className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                                <tr className="border-b border-white/10">
                                    <th className="py-3 pr-4">Attribute</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Value</th>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="py-3 pl-4">Confidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 text-potomac-cream/70">
                                {comparisonAttributes.map((attribute) => (
                                    <tr key={attribute.id}>
                                        <td className="py-4 pr-4 font-semibold text-white">
                                            {attribute.label}
                                        </td>
                                        <td className="px-4 py-4">
                                            {formatCompanyLabel(
                                                attribute.category
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {attribute.valueText ??
                                                attribute.valueDate ??
                                                attribute.valueNumeric ??
                                                "Not set"}
                                        </td>
                                        <td className="px-4 py-4">
                                            {attribute.rankValue ?? "TBD"}
                                        </td>
                                        <td className="py-4 pl-4">
                                            {formatCompanyLabel(
                                                attribute.confidenceLabel
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        Comparison attributes are gated or not attached yet.
                    </p>
                )}
            </DetailSection>

            <DetailSection title="News and Relationships">
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-4">
                        {newsLinks.length ? (
                            newsLinks.map((news) => (
                                <article
                                    key={news.id}
                                    className="rounded border border-white/10 bg-white/[0.02] p-4"
                                >
                                    {news.url ? (
                                        <a
                                            href={news.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-white transition hover:text-potomac-gold"
                                        >
                                            {news.title}
                                        </a>
                                    ) : (
                                        <h3 className="font-semibold text-white">
                                            {news.title}
                                        </h3>
                                    )}
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {news.publisher ?? "Publisher TBD"} |{" "}
                                        {formatCompanyDate(news.publishedAt)}
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                        {news.summary}
                                    </p>
                                </article>
                            ))
                        ) : (
                            <p className="text-sm text-potomac-cream/60">
                                News links are not attached yet.
                            </p>
                        )}
                    </div>
                    <div className="space-y-4">
                        {relationships.length ? (
                            relationships.map((relationship) => (
                                <article
                                    key={relationship.id}
                                    className="rounded border border-white/10 bg-white/[0.02] p-4"
                                >
                                    <h3 className="font-semibold text-white">
                                        {formatCompanyLabel(relationship.kind)}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                        {relationship.summary}
                                    </p>
                                </article>
                            ))
                        ) : (
                            <p className="text-sm text-potomac-cream/60">
                                Relationship rows are gated or not attached yet.
                            </p>
                        )}
                    </div>
                </div>
            </DetailSection>
        </div>
    );
}

function Sources({ company }: { company: LunarCompanyRecord }) {
    return (
        <DetailSection title="Sources">
            <div className="space-y-4">
                {company.citations.length ? (
                    company.citations.map((citation) => (
                        <article
                            key={citation.id}
                            className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                        >
                            {citation.url ? (
                                <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-white transition hover:text-potomac-gold"
                                >
                                    {citation.title}
                                </a>
                            ) : (
                                <h3 className="font-semibold text-white">
                                    {citation.title}
                                </h3>
                            )}
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                {citation.sourceName} |{" "}
                                {formatCompanyLabel(citation.reviewStatus)}
                            </p>
                            {citation.summary ? (
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                    {citation.summary}
                                </p>
                            ) : null}
                        </article>
                    ))
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        No source citations are attached yet.
                    </p>
                )}
            </div>
        </DetailSection>
    );
}

export default async function CompanyDetailPage({
    params,
}: {
    params: Promise<PageParams>;
}) {
    const { slug } = await params;
    const supabase = hasPotomacSupabasePublicConfig()
        ? await createClient()
        : undefined;
    const access = supabase
        ? await getLunarMarketIntelAccess({ supabase })
        : {
              canReadMemberDetails: false,
              canReadScoutDetails: false,
              canReadCommandDetails: false,
          };
    const accessFlags = {
        canReadMember: access.canReadMemberDetails,
        canReadScout: access.canReadScoutDetails,
        canReadCommand: access.canReadCommandDetails,
    };
    const company = await loadLunarCompanyBySlug({
        slug,
        supabase,
        includeMember: access.canReadMemberDetails,
        includeScout: access.canReadScoutDetails,
        includeCommand: access.canReadCommandDetails,
    });

    if (!company) {
        notFound();
    }

    const profileUnlocked = canRead(company.visibilityTier, accessFlags);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Lunar company profile
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            {company.name}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            {company.summary}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/companies"
                                className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Back to directory
                            </Link>
                            {company.websiteUrl ? (
                                <a
                                    href={company.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    Company site
                                </a>
                            ) : null}
                        </div>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Profile status
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Tier</dt>
                                <dd className="text-white">
                                    {companyTierLabel(company.visibilityTier)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Confidence</dt>
                                <dd className="text-white">
                                    {formatCompanyLabel(
                                        company.confidenceLabel
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Freshness</dt>
                                <dd className="text-white">
                                    {formatCompanyFreshness(
                                        company.freshnessAt
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Watchlist</dt>
                                <dd className="text-white">
                                    {access.canReadScoutDetails
                                        ? "Hook ready"
                                        : "Scout+"}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                        label="Sectors"
                        value={company.sectors.slice(0, 2).join(", ") || "TBD"}
                        detail={formatCompanyLabel(company.companyType)}
                    />
                    <Metric
                        label="Programs"
                        value={company.programs.slice(0, 2).join(", ") || "TBD"}
                        detail={company.headquarters ?? "Location pending"}
                    />
                    <Metric
                        label="Quality"
                        value={company.qualityScore.toFixed(0)}
                        detail={company.analystReviewState}
                    />
                    <Metric
                        label="Sources"
                        value={String(company.citations.length)}
                        detail={formatCompanyDate(company.lastSourceAt)}
                    />
                </dl>

                <div className="mt-8 space-y-8">
                    {profileUnlocked ? (
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-3xl text-white">
                                Lunar Relevance
                            </h2>
                            <p className="mt-4 text-sm leading-6 text-potomac-cream/75">
                                {company.lunarRelevance}
                            </p>
                            {company.publicFinancialSummary ? (
                                <p className="mt-4 text-sm leading-6 text-potomac-cream/65">
                                    {company.publicFinancialSummary}
                                </p>
                            ) : null}
                        </section>
                    ) : (
                        <LockedPanel tier={company.visibilityTier} />
                    )}

                    <CompanyDetails company={company} access={accessFlags} />
                    <Sources company={company} />
                </div>
            </div>
        </section>
    );
}
