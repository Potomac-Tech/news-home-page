import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getWeeklyTrackerAccess } from "../../../lib/auth/weekly-tracker";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { loadWeeklyEmptyState, loadWeeklyTracker, localMonday } from "../../_data/weeklyLaunchTracker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Launches & Missions", description: "Verified-account weekly launches and missions tracker with reviewed sources and schedule confidence.", alternates: { canonical: "/tracker/launches" } };

function timeLabel(value: string | null, timeZone: string) {
    if (!value) return { local: "Time pending", utc: "UTC pending" };
    const date = new Date(value);
    return {
        local: new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date),
        utc: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).format(date),
    };
}

function money(row: Awaited<ReturnType<typeof loadWeeklyTracker>>[number]) {
    if (!row.value || row.value.state === "unknown" || row.value.state === "withheld") return "Not disclosed";
    const format = (value: number | null) => value == null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: row.value!.currency, maximumFractionDigits: 0 }).format(value);
    if (row.value.state === "exact_cited") return format(row.value.exact);
    if (row.value.state === "cited_range") return `${format(row.value.low)} - ${format(row.value.high)}`;
    return format(row.value.estimate);
}

export default async function WeeklyLaunchTrackerPage({ searchParams }: { searchParams: Promise<{ filter?: string; status?: string; confidence?: string; week?: string; timezone?: string }> }) {
    if (!hasPotomacSupabasePublicConfig()) redirect("/request-access?tab=signin&next=%2Ftracker%2Flaunches");
    const supabase = await createClient();
    const access = await getWeeklyTrackerAccess({ supabase });
    if (access.state === "signed_out" || access.state === "email_unverified") redirect(access.loginHref);
    if (access.state === "profile_incomplete" && access.profileHref) redirect(access.profileHref);
    if (!access.canReadBasic) redirect("/request-access?next=%2Ftracker%2Flaunches");
    const params = await searchParams;
    const lunarOnly = params.filter === "lunar";
    const status = access.canUsePremiumTools && ["planned","confirmed","delayed","scrubbed","success"].includes(params.status ?? "") ? params.status! : null;
    const confidence = access.canUsePremiumTools && ["low","medium","high","official"].includes(params.confidence ?? "") ? params.confidence! : null;
    const { data: profile } = await supabase.from("member_profile_completions").select("timezone").eq("user_id", access.userId!).maybeSingle();
    const timeZone = params.timezone === profile?.timezone ? params.timezone : profile?.timezone || "UTC";
    const defaultWeekStart = localMonday(new Date(), timeZone);
    const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(params.week ?? "") && new Date(`${params.week}T00:00:00Z`).getUTCDay() === 1 ? params.week! : defaultWeekStart;
    const weekEnd = new Date(new Date(`${weekStart}T00:00:00Z`).getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
    const [rows, emptyState] = await Promise.all([loadWeeklyTracker({ supabase, weekStart, lunarOnly, status, confidence }), loadWeeklyEmptyState({ supabase, weekStart, lunarOnly })]);

    return <main className="bg-grid-pattern min-h-screen">
        <header className="border-b border-potomac-gold/20 bg-potomac-primary/80">
            <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
                <p className="font-mono text-xs font-bold uppercase text-potomac-gold">Member terminal / Launches & Missions</p>
                <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div><h1 className="font-serif text-4xl uppercase text-white md:text-6xl">Launches & Missions</h1><p className="mt-3 text-sm text-potomac-cream/70">{weekStart} through {weekEnd} / Local week with UTC reference</p></div>
                    <div className="grid w-full max-w-md gap-3"><nav aria-label="Operational trackers" className="grid grid-cols-2 border border-potomac-gold/30 p-1"><span aria-current="page" className="flex min-h-11 items-center justify-center bg-potomac-gold px-3 text-center font-mono text-xs font-bold uppercase text-potomac-primary">Launches &amp; Missions</span><Link href="/tracker/contracts" className="flex min-h-11 items-center justify-center px-3 text-center font-mono text-xs font-bold uppercase text-potomac-cream">Contract Awards</Link></nav><nav aria-label="Tracker filter" className="flex border border-potomac-gold/30 p-1">
                        <Link href="/tracker/launches" className={`flex min-h-11 flex-1 items-center justify-center px-3 font-mono text-xs font-bold uppercase ${!lunarOnly ? "bg-potomac-gold text-potomac-primary" : "text-potomac-cream"}`}>All global</Link>
                        <Link href="/tracker/launches?filter=lunar" className={`flex min-h-11 flex-1 items-center justify-center px-3 font-mono text-xs font-bold uppercase ${lunarOnly ? "bg-potomac-gold text-potomac-primary" : "text-potomac-cream"}`}>Lunar / cislunar</Link>
                    </nav></div>
                </div>
            </div>
        </header>
        <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
            <div className="mb-6 border-y border-white/10 py-4">
                {access.canUsePremiumTools ? <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><form className="grid flex-1 gap-3 sm:grid-cols-[1fr_1fr_auto]" method="get"><input type="hidden" name="filter" value={lunarOnly ? "lunar" : ""} /><label className="grid gap-1 font-mono text-xs uppercase text-potomac-gold">Status<select name="status" defaultValue={status ?? ""} className="min-h-11 border border-white/20 bg-potomac-primary px-3 text-white"><option value="">All statuses</option><option value="planned">Planned</option><option value="confirmed">Confirmed</option><option value="delayed">Delayed</option><option value="scrubbed">Scrubbed</option><option value="success">Success</option></select></label><label className="grid gap-1 font-mono text-xs uppercase text-potomac-gold">Confidence<select name="confidence" defaultValue={confidence ?? ""} className="min-h-11 border border-white/20 bg-potomac-primary px-3 text-white"><option value="">All confidence</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="official">Official</option></select></label><button className="min-h-11 bg-potomac-gold px-4 font-mono text-xs font-bold uppercase text-potomac-primary">Apply</button></form><nav aria-label="Premium tracker tools" className="flex flex-wrap gap-3 font-mono text-xs font-bold uppercase"><Link href="/member/saved-work?kind=launches">Watchlist</Link><Link href="/alerts?kind=lunar_mission&source=tracker">Alerts</Link><a href={`/api/member/tracker/launches/export?filter=${lunarOnly ? "lunar" : "all"}`}>Export</a><Link href="/member/developer?source=tracker">API</Link></nav></div> : <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm text-potomac-cream/70">Advanced filters, watchlists, alerts, exports, and API access require Scout or Meridian.</p><Link href="/upgrade?tier=scout&source=tracker&content=tools&next=%2Ftracker%2Flaunches" className="font-mono text-xs font-bold uppercase text-potomac-gold">Unlock tracker tools</Link></div>}
            </div>
            {rows.length ? <div className="grid gap-4">
                {rows.map((row) => { const times = timeLabel(row.scheduledAt, timeZone); return <article key={row.id} className="border border-potomac-gold/25 bg-potomac-primary/70 p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div className="min-w-0"><p className="font-mono text-xs font-bold uppercase text-potomac-gold">{row.eventType.replaceAll("_", " ")} / {row.status}</p><h2 className="mt-2 break-words font-serif text-2xl uppercase text-white md:text-3xl">{row.title}</h2><p className="mt-2 text-sm text-potomac-cream/70">{times.local} <span className="text-potomac-regolith">/ {times.utc}</span></p></div>
                        <div className="shrink-0 text-left md:text-right"><p className="font-mono text-xs uppercase text-potomac-cream/60">Confidence</p><p className="mt-1 font-mono text-sm font-bold uppercase text-white">{row.confidence}</p></div>
                    </div>
                    <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[['Provider',row.provider],['Vehicle',row.vehicle],['Mission',row.mission],['Customer / payload',row.customerPayload],['Launch site',row.launchSite],['Location',row.eventLocation],['Target / orbit',row.target]].map(([term,value]) => <div key={term} className="min-w-0"><dt className="font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">{term}</dt><dd className="mt-1 break-words text-sm text-potomac-cream/80">{value || "Pending review"}</dd></div>)}
                        <div className="min-w-0"><dt className="font-mono text-[0.65rem] font-bold uppercase text-potomac-gold">Value state</dt><dd className="mt-1 break-words text-sm text-potomac-cream/80">{row.value ? <>{row.value.state === "withheld" ? "not disclosed" : row.value.state.replaceAll("_", " ")} / {money(row)}{row.value.state === "analyst_estimate" && row.value.methodology ? <span className="mt-2 block text-xs leading-5 text-potomac-cream/60">Methodology: {row.value.methodology} / Confidence: {row.value.confidence ?? "pending"}</span> : null}</> : access.canUsePremiumTools ? "Not disclosed" : <Link prefetch={false} href="/upgrade?tier=scout&source=tracker&content=launch-value&next=%2Ftracker%2Flaunches" className="font-bold text-potomac-gold underline-offset-4 hover:underline">Sign up or Log In for More Details</Link>}</dd></div>
                    </dl>
                    <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-potomac-cream/60"><p>Source checked: {row.sourceCheckedAt ? new Date(row.sourceCheckedAt).toLocaleString() : "Pending"} / Reviewed: {row.reviewedAt ? new Date(row.reviewedAt).toLocaleString() : "Pending"}</p>{row.citations.length ? <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{row.citations.map((citation) => <li key={citation.url}><a className="text-potomac-gold underline-offset-4 hover:underline" href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a></li>)}</ul> : null}</div>
                </article>; })}
            </div> : <div className="border border-potomac-gold/25 bg-potomac-primary/70 p-8"><p className="font-mono text-xs font-bold uppercase text-potomac-gold">Source status</p><h2 className="mt-3 font-serif text-3xl uppercase text-white">{emptyState?.message ?? "No reviewed records available"}</h2><p className="mt-3 text-sm text-potomac-cream/70">{emptyState ? `Approved source check completed ${new Date(emptyState.source_checked_at).toLocaleString()}.` : "This week has not yet received a completed approved-source review."}</p></div>}
        </section>
    </main>;
}
