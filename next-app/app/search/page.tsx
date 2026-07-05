import type { Metadata } from "next";
import Link from "next/link";
import {
    canPreviewTier,
    getSearchSupabaseClient,
    loadSearchResults,
    searchResults,
    searchScopes,
    tierLabel,
    type SearchResult,
} from "../_data/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Search",
    description:
        "Global Cabeus Explorer terminal search for articles, events, companies, missions, datasets, procurement, regulatory records, methodology sources, and modules.",
    alternates: {
        canonical: "/search",
    },
};

const allowedScopes = new Set<string>(searchScopes.map((scope) => scope.value));

function formatFreshness(value: string | null) {
    if (!value) return "Freshness pending";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Freshness pending";

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(date);
}

function resultKindLabel(result: SearchResult) {
    return result.kind
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function SearchForm({ query, scope }: { query: string; scope: string }) {
    return (
        <form action="/search" className="grid gap-3 lg:grid-cols-[1fr_12rem_auto]">
            <label className="sr-only" htmlFor="global-search">
                Search Cabeus Explorer
            </label>
            <input
                id="global-search"
                name="q"
                defaultValue={query}
                placeholder="Search articles, companies, missions, datasets, procurement..."
                className="min-h-12 rounded border border-white/15 bg-potomac-primary/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-potomac-cream/40 focus:border-potomac-gold"
            />
            <label className="sr-only" htmlFor="search-scope">
                Search scope
            </label>
            <select
                id="search-scope"
                name="scope"
                defaultValue={scope}
                className="min-h-12 rounded border border-white/15 bg-potomac-primary/80 px-4 py-3 text-sm text-white outline-none transition focus:border-potomac-gold"
            >
                {searchScopes.map((searchScope) => (
                    <option
                        key={searchScope.value}
                        value={searchScope.value}
                        className="bg-potomac-primary text-white"
                    >
                        {searchScope.label}
                    </option>
                ))}
            </select>
            <button
                type="submit"
                className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
            >
                Search
            </button>
        </form>
    );
}

function ResultCard({ result }: { result: SearchResult }) {
    const publicPreview = canPreviewTier(result.tier);

    return (
        <article className="glass-card rounded p-5">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        {result.eyebrow}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                        <Link
                            href={result.href}
                            className="transition hover:text-potomac-gold"
                        >
                            {result.title}
                        </Link>
                    </h2>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                        {resultKindLabel(result)}
                    </span>
                    <span className="rounded border border-potomac-gold/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                        {tierLabel(result.tier)}
                    </span>
                    {result.isPinned ? (
                        <span className="rounded border border-potomac-gold/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                            Admin pinned
                        </span>
                    ) : null}
                </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-potomac-cream/75">
                {result.summary}
            </p>
            <p className="mt-4 border-l border-potomac-gold/35 pl-4 text-sm leading-6 text-potomac-cream/60">
                {result.snippet}
            </p>
            {!publicPreview ? (
                <p className="mt-3 rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-xs leading-5 text-potomac-cream/55">
                    {tierLabel(result.tier)} access is required for the full
                    result; public preview keeps the route discoverable.
                </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-[0.13em] text-potomac-cream/45">
                <span>{result.confidenceLabel} confidence</span>
                <span>{formatFreshness(result.freshnessAt)}</span>
                <span>{result.sourceCount} sources</span>
                <span>{result.isFallback ? "Fallback index" : "Supabase index"}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
                <Link
                    href={result.href}
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Open result
                </Link>
                {!publicPreview ? (
                    <Link
                        href="/pricing"
                        className="rounded border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-cream/60 transition hover:border-potomac-gold hover:text-potomac-gold"
                    >
                        Access options
                    </Link>
                ) : null}
            </div>
        </article>
    );
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams?: Promise<{ q?: string; scope?: string }>;
}) {
    const params = (await searchParams) ?? {};
    const query = params.q ?? "";
    const scope =
        params.scope && allowedScopes.has(params.scope) ? params.scope : "all";
    const supabase = await getSearchSupabaseClient();
    const allResults = await loadSearchResults({ supabase });
    const visibleResults = searchResults({ results: allResults, query, scope });
    const sourceMode = allResults.some((result) => result.isFallback)
        ? "Fallback"
        : "Supabase";

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Global search
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Search The Terminal
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Find public and gated intelligence across articles,
                            events, companies, lunar missions, datasets,
                            marketplace records, jobs, procurements, regulatory
                            records, methodology sources, and dashboard modules.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Index status
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Results</dt>
                                <dd className="text-white">
                                    {visibleResults.length}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Source mode</dt>
                                <dd className="text-white">{sourceMode}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Scope</dt>
                                <dd className="text-white">
                                    {
                                        searchScopes.find(
                                            (item) => item.value === scope
                                        )?.label
                                    }
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <div className="mt-10 border-y border-white/10 py-5">
                    <SearchForm query={query} scope={scope} />
                </div>

                <div className="mt-8 space-y-5">
                    {visibleResults.length ? (
                        visibleResults.map((result) => (
                            <ResultCard key={result.id} result={result} />
                        ))
                    ) : (
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-3xl text-white">
                                No matching intelligence records.
                            </h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-potomac-cream/70">
                                Try a broader scope, a company name, a mission
                                program, an agency, a source type, or a terminal
                                module name.
                            </p>
                            <Link
                                href="/search"
                                className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Reset search
                            </Link>
                        </section>
                    )}
                </div>
            </div>
        </section>
    );
}
