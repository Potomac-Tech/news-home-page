import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { getProfileGateContext } from "../../lib/auth/profile-completion";
import { TerminalDashboardShell } from "../_components/TerminalDashboardShell";
import { ScoutCheckoutButton } from "./ScoutCheckoutButton";
import { loadPublicTickerItems } from "../_data/marketQuotes";
import {
    formatJobAlertDate,
    formatJobAlertFreshness,
    loadMemberJobAlerts,
    type JobAlert,
} from "../_data/jobAlerts";
import {
    formatSpaceWeatherDateTime,
    formatSpaceWeatherFreshness,
    loadMemberSpaceWeatherSnapshots,
    summarizeSpaceWeatherMetrics,
    type SpaceWeatherSnapshot,
} from "../_data/spaceWeather";
import { tierConfig } from "../_data/tiers";
import {
    NEXUS_AUTH_URL,
    loadNexusAccessStatus,
    type NexusAccessStatus,
} from "../../lib/auth/nexus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Member Workspace",
};

type AuthClaims = {
    sub?: string;
    email?: string;
};

function NexusAccessCard({ status }: { status: NexusAccessStatus }) {
    return (
        <section className="glass-card rounded p-6">
            <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Nexus access
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white">
                    {status.label}
                </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                {status.detail}
            </p>
            <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                    <dt>Membership</dt>
                    <dd className="text-white">{status.membershipLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                    <dt>Nexus role</dt>
                    <dd className="text-white">{status.nexusRoleLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                    <dt>Entitlement</dt>
                    <dd className="text-white">{status.entitlementLabel}</dd>
                </div>
                <div className="border-t border-white/10 pt-3">
                    <dt>Destination</dt>
                    <dd className="mt-1 break-all text-white">
                        {NEXUS_AUTH_URL}
                    </dd>
                </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
                {status.canOpenNexus ? (
                    <a
                        href="/api/member/nexus/handoff"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Open Nexus
                    </a>
                ) : (
                    <Link
                        href="/command"
                        className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        {tierConfig.enterprise.publicName} access
                    </Link>
                )}
                <Link
                    href="/nexus"
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Nexus overview
                </Link>
            </div>
        </section>
    );
}

function JobAlertsCard({ alerts }: { alerts: JobAlert[] }) {
    return (
        <section className="glass-card h-fit rounded p-6">
            <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Job alerts
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white">
                    NASA & Space Hiring
                </h2>
            </div>
            <div className="mt-5 space-y-4">
                {alerts.map((alert) => (
                    <article
                        key={alert.alertKey}
                        className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {alert.employerName}
                                </p>
                                <h3 className="mt-1 text-sm leading-5 text-potomac-cream/80">
                                    {alert.roleTitle}
                                </h3>
                            </div>
                            <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                {formatJobAlertFreshness(alert.freshnessStatus)}
                            </span>
                        </div>
                        <dl className="mt-3 space-y-2 text-xs text-potomac-cream/55">
                            <div>
                                <dt className="sr-only">Location</dt>
                                <dd>{alert.locationName}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>Posting date</dt>
                                <dd className="text-potomac-cream/75">
                                    {formatJobAlertDate(alert.postingDate)}
                                </dd>
                            </div>
                        </dl>
                        {alert.freshnessNote ? (
                            <p className="mt-3 text-xs leading-5 text-potomac-cream/50">
                                {alert.freshnessNote}
                            </p>
                        ) : null}
                        <a
                            href={alert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:text-potomac-cream"
                        >
                            {alert.sourceName}
                        </a>
                    </article>
                ))}
            </div>
        </section>
    );
}

function SpaceWeatherCard({
    snapshots,
}: {
    snapshots: SpaceWeatherSnapshot[];
}) {
    return (
        <section className="glass-card h-fit rounded p-6">
            <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Space weather
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white">
                    Source Conditions
                </h2>
            </div>
            <div className="mt-5 space-y-4">
                {snapshots.map((snapshot) => (
                    <article
                        key={snapshot.sourceKey}
                        className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {snapshot.sourceProduct}
                                </p>
                                <p className="mt-1 text-xs text-potomac-cream/55">
                                    {snapshot.sourceAgency}
                                </p>
                            </div>
                            <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                {formatSpaceWeatherFreshness(
                                    snapshot.freshnessStatus
                                )}
                            </span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-potomac-cream/65">
                            {snapshot.statusSummary}
                        </p>
                        <dl className="mt-3 space-y-2 text-xs text-potomac-cream/55">
                            <div className="flex justify-between gap-4">
                                <dt>Updated</dt>
                                <dd className="text-right text-potomac-cream/75">
                                    {formatSpaceWeatherDateTime(
                                        snapshot.sourceUpdatedAt
                                    )}
                                </dd>
                            </div>
                            {summarizeSpaceWeatherMetrics(
                                snapshot.keyMetrics
                            ).map((metric) => (
                                <div
                                    key={`${snapshot.sourceKey}-${metric.key}`}
                                    className="flex justify-between gap-4"
                                >
                                    <dt className="capitalize">{metric.key}</dt>
                                    <dd className="text-right text-potomac-cream/75">
                                        {metric.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <a
                            href={snapshot.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold transition hover:text-potomac-cream"
                        >
                            {snapshot.sourceName}
                        </a>
                    </article>
                ))}
            </div>
        </section>
    );
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Member workspace
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Member sign-in is being configured
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        The member workspace will open after its secure sign-in
                        service is connected. Public intelligence and membership
                        information remain available while that setup is completed.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/request-access"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Request Explorer access
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Compare tiers
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default async function MemberPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const profileGate = await getProfileGateContext({ supabase, nextPath: "/member" });
    if (profileGate.state === "signed_out") redirect(profileGate.loginHref);
    if (profileGate.state === "email_unverified") redirect(profileGate.loginHref);
    if (profileGate.state === "profile_incomplete" && profileGate.profileHref) redirect(profileGate.profileHref);
    const claims = (await supabase.auth.getClaims()).data?.claims as AuthClaims | undefined;
    if (!claims?.sub) redirect("/request-access?tab=signin&next=%2Fmember");

    const [tickerItems, nexusStatus, jobAlerts, spaceWeatherSnapshots] =
        await Promise.all([
            loadPublicTickerItems(6),
            loadNexusAccessStatus(supabase, claims.sub),
            loadMemberJobAlerts({ supabase, limit: 4 }),
            loadMemberSpaceWeatherSnapshots({ supabase, limit: 3 }),
        ]);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl gap-8 px-4 py-20 md:px-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="max-w-3xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Protected route
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Member Workspace
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        You are signed in as{" "}
                        <span className="text-potomac-gold">
                            {claims.email ?? claims.sub}
                        </span>
                        . Membership status, entitlements, and paid
                        intelligence modules appear here as access is approved.
                    </p>
                    <div className="mt-10 flex flex-wrap gap-4">
                        <Link
                            href="/news"
                            className="rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            News
                        </Link>
                        <Link
                            href="/member/summits"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Summit tracker
                        </Link>
                        <Link
                            href="/member/economy"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Economy dashboard
                        </Link>
                        <Link
                            href="/tracker/launches"
                            prefetch={false}
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Launches & Missions
                        </Link>
                        <Link
                            href="/tracker/contracts"
                            prefetch={false}
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Contract Awards
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Compare tiers
                        </Link>
                        <Link
                            href="/member/marketplace"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Data marketplace
                        </Link>
                        <Link
                            href="/member/chat"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member chat
                        </Link>
                        <Link
                            href="/member/forums"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member forums
                        </Link>
                        <Link
                            href="/member/rfqs"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            RFQs
                        </Link>
                        <Link
                            href="/member/procurement"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Procurement hub
                        </Link>
                        <Link
                            href="/member/saved-work"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Saved work
                        </Link>
                        <Link
                            href="/companies"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Company directory
                        </Link>
                        <Link
                            href="/member/test-data"
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Test data uploads
                        </Link>
                        <Link
                            href="/auth/logout"
                            prefetch={false}
                            className="rounded border border-potomac-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Sign out
                        </Link>
                    </div>
                    <ScoutCheckoutButton />
                </div>
                <aside className="space-y-6">
                    <NexusAccessCard status={nexusStatus} />
                    <JobAlertsCard alerts={jobAlerts} />
                    <SpaceWeatherCard snapshots={spaceWeatherSnapshots} />
                    <section className="glass-card h-fit rounded p-6">
                        <div className="border-b border-white/10 pb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                Delayed quotes
                            </p>
                            <h2 className="mt-2 font-serif text-2xl text-white">
                                Company Ticker
                            </h2>
                        </div>
                        <div className="mt-5 space-y-4">
                            {tickerItems.map((item) => (
                                <div
                                    key={`${item.symbol}-${item.label}`}
                                    className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-mono text-sm font-bold text-potomac-gold">
                                                {item.symbol}
                                            </p>
                                            <p className="mt-1 text-sm text-potomac-cream/70">
                                                {item.label}
                                            </p>
                                        </div>
                                        <p
                                            className={
                                                item.trend === "down"
                                                    ? "text-right text-sm font-bold text-red-200"
                                                    : item.trend === "up"
                                                      ? "text-right text-sm font-bold text-potomac-gold"
                                                      : "text-right text-sm font-bold text-white"
                                            }
                                        >
                                            {item.value}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-xs text-potomac-cream/45">
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
            <TerminalDashboardShell
                title="Member terminal map"
                description="Navigate the lunar intelligence workspace by mission, market, news, dataset, community, alert, and account area."
                showMemberActions
            />
        </section>
    );
}
