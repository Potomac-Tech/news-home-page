import type { Metadata } from "next";
import { requireCompanyUniverseStaff } from "../../../lib/auth/company-universe";
import {
    createCompany,
    createQuote,
    createRankingSnapshot,
    updateCompany,
    updateQuote,
    updateRankingRun,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Public Company Universe Admin",
};

type Company = {
    id: string;
    company_name: string;
    ticker_symbol: string;
    exchange_code: string;
    country_code: string | null;
    website_url: string | null;
    investor_relations_url: string | null;
    sector: string;
    lunar_relevance: string;
    status: string;
    ranking_eligible: boolean;
    ranking_metric: string;
    ranking_metric_value: number | null;
    ranking_metric_currency: string;
    ranking_metric_as_of_date: string | null;
    ranking_source_name: string | null;
    ranking_source_url: string | null;
    ranking_source_retrieved_at: string | null;
    eligibility_notes: string | null;
    exclusion_reason: string | null;
    updated_at: string;
};

type RankingRun = {
    id: string;
    ranking_metric: string;
    ranking_date: string;
    source_name: string;
    source_url: string | null;
    source_retrieved_at: string;
    publication_status: string;
    notes: string | null;
    generated_at: string;
    published_at: string | null;
};

type Ranking = {
    id: string;
    ranking_run_id: string;
    company_id: string;
    rank_number: number;
    ranking_metric_value: number;
    metric_as_of_date: string;
    company_name_snapshot: string;
    ticker_symbol_snapshot: string;
    exchange_code_snapshot: string;
    company_metric_source_name: string | null;
    company_metric_source_url: string | null;
    created_at: string;
};

type Quote = {
    id: string;
    company_id: string;
    company_name_snapshot: string;
    ticker_symbol_snapshot: string;
    exchange_code_snapshot: string;
    quote_as_of_at: string;
    source_name: string;
    source_url: string | null;
    source_retrieved_at: string;
    delay_minutes: number;
    currency_code: string;
    last_price: number;
    price_change: number | null;
    price_change_percent: number | null;
    market_state: string;
    is_displayable: boolean;
    updated_at: string;
};

const companyStatuses = [
    "watchlist",
    "active",
    "inactive",
    "delisted",
    "excluded",
];
const rankingMetrics = [
    "market_cap_usd",
    "enterprise_value_usd",
    "revenue_ttm_usd",
    "space_revenue_estimate_usd",
];
const rankingStatuses = ["draft", "published", "archived"];

const inputClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const textareaClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

function FieldLabel({ children }: { children: string }) {
    return (
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
            {children}
        </label>
    );
}

function statusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function SelectField({
    name,
    options,
    defaultValue,
}: {
    name: string;
    options: string[];
    defaultValue: string;
}) {
    return (
        <select name={name} defaultValue={defaultValue} className={inputClass}>
            {options.map((option) => (
                <option key={option} value={option}>
                    {statusLabel(option)}
                </option>
            ))}
        </select>
    );
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleString();
}

function toDateValue(value: string | null | undefined) {
    return value ? value.slice(0, 10) : "";
}

function toDateTimeLocal(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 16);
}

function formatMetricValue(
    value: number | null | undefined,
    currencyCode = "USD"
) {
    if (value == null) {
        return "Not set";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        notation: value >= 1_000_000_000 ? "compact" : "standard",
        maximumFractionDigits: value >= 1_000_000_000 ? 1 : 0,
    }).format(value);
}

