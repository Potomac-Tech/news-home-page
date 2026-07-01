import type { Metadata } from "next";
import Link from "next/link";
import { getLunarMarketIntelAccess } from "../../lib/auth/lunar-market-intel";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import {
    canReadCompanyTier,
    companyMatchesFilter,
    companyMatchesQuery,
    companyTierLabel,
    formatCompanyFreshness,
    formatCompanyLabel,
    loadLunarCompanies,
    type LunarCompanyRecord,
} from "../_data/lunarCompanies";

export const metadata: Metadata = {
    title: "Lunar Companies",
    description:
        "Lunar company directory and comparison route for profiles, programs, contracts, facilities, leadership, and relationships.",
    alternates: {
        canonical: "/companies",
    },
};

const allowedFilters = new Set([
    "public",
    "landers",
    "launch",
    "clps",
    "financials",
]);

function SearchBox({ query }: { query: string }) {
    return (
        <form action="/companies" className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="company-search">
                Search companies
            </label>
            <input
                id="company-search"
                name="q"
                defaultValue={query}
                placeholder="Search company, sector, program, headquarters..."
                className="min-h-12 flex-1 rounded border border-white/15 bg-potomac-primary/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-potomac-cream/40 focus:border-potomac-gold"
            />
            <button
                type="submit"
                className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
            >
                Search
            </button>
        </form>
    );
}

function FilterBar({ activeFilter }: { activeFilter: string }) {
    const filters = [
        { label: "All", value: "all", href: "/companies" },
        { label: "Public", value: "public", href: "/companies?filter=public" },
        { label: "Landers", value: "landers", href: "/companies?filter=landers" },
        { label: "Launch", value: "launch", href: "/companies?filter=launch" },
        { label: "CLPS", value: "clps", href: "/companies?filter=clps" },
        {
            label: "Financials",
            value: "financials",
            href: "/companies?filter=financials",
        },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
                const active = filter.value === activeFilter;

                return (
                    <Link
                        key={filter.value}
                        href={filter.href}
                        className={
                            active
                                ? "rounded bg-potomac-gold px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-potomac-primary"
                                : "rounded border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/65 transition hover:border-potomac-gold hover:text-potomac-gold"
                        }
                    >
                        {filter.label}
                    </Link>
                );
            })}
        </div>
    );
}

function gatedLabel(company: LunarCompanyRecord) {
    const gatedItems = [
        ...company.facilities,
        ...company.leadership,
        ...company.contracts,
        ...company.financials,
        ...company.newsLinks,
        ...company.relationships,
        ...company.comparisonAttributes,
    ].filter((item) => item.visibilityTier !== "public");

    if (!gatedItems.length) {
        return "Public profile";
    }

    const commandOnly = gatedItems.some(
        (item) => item.visibilityTier === "command"
    );

    return commandOnly ? "Command detail" : "Scout detail";
}

function CompanyCard({
    company,
    canReadMember,
    canReadScout,
    canReadCommand,
}: {
    company: LunarCompanyRecord;
    canReadMember: boolean;
    canReadScout: boolean;
    canReadCommand: boolean;
}) {
    const canReadProfile = canReadCompanyTier({
        tier: company.visibilityTier,
        canReadMember,
        canReadScout,
        canReadCommand,
    });
    const comparisonAttributes = company.comparisonAttributes.filter((item) =>
        canReadCompanyTier({
            tier: item.visibilityTier,
            canReadMember,
            canReadScout,
            canReadCommand,
        })
    );

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        {formatCompanyLabel(company.companyType)}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                        <Link
                            href={`/companies/${company.slug}`}
                            className="transition hover:text-potomac-gold"
                        >
                            {company.name}
                        </Link>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                        {company.summary}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded border border-potomac-gold/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                        {companyTierLabel(company.visibilityTier)}
                    </span>
                    <span className="rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                        {gatedLabel(company)}
                    </span>
                </div>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-l border-potomac-gold/35 pl-4">
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Sectors
                    </dt>
                    <dd className="mt-2 text-xl font-semibold text-white">
                        {company.sectors.slice(0, 2).join(", ") || "TBD"}
                    </dd>
                </div>
                <div className="border-l border-potomac-gold/35 pl-4">
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Programs
                    </dt>
                    <dd className="mt-2 text-xl font-semibold text-white">
                        {company.programs.slice(0, 2).join(", ") || "TBD"}
                    </dd>
                </div>
                <div className="border-l border-potomac-gold/35 pl-4">
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Quality
                    </dt>
                    <dd className="mt-2 text-xl font-semibold text-white">
                        {company.qualityScore.toFixed(0)}
                    </dd>
                </div>
                <div className="border-l border-potomac-gold/35 pl-4">
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        Freshness
                    </dt>
                    <dd className="mt-2 text-xl font-semibold text-white">
                        {formatCompanyFreshness(company.freshnessAt)}
                    </dd>
                </div>
            </dl>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <section className="rounded border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Lunar relevance
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                        {canReadProfile
                            ? company.lunarRelevance
                            : "Approved Explorer access unlocks the full company relevance note."}
                    </p>
                </section>
                <div className="space-y-4">
                    <div className="rounded border border-white/10 bg-white/[0.02] p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                            Watchlist hook
                        </p>
                        <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                            Scout and Command watchlists will attach to this
                            company profile when saved-work controls land.
                        </p>
                    </div>
                    <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-sm leading-6 text-potomac-cream/65">
                        <p>
                            Facilities:{" "}
                            <span className="text-white">
                                {company.facilities.length}
                            </span>
                        </p>
                        <p>
                            Contracts:{" "}
                            <span className="text-white">
                                {company.contracts.length}
                            </span>
                        </p>
                        <p>
                            Comparison fields:{" "}
                            <span className="text-white">
                                {comparisonAttributes.length}
                            </span>
                        </p>
                    </div>
                    <Link
                        href={`/companies/${company.slug}`}
                        className="inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Profile
                    </Link>
                </div>
            </div>
        </article>
    );
}

