import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getWeeklyTrackerAccess } from "../../../lib/auth/weekly-tracker";
import { createClient } from "../../../lib/supabase/server";
import {
    loadContractAwards,
    type ContractAwardRow,
} from "../../_data/contractAwards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
    title: "New Contract Awards",
    description:
        "Reviewed space and lunar contract awards with customers, vendors, dates, confidence, and cited value evidence.",
    alternates: { canonical: "/tracker/contracts" },
};

function formatDate(value: string | null) {
    if (!value) return "Not scheduled";
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(`${value}T12:00:00Z`));
}

function formatTimestamp(value: string | null) {
    if (!value) return "Pending";
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(new Date(value));
}

function formatMoney(value: number | null, currency: string) {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function awardValue(row: ContractAwardRow) {
    if (!row.value || ["unknown", "withheld"].includes(row.value.state)) {
        return "Not disclosed";
    }
    if (row.value.state === "exact_cited") {
        return formatMoney(row.value.exact, row.value.currency);
    }
    if (row.value.state === "cited_range") {
        return `${formatMoney(row.value.low, row.value.currency)} - ${formatMoney(row.value.high, row.value.currency)}`;
    }
    return formatMoney(row.value.estimate, row.value.currency);
}

function AccessNotice({
    state,
    href,
}: {
    state: "signed_out" | "email_unverified";
    href: string;
}) {
    const unverified = state === "email_unverified";
    return (
        <aside className="border-y border-potomac-gold/30 bg-potomac-primary/80">
            <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-4 px-4 py-5 sm:flex-row sm:items-center md:px-8">
                <div>
                    <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                        {unverified ? "Email verification required" : "Public award briefs"}
                    </p>
                    <p className="mt-1 text-sm text-potomac-cream/70">
                        {unverified
                            ? "Verify your email to open Explorer member award records."
                            : "Sign in or create free Explorer access for reviewed member award records."}
                    </p>
                </div>
                <Link
                    href={href}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center justify-center bg-potomac-gold px-5 font-mono text-xs font-bold uppercase text-potomac-primary"
                >
                    {unverified ? "Verify email" : "Request access"}
                </Link>
            </div>
        </aside>
    );
}

export default async function ContractAwardsPage() {
    const supabase = await createClient();
    const access = await getWeeklyTrackerAccess({
        supabase,
        nextPath: "/tracker/contracts",
    });

    if (access.state === "profile_incomplete" && access.profileHref) {
        redirect(access.profileHref);
    }

    const { rows, unavailable } = await loadContractAwards({ supabase });
    const publicState =
        access.state === "signed_out" || access.state === "email_unverified"
            ? access.state
            : null;

    return (
        <main className="bg-grid-pattern min-h-screen">
            <header className="border-b border-potomac-gold/20 bg-potomac-primary/80">
                <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
                    <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                        Member terminal / Market operations
                    </p>
                    <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                        <div>
                            <h1 className="whitespace-nowrap font-serif text-3xl leading-tight uppercase text-white sm:text-4xl md:text-6xl">
                                New Contract Awards
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-potomac-cream/70">
                                Direct space and lunar awards only. General aerospace and defense records remain excluded unless the cited award establishes direct relevance.
                            </p>
                        </div>
                        <nav aria-label="Operational trackers" className="grid w-full max-w-lg grid-cols-2 border border-potomac-gold/30 p-1">
                            <Link href="/tracker/launches" className="flex min-h-11 items-center justify-center px-3 text-center font-mono text-xs font-bold uppercase text-potomac-cream">Launches &amp; Missions</Link>
                            <span aria-current="page" className="flex min-h-11 items-center justify-center bg-potomac-gold px-3 text-center font-mono text-xs font-bold uppercase text-potomac-primary">Contract Awards</span>
                        </nav>
                    </div>
                </div>
            </header>

            {publicState ? (
                <AccessNotice state={publicState} href={access.loginHref} />
            ) : null}

            <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
                {!access.canUsePremiumTools && !publicState ? (
                    <div className="mb-6 flex flex-col justify-between gap-3 border-y border-white/10 py-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-potomac-cream/70">
                            Explorer includes reviewed award briefs. Values, methodology, and premium detail require Scout or Meridian.
                        </p>
                        <Link
                            href="/upgrade?tier=scout&source=contract-awards&content=premium-details&next=%2Ftracker%2Fcontracts"
                            prefetch={false}
                            className="font-mono text-xs font-bold uppercase text-potomac-gold"
                        >
                            Unlock premium details
                        </Link>
                    </div>
                ) : null}

                {rows.length ? (
                    <div className="grid gap-4">
                        {rows.map((row) => (
                            <article key={row.id} className="border border-potomac-gold/25 bg-potomac-primary/70 p-5 md:p-6">
                                <div className="flex flex-col justify-between gap-4 md:flex-row">
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                                            Awarded {formatDate(row.awardDate)} / {row.scope}
                                        </p>
                                        <h2 className="mt-2 break-words font-serif text-2xl uppercase text-white md:text-3xl">{row.title}</h2>
                                        <p className="mt-3 max-w-4xl text-sm leading-6 text-potomac-cream/70">{row.relevance}</p>
                                    </div>
                                    <div className="shrink-0 text-left md:text-right">
                                        <p className="font-mono text-xs uppercase text-potomac-cream/60">Confidence</p>
                                        <p className="mt-1 font-mono text-sm font-bold uppercase text-white">{row.confidence}</p>
                                    </div>
                                </div>

                                <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                                    {[
                                        ["Customer", row.customer],
                                        ["Vendor", row.vendor],
                                        ["Program", row.program],
                                        ["Award vehicle", row.vehicle],
                                        ["Award number", row.awardNumber],
                                        ["Effective date", row.effectiveDate ? formatDate(row.effectiveDate) : null],
                                        ["Option exercise", row.optionExerciseDate ? formatDate(row.optionExerciseDate) : null],
                                    ].map(([term, value]) => (
                                        <div key={term} className="min-w-0">
                                            <dt className="font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">{term}</dt>
                                            <dd className="mt-1 break-words text-sm text-potomac-cream/80">{value || "Not specified"}</dd>
                                        </div>
                                    ))}
                                    <div className="min-w-0">
                                        <dt className="font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">Amount / value state</dt>
                                        <dd className="mt-1 break-words text-sm text-potomac-cream/80">
                                            {row.value ? (
                                                <>
                                                    {row.value.state.replaceAll("_", " ")} / {awardValue(row)}
                                                    {row.value.state === "analyst_estimate" && row.value.methodology ? (
                                                        <span className="mt-2 block text-xs leading-5 text-potomac-cream/60">Methodology: {row.value.methodology}</span>
                                                    ) : null}
                                                </>
                                            ) : access.canUsePremiumTools ? (
                                                "No reviewed value available"
                                            ) : (
                                                <Link
                                                    href="/upgrade?tier=scout&source=contract-awards&content=award-value&next=%2Ftracker%2Fcontracts"
                                                    prefetch={false}
                                                    className="font-bold text-potomac-gold underline-offset-4 hover:underline"
                                                >
                                                    Sign up or Log In for More Details
                                                </Link>
                                            )}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-potomac-cream/60">
                                    <p>Reviewer: {row.reviewer} / Last reviewed: {formatTimestamp(row.reviewedAt)}</p>
                                    {row.citations.length ? (
                                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                                            {row.citations.map((citation) => (
                                                <li key={citation.url}>
                                                    <a className="text-potomac-gold underline-offset-4 hover:underline" href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2">Citation pending publication review.</p>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="border border-potomac-gold/25 bg-potomac-primary/70 p-8">
                        <p className="font-mono text-xs font-bold uppercase text-potomac-gold">Source status</p>
                        <h2 className="mt-3 font-serif text-3xl uppercase text-white">
                            {unavailable ? "Award feed temporarily unavailable" : "No reviewed award briefs available"}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-potomac-cream/70">
                            {unavailable
                                ? "The module could not confirm current reviewed records. No fallback awards or values have been fabricated."
                                : "No directly space- or lunar-relevant awards are currently published for your access level."}
                        </p>
                        {publicState ? (
                            <Link href={access.loginHref} prefetch={false} className="mt-5 inline-flex min-h-11 items-center bg-potomac-gold px-5 font-mono text-xs font-bold uppercase text-potomac-primary">
                                {publicState === "email_unverified" ? "Verify email" : "Request Explorer access"}
                            </Link>
                        ) : null}
                    </div>
                )}
            </section>
        </main>
    );
}