function formatQuotePrice(value: number, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatSignedNumber(value: number | null | undefined, suffix = "") {
    if (value == null) {
        return "Not set";
    }

    const sign = value > 0 ? "+" : "";

    return `${sign}${value.toFixed(2)}${suffix}`;
}

function CompanySelect({
    companies,
    defaultValue,
}: {
    companies: Company[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="company_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select company
            </option>
            {companies.map((company) => (
                <option key={company.id} value={company.id}>
                    {company.company_name} ({company.exchange_code}:
                    {company.ticker_symbol})
                </option>
            ))}
        </select>
    );
}

function CompanyFormFields({ company }: { company?: Company }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Company name</FieldLabel>
                <input
                    required
                    name="company_name"
                    defaultValue={company?.company_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <FieldLabel>Ticker</FieldLabel>
                    <input
                        required
                        name="ticker_symbol"
                        defaultValue={company?.ticker_symbol ?? ""}
                        className={inputClass}
                    />
                </div>
                <div>
                    <FieldLabel>Exchange</FieldLabel>
                    <input
                        required
                        name="exchange_code"
                        defaultValue={company?.exchange_code ?? ""}
                        className={inputClass}
                    />
                </div>
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <SelectField
                    name="status"
                    options={companyStatuses}
                    defaultValue={company?.status ?? "watchlist"}
                />
            </div>
            <div>
                <FieldLabel>Sector</FieldLabel>
                <input
                    required
                    name="sector"
                    defaultValue={company?.sector ?? "Space infrastructure"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Country code</FieldLabel>
                <input
                    name="country_code"
                    maxLength={2}
                    defaultValue={company?.country_code ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Website URL</FieldLabel>
                <input
                    name="website_url"
                    defaultValue={company?.website_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Investor relations URL</FieldLabel>
                <input
                    name="investor_relations_url"
                    defaultValue={company?.investor_relations_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Ranking metric</FieldLabel>
                <SelectField
                    name="ranking_metric"
                    options={rankingMetrics}
                    defaultValue={company?.ranking_metric ?? "market_cap_usd"}
                />
            </div>
            <div>
                <FieldLabel>Metric value</FieldLabel>
                <input
                    name="ranking_metric_value"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={company?.ranking_metric_value ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Metric currency</FieldLabel>
                <input
                    name="ranking_metric_currency"
                    maxLength={3}
                    defaultValue={company?.ranking_metric_currency ?? "USD"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Metric date</FieldLabel>
                <input
                    name="ranking_metric_as_of_date"
                    type="date"
                    defaultValue={toDateValue(
                        company?.ranking_metric_as_of_date
                    )}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Metric source</FieldLabel>
                <input
                    name="ranking_source_name"
                    defaultValue={company?.ranking_source_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Metric source URL</FieldLabel>
                <input
                    name="ranking_source_url"
                    defaultValue={company?.ranking_source_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Source retrieved</FieldLabel>
                <input
                    name="ranking_source_retrieved_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(
                        company?.ranking_source_retrieved_at
                    )}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="ranking_eligible"
                        defaultChecked={company?.ranking_eligible ?? false}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Ranking eligible
                </label>
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Lunar relevance</FieldLabel>
                <textarea
                    name="lunar_relevance"
                    rows={3}
                    defaultValue={company?.lunar_relevance ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Eligibility notes</FieldLabel>
                <textarea
                    name="eligibility_notes"
                    rows={3}
                    defaultValue={company?.eligibility_notes ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Exclusion reason</FieldLabel>
                <textarea
                    name="exclusion_reason"
                    rows={3}
                    defaultValue={company?.exclusion_reason ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function QuoteFormFields({
    quote,
    companies,
}: {
    quote?: Quote;
    companies: Company[];
}) {
    const defaultQuoteTime =
        quote?.quote_as_of_at ?? new Date().toISOString();

    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
                <FieldLabel>Company</FieldLabel>
                <CompanySelect
                    companies={companies}
                    defaultValue={quote?.company_id}
                />
            </div>
            <div>
                <FieldLabel>Quote time</FieldLabel>
                <input
                    required
                    name="quote_as_of_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(defaultQuoteTime)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Delay minutes</FieldLabel>
                <input
                    name="delay_minutes"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={quote?.delay_minutes ?? 15}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Last price</FieldLabel>
                <input
                    required
                    name="last_price"
                    type="number"
                    min="0"
                    step="0.0001"
                    defaultValue={quote?.last_price ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Currency</FieldLabel>
                <input
                    name="quote_currency_code"
                    maxLength={3}
                    defaultValue={quote?.currency_code ?? "USD"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Price change</FieldLabel>
                <input
                    name="price_change"
                    type="number"
                    step="0.0001"
                    defaultValue={quote?.price_change ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Change percent</FieldLabel>
                <input
                    name="price_change_percent"
                    type="number"
                    step="0.0001"
                    defaultValue={quote?.price_change_percent ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Source</FieldLabel>
                <input
                    required
                    name="quote_source_name"
                    defaultValue={quote?.source_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Source URL</FieldLabel>
                <input
                    name="quote_source_url"
                    defaultValue={quote?.source_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Source retrieved</FieldLabel>
                <input
                    name="quote_source_retrieved_at"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(quote?.source_retrieved_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Market state</FieldLabel>
                <input
                    name="market_state"
                    defaultValue={quote?.market_state ?? "delayed"}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="is_displayable"
                        defaultChecked={quote?.is_displayable ?? false}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Displayable
                </label>
            </div>
        </div>
    );
}

function RankingSnapshotForm() {
    const today = new Date().toISOString().slice(0, 10);

    return (
        <form action={createRankingSnapshot} className="glass-card rounded p-6">
            <h2 className="font-serif text-2xl text-white">
                Generate Top 20 Snapshot
            </h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                    <FieldLabel>Metric</FieldLabel>
                    <SelectField
                        name="target_metric"
                        options={rankingMetrics}
                        defaultValue="market_cap_usd"
                    />
                </div>
                <div>
                    <FieldLabel>Ranking date</FieldLabel>
                    <input
                        required
                        name="target_ranking_date"
                        type="date"
                        defaultValue={today}
                        className={inputClass}
                    />
                </div>
                <div>
                    <FieldLabel>Snapshot source</FieldLabel>
                    <input required name="source_name" className={inputClass} />
                </div>
                <div>
                    <FieldLabel>Snapshot source URL</FieldLabel>
                    <input name="source_url" className={inputClass} />
                </div>
                <div className="lg:col-span-2">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                        name="notes"
                        rows={3}
                        className={textareaClass}
                    />
                </div>
                <div className="lg:col-span-2">
                    <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                        <input
                            type="checkbox"
                            name="publish_snapshot"
                            className="h-4 w-4 accent-potomac-gold"
                        />
                        Publish snapshot
                    </label>
                </div>
            </div>
            <button
                type="submit"
                className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
            >
                Generate snapshot
            </button>
        </form>
    );
}

export default async function PublicCompanyUniverseAdminPage() {
    const { supabase } = await requireCompanyUniverseStaff();
    const [companiesResult, rankingRunsResult, rankingsResult, quotesResult] =
        await Promise.all([
            supabase
                .from("public_space_companies")
                .select(
                    "id,company_name,ticker_symbol,exchange_code,country_code,website_url,investor_relations_url,sector,lunar_relevance,status,ranking_eligible,ranking_metric,ranking_metric_value,ranking_metric_currency,ranking_metric_as_of_date,ranking_source_name,ranking_source_url,ranking_source_retrieved_at,eligibility_notes,exclusion_reason,updated_at"
                )
                .order("company_name"),
            supabase
                .from("public_space_company_ranking_runs")
                .select(
                    "id,ranking_metric,ranking_date,source_name,source_url,source_retrieved_at,publication_status,notes,generated_at,published_at"
                )
                .order("ranking_date", { ascending: false })
                .order("generated_at", { ascending: false }),
            supabase
                .from("public_space_company_rankings")
                .select(
                    "id,ranking_run_id,company_id,rank_number,ranking_metric_value,metric_as_of_date,company_name_snapshot,ticker_symbol_snapshot,exchange_code_snapshot,company_metric_source_name,company_metric_source_url,created_at"
                )
                .order("rank_number"),
            supabase
                .from("public_space_company_quotes")
                .select(
                    "id,company_id,company_name_snapshot,ticker_symbol_snapshot,exchange_code_snapshot,quote_as_of_at,source_name,source_url,source_retrieved_at,delay_minutes,currency_code,last_price,price_change,price_change_percent,market_state,is_displayable,updated_at"
                )
                .order("quote_as_of_at", { ascending: false })
                .limit(50),
        ]);

    if (companiesResult.error) {
        throw new Error(companiesResult.error.message);
    }

    if (rankingRunsResult.error) {
        throw new Error(rankingRunsResult.error.message);
    }

    if (rankingsResult.error) {
        throw new Error(rankingsResult.error.message);
    }

    if (quotesResult.error) {
        throw new Error(quotesResult.error.message);
    }

    const companies = (companiesResult.data ?? []) as Company[];
    const rankingRuns = (rankingRunsResult.data ?? []) as RankingRun[];
    const rankings = (rankingsResult.data ?? []) as Ranking[];
    const quotes = (quotesResult.data ?? []) as Quote[];
    const rankingsByRunId = new Map<string, Ranking[]>();

    rankings.forEach((ranking) => {
        const runRankings = rankingsByRunId.get(ranking.ranking_run_id) ?? [];
        runRankings.push(ranking);
        rankingsByRunId.set(ranking.ranking_run_id, runRankings);
    });

    const eligibleCompanies = companies.filter(
        (company) => company.ranking_eligible && company.status === "active"
    );

    return (
        <section className="min-h-screen bg-potomac-gray text-potomac-cream">
            <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
                <div className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-potomac-gold">
                            Admin
                        </p>
                        <h1 className="mt-3 font-serif text-4xl text-white md:text-5xl">
                            Public Company Universe
                        </h1>
                    </div>
                    <dl className="grid gap-4 text-sm text-potomac-cream/70 sm:grid-cols-3">
                        <div>
                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                Companies
                            </dt>
                            <dd className="mt-1 text-2xl text-white">
                                {companies.length}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                Eligible
                            </dt>
                            <dd className="mt-1 text-2xl text-white">
                                {eligibleCompanies.length}
                            </dd>
                        </div>
                        <div>
                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                Snapshots
                            </dt>
                            <dd className="mt-1 text-2xl text-white">
                                {rankingRuns.length}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
                    <section>
                        <h2 className="font-serif text-3xl text-white">
                            Company Records
                        </h2>
                        <div className="mt-5 space-y-5">
                            <form action={createCompany} className="glass-card rounded p-6">
                                <h3 className="font-serif text-2xl text-white">
                                    Add Company
                                </h3>
                                <div className="mt-5">
                                    <CompanyFormFields />
                                </div>
                                <button
                                    type="submit"
                                    className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    Add company
                                </button>
                            </form>

                            {companies.length === 0 ? (
                                <div className="glass-card rounded p-6 text-potomac-cream/75">
                                    No public companies yet.
                                </div>
                            ) : (
                                companies.map((company) => (
                                    <article
                                        key={company.id}
                                        className="glass-card rounded p-6"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-5">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="font-serif text-2xl text-white">
                                                        {company.company_name}
                                                    </h3>
                                                    <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                        {statusLabel(
                                                            company.status
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-potomac-cream/65">
                                                    {company.exchange_code}:{" "}
                                                    {company.ticker_symbol} |{" "}
                                                    {company.sector}
                                                </p>
                                            </div>
                                            <div className="text-right text-sm text-potomac-cream/70">
                                                <p className="font-semibold text-white">
                                                    {formatMetricValue(
                                                        company.ranking_metric_value,
                                                        company.ranking_metric_currency
                                                    )}
                                                </p>
                                                <p className="mt-1">
                                                    {statusLabel(
                                                        company.ranking_metric
                                                    )}{" "}
                                                    |{" "}
                                                    {formatDate(
                                                        company.ranking_metric_as_of_date
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/70 md:grid-cols-3">
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                    Eligible
                                                </dt>
                                                <dd className="mt-1">
                                                    {company.ranking_eligible
                                                        ? "Yes"
                                                        : "No"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                    Source
                                                </dt>
                                                <dd className="mt-1">
                                                    {company.ranking_source_name ??
                                                        "Not set"}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                    Updated
                                                </dt>
                                                <dd className="mt-1">
                                                    {formatDateTime(
                                                        company.updated_at
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>

                                        <details className="mt-6 border-y border-white/10 py-5">
                                            <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                Edit company
                                            </summary>
                                            <form action={updateCompany} className="mt-6">
                                                <input
                                                    type="hidden"
                                                    name="company_id"
                                                    value={company.id}
                                                />
                                                <CompanyFormFields
                                                    company={company}
                                                />
                                                <button
                                                    type="submit"
                                                    className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                >
                                                    Save company
                                                </button>
                                            </form>
                                        </details>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <aside className="space-y-8">
                        <RankingSnapshotForm />
                        <section>
                            <form action={createQuote} className="glass-card rounded p-6">
                                <h2 className="font-serif text-2xl text-white">
                                    Add Delayed Quote
                                </h2>
                                <div className="mt-5">
                                    <QuoteFormFields companies={companies} />
                                </div>
                                <button
                                    type="submit"
                                    className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                >
                                    Add quote
                                </button>
                            </form>

                            <h2 className="mt-8 font-serif text-3xl text-white">
                                Delayed Quotes
                            </h2>
                            <div className="mt-5 space-y-5">
                                {quotes.length === 0 ? (
                                    <div className="glass-card rounded p-6 text-potomac-cream/75">
                                        No delayed quotes yet.
                                    </div>
                                ) : (
                                    quotes.map((quote) => (
                                        <article
                                            key={quote.id}
                                            className="glass-card rounded p-6"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="font-serif text-2xl text-white">
                                                            {
                                                                quote.ticker_symbol_snapshot
                                                            }
                                                        </h3>
                                                        <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                            {quote.is_displayable
                                                                ? "Displayable"
                                                                : "Draft"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-potomac-cream/65">
                                                        {
                                                            quote.company_name_snapshot
                                                        }{" "}
                                                        |{" "}
                                                        {
                                                            quote.exchange_code_snapshot
                                                        }
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm">
                                                    <p className="font-semibold text-white">
                                                        {formatQuotePrice(
                                                            quote.last_price,
                                                            quote.currency_code
                                                        )}
                                                    </p>
                                                    <p
                                                        className={
                                                            quote.price_change !=
                                                                null &&
                                                            quote.price_change < 0
                                                                ? "mt-1 text-red-200"
                                                                : "mt-1 text-potomac-gold"
                                                        }
                                                    >
                                                        {formatSignedNumber(
                                                            quote.price_change
                                                        )}{" "}
                                                        |{" "}
                                                        {formatSignedNumber(
                                                            quote.price_change_percent,
                                                            "%"
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <dl className="mt-5 grid gap-4 text-sm text-potomac-cream/70 md:grid-cols-2">
                                                <div>
                                                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        Quote time
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {formatDateTime(
                                                            quote.quote_as_of_at
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        Source
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {quote.source_name} |{" "}
                                                        {quote.delay_minutes}m
                                                    </dd>
                                                </div>
                                            </dl>
                                            <details className="mt-6 border-y border-white/10 py-5">
                                                <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                    Edit quote
                                                </summary>
                                                <form
                                                    action={updateQuote}
                                                    className="mt-6"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="quote_id"
                                                        value={quote.id}
                                                    />
                                                    <QuoteFormFields
                                                        quote={quote}
                                                        companies={companies}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                    >
                                                        Save quote
                                                    </button>
                                                </form>
                                            </details>
                                        </article>
                                    ))
                                )}
                            </div>
                        </section>
                        <section>
                            <h2 className="font-serif text-3xl text-white">
                                Ranking Snapshots
                            </h2>
                            <div className="mt-5 space-y-5">
                                {rankingRuns.length === 0 ? (
                                    <div className="glass-card rounded p-6 text-potomac-cream/75">
                                        No ranking snapshots yet.
                                    </div>
                                ) : (
                                    rankingRuns.map((run) => {
                                        const runRankings =
                                            rankingsByRunId.get(run.id) ?? [];

                                        return (
                                            <article
                                                key={run.id}
                                                className="glass-card rounded p-6"
                                            >
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="font-serif text-2xl text-white">
                                                        {formatDate(
                                                            run.ranking_date
                                                        )}
                                                    </h3>
                                                    <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                        {statusLabel(
                                                            run.publication_status
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-potomac-cream/65">
                                                    {statusLabel(
                                                        run.ranking_metric
                                                    )}{" "}
                                                    | {run.source_name}
                                                </p>
                                                <ol className="mt-5 space-y-3">
                                                    {runRankings.map(
                                                        (ranking) => (
                                                            <li
                                                                key={ranking.id}
                                                                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded border border-white/10 p-3 text-sm"
                                                            >
                                                                <span className="font-bold text-potomac-gold">
                                                                    #
                                                                    {
                                                                        ranking.rank_number
                                                                    }
                                                                </span>
                                                                <span>
                                                                    {
                                                                        ranking.company_name_snapshot
                                                                    }
                                                                    <span className="ml-2 text-potomac-cream/50">
                                                                        {
                                                                            ranking.exchange_code_snapshot
                                                                        }
                                                                        :
                                                                        {
                                                                            ranking.ticker_symbol_snapshot
                                                                        }
                                                                    </span>
                                                                </span>
                                                                <span className="text-right text-white">
                                                                    {formatMetricValue(
                                                                        ranking.ranking_metric_value
                                                                    )}
                                                                </span>
                                                            </li>
                                                        )
                                                    )}
                                                </ol>
                                                <form
                                                    action={updateRankingRun}
                                                    className="mt-5 border-t border-white/10 pt-5"
                                                >
                                                    <input
                                                        type="hidden"
                                                        name="ranking_run_id"
                                                        value={run.id}
                                                    />
                                                    <div>
                                                        <FieldLabel>Status</FieldLabel>
                                                        <SelectField
                                                            name="publication_status"
                                                            options={
                                                                rankingStatuses
                                                            }
                                                            defaultValue={
                                                                run.publication_status
                                                            }
                                                        />
                                                    </div>
                                                    <div className="mt-4">
                                                        <FieldLabel>Notes</FieldLabel>
                                                        <textarea
                                                            name="notes"
                                                            rows={3}
                                                            defaultValue={
                                                                run.notes ?? ""
                                                            }
                                                            className={
                                                                textareaClass
                                                            }
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className="mt-5 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                    >
                                                        Save snapshot
                                                    </button>
                                                </form>
                                            </article>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}