function ComparisonTable({
    companies,
    canReadMember,
    canReadScout,
    canReadCommand,
}: {
    companies: LunarCompanyRecord[];
    canReadMember: boolean;
    canReadScout: boolean;
    canReadCommand: boolean;
}) {
    const rows = companies.slice(0, 6);

    return (
        <section className="glass-card rounded p-6">
            <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Comparison table
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white">
                    Company Positioning
                </h2>
            </div>
            <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                        <tr className="border-b border-white/10">
                            <th className="py-3 pr-4">Company</th>
                            <th className="px-4 py-3">Sectors</th>
                            <th className="px-4 py-3">Programs</th>
                            <th className="px-4 py-3">Quality</th>
                            <th className="px-4 py-3">Visible fields</th>
                            <th className="py-3 pl-4">Freshness</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-potomac-cream/70">
                        {rows.map((company) => {
                            const visibleFields =
                                company.comparisonAttributes.filter((item) =>
                                    canReadCompanyTier({
                                        tier: item.visibilityTier,
                                        canReadMember,
                                        canReadScout,
                                        canReadCommand,
                                    })
                                );

                            return (
                                <tr key={company.id}>
                                    <td className="py-4 pr-4 font-semibold text-white">
                                        <Link
                                            href={`/companies/${company.slug}`}
                                            className="transition hover:text-potomac-gold"
                                        >
                                            {company.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4">
                                        {company.sectors.join(", ") || "TBD"}
                                    </td>
                                    <td className="px-4 py-4">
                                        {company.programs.join(", ") || "TBD"}
                                    </td>
                                    <td className="px-4 py-4 text-white">
                                        {company.qualityScore.toFixed(0)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {visibleFields
                                            .map((item) => item.label)
                                            .join(", ") || "Tier gated"}
                                    </td>
                                    <td className="py-4 pl-4">
                                        {formatCompanyFreshness(
                                            company.freshnessAt
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default async function CompaniesPage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
    const params = await searchParams;
    const activeFilter =
        params?.filter && allowedFilters.has(params.filter)
            ? params.filter
            : "all";
    const query = params?.q ?? "";
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
    const companies = await loadLunarCompanies({
        supabase,
        includeMember: access.canReadMemberDetails,
        includeScout: access.canReadScoutDetails,
        includeCommand: access.canReadCommandDetails,
    });
    const visibleCompanies = companies
        .filter((company) => companyMatchesFilter(company, activeFilter))
        .filter((company) => companyMatchesQuery(company, query));
    const fallback = visibleCompanies.some((company) => company.isFallback);
    const lockedCount = visibleCompanies.filter(
        (company) =>
            !canReadCompanyTier({
                tier: company.visibilityTier,
                canReadMember: access.canReadMemberDetails,
                canReadScout: access.canReadScoutDetails,
                canReadCommand: access.canReadCommandDetails,
            })
    ).length;

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Lunar company intelligence
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Company Directory
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Search lunar companies by sector, program,
                            contracts, facilities, leadership, public
                            financial context, relationships, and comparison
                            attributes.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Directory status
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Companies</dt>
                                <dd className="text-white">
                                    {visibleCompanies.length}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Locked profiles</dt>
                                <dd className="text-white">{lockedCount}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Source mode</dt>
                                <dd className="text-white">
                                    {fallback ? "Fallback" : "Supabase"}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Access</dt>
                                <dd className="text-white">
                                    {access.canReadScoutDetails
                                        ? "Scout+"
                                        : access.canReadMemberDetails
                                          ? "Explorer"
                                          : "Preview"}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <div className="mt-10 space-y-5 border-y border-white/10 py-5">
                    <SearchBox query={query} />
                    <FilterBar activeFilter={activeFilter} />
                </div>

                {!access.canReadScoutDetails ? (
                    <section className="glass-card mt-8 rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Scout comparison detail
                        </p>
                        <h2 className="mt-2 font-serif text-3xl text-white">
                            Unlock deeper company diligence.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Public visitors can inspect profile teasers and
                            source posture. Explorer members see member-level
                            context. Scout and Command users unlock financial
                            metrics, contracts, comparison attributes, and
                            watchlist-ready records where RLS allows.
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
                ) : null}

                <div className="mt-8 space-y-6">
                    {visibleCompanies.length ? (
                        visibleCompanies.map((company) => (
                            <CompanyCard
                                key={company.id}
                                company={company}
                                canReadMember={access.canReadMemberDetails}
                                canReadScout={access.canReadScoutDetails}
                                canReadCommand={access.canReadCommandDetails}
                            />
                        ))
                    ) : (
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-3xl text-white">
                                No matching company profiles.
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                Change filters or search terms to return to the
                                full directory.
                            </p>
                        </section>
                    )}
                </div>

                <div className="mt-8">
                    <ComparisonTable
                        companies={visibleCompanies}
                        canReadMember={access.canReadMemberDetails}
                        canReadScout={access.canReadScoutDetails}
                        canReadCommand={access.canReadCommandDetails}
                    />
                </div>
            </div>
        </section>
    );
}
