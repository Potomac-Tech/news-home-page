import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLunarMarketIntelAccess } from "../../../lib/auth/lunar-market-intel";
import { createClient } from "../../../lib/supabase/server";
import {
    dueDateForRecord,
    formatMarketIntelDate,
    formatMarketIntelFreshness,
    formatMarketIntelLabel,
    loadLunarMarketIntel,
    type LunarMarketRecord,
} from "../../_data/lunarMarketIntel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Member Procurement and Regulatory Hub",
};

function RecordRow({ record }: { record: LunarMarketRecord }) {
    const href =
        record.mode === "procurement"
            ? `/procurement/${record.slug}`
            : `/regulatory/${record.slug}`;

    return (
        <article className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        {record.mode} | {formatMarketIntelLabel(record.kind)}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                        <Link
                            href={href}
                            className="transition hover:text-potomac-gold"
                        >
                            {record.title}
                        </Link>
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                        {record.summary}
                    </p>
                </div>
                <dl className="grid shrink-0 gap-2 text-xs text-potomac-cream/55 sm:grid-cols-2 md:w-64">
                    <div>
                        <dt>Status</dt>
                        <dd className="text-potomac-cream/80">
                            {formatMarketIntelLabel(record.status)}
                        </dd>
                    </div>
                    <div>
                        <dt>Due</dt>
                        <dd className="text-potomac-cream/80">
                            {formatMarketIntelDate(dueDateForRecord(record))}
                        </dd>
                    </div>
                    <div>
                        <dt>Agency</dt>
                        <dd className="text-potomac-cream/80">
                            {record.agencyName ?? "TBD"}
                        </dd>
                    </div>
                    <div>
                        <dt>Freshness</dt>
                        <dd className="text-potomac-cream/80">
                            {formatMarketIntelFreshness(record.freshnessAt)}
                        </dd>
                    </div>
                </dl>
            </div>
        </article>
    );
}

export default async function MemberProcurementPage() {
    const supabase = await createClient();
    const access = await getLunarMarketIntelAccess({ supabase });

    if (!access.userId) {
        redirect("/auth/login?next=/member/procurement");
    }

    const canReadPaid =
        access.canReadScoutDetails || access.canReadCommandDetails;
    const [procurements, regulatory] = await Promise.all([
        loadLunarMarketIntel({
            mode: "procurement",
            supabase,
            includePaid: canReadPaid,
        }),
        loadLunarMarketIntel({
            mode: "regulatory",
            supabase,
            includePaid: canReadPaid,
        }),
    ]);
    const records = [...procurements, ...regulatory].slice(0, 8);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Scout and Command workspace
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Procurement and Regulatory Hub
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Monitor lunar opportunities, policy risk,
                            comment periods, source freshness, and
                            watchlist-ready records from one member workspace.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="/procurement"
                                className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Procurement hub
                            </Link>
                            <Link
                                href="/regulatory"
                                className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Regulatory hub
                            </Link>
                        </div>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access
                        </p>
                        <h2 className="mt-2 font-serif text-2xl text-white">
                            {canReadPaid ? "Scout+ active" : "Upgrade required"}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                            {canReadPaid
                                ? "Your role can read Scout/Command-visible records allowed by RLS."
                                : "Explorer members can preview the hubs. Scout or Command access unlocks the working queues."}
                        </p>
                        {!canReadPaid ? (
                            <Link
                                href="/pricing"
                                className="mt-5 inline-flex rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                            >
                                Compare tiers
                            </Link>
                        ) : null}
                    </aside>
                </div>

                <section className="glass-card mt-10 rounded p-6">
                    <div className="border-b border-white/10 pb-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Latest monitored records
                        </p>
                        <h2 className="mt-2 font-serif text-3xl text-white">
                            Opportunity and Policy Queue
                        </h2>
                    </div>
                    <div className="mt-5 space-y-4">
                        {records.map((record) => (
                            <RecordRow key={record.id} record={record} />
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
}
