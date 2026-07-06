import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDeveloperPlatformAccessContext } from "../../../lib/auth/developer-platform";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import {
    loadDeveloperPlatformDashboard,
    type DeveloperEndpoint,
    type DeveloperPlatformDashboard,
} from "../../_data/developerPlatform";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Developer Portal",
    description:
        "Scout and Command API keys, endpoint catalog, usage logs, webhooks, and export jobs.",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
});

const numberFormatter = new Intl.NumberFormat("en-US");

function statusLabel(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value: string | null | undefined) {
    if (!value) return "Not set";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not set";

    return dateFormatter.format(date);
}

function formatBytes(value: number | null) {
    if (value === null) return "Not set";

    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

    return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Developer portal
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        API keys, usage logs, webhook subscriptions, and export
                        jobs are paid-member records. Set the Cabeus Explorer public
                        Supabase environment variables and sign in with Scout or
                        Command access.
                    </p>
                    <Link
                        href="/pricing"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Compare tiers
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
                        Developer portal
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Scout or Command access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Explorer members can read eligible intelligence, while
                        API keys, exports, usage logs, and webhook controls are
                        reserved for paid workflows.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                        <Link
                            href="/pricing"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Upgrade path
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatCard({
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

function LoadWarning({ dashboard }: { dashboard: DeveloperPlatformDashboard }) {
    if (!dashboard.loadError) return null;

    return (
        <div className="mt-8 rounded border border-potomac-gold/35 bg-potomac-gold/10 p-4 text-sm leading-6 text-potomac-cream/75">
            Developer-platform tables could not be read in this environment:{" "}
            {dashboard.loadError}. The portal is rendering scaffold data until
            the Task 070 migration is applied to the Cabeus Explorer Supabase project.
        </div>
    );
}

function TierLimitsPanel({
    dashboard,
}: {
    dashboard: DeveloperPlatformDashboard;
}) {
    return (
        <section className="grid gap-4 md:grid-cols-2">
            {dashboard.tierLimits.map((limit) => (
                <article key={limit.tier} className="glass-card rounded p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        {statusLabel(limit.tier)}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-white">
                        {numberFormatter.format(limit.monthlyApiQuota)} monthly API
                        units
                    </h2>
                    <dl className="mt-5 grid gap-3 text-sm text-potomac-cream/70 sm:grid-cols-2">
                        <div>
                            <dt className="text-potomac-cream/45">Daily exports</dt>
                            <dd>{numberFormatter.format(limit.dailyExportQuota)}</dd>
                        </div>
                        <div>
                            <dt className="text-potomac-cream/45">API keys</dt>
                            <dd>{numberFormatter.format(limit.maxActiveApiKeys)}</dd>
                        </div>
                        <div>
                            <dt className="text-potomac-cream/45">Webhooks</dt>
                            <dd>
                                {limit.supportsWebhooks
                                    ? numberFormatter.format(
                                          limit.maxWebhookSubscriptions
                                      )
                                    : "Not included"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-potomac-cream/45">Usage retention</dt>
                            <dd>{numberFormatter.format(limit.retentionDays)} days</dd>
                        </div>
                    </dl>
                </article>
            ))}
        </section>
    );
}

function EndpointCard({ endpoint }: { endpoint: DeveloperEndpoint }) {
    return (
        <article className="rounded border border-white/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                        {endpoint.method} {endpoint.routeTemplate}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-white">
                        {endpoint.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                        {endpoint.description}
                    </p>
                </div>
                <span className="w-fit rounded border border-potomac-gold/35 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold">
                    {statusLabel(endpoint.minimumTier)}+
                </span>
            </div>
            <p className="mt-3 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                {endpoint.quotaWeight} quota units | {endpoint.responseFormat}
                {endpoint.includesCommandData ? " | Command data" : ""}
            </p>
        </article>
    );
}

function EndpointCatalog({ endpoints }: { endpoints: DeveloperEndpoint[] }) {
    return (
        <section className="glass-card rounded p-5">
            <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Endpoint catalog
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white">
                    Versioned intelligence APIs
                </h2>
            </div>
            <div className="mt-5 grid gap-4">
                {endpoints.map((endpoint) => (
                    <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
            </div>
        </section>
    );
}

function ApiKeysPanel({
    dashboard,
}: {
    dashboard: DeveloperPlatformDashboard;
}) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">API Keys</h2>
            <p className="mt-2 text-sm leading-6 text-potomac-cream/60">
                Only key prefixes and hashes are stored. Raw secrets should be
                generated once by a server-side key issue flow.
            </p>
            <div className="mt-5 grid gap-3">
                {dashboard.apiKeys.length ? (
                    dashboard.apiKeys.map((apiKey) => (
                        <div
                            key={apiKey.id}
                            className="rounded border border-white/10 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-sm font-bold text-white">
                                    {apiKey.keyName}
                                </h3>
                                <span className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                                    {statusLabel(apiKey.status)}
                                </span>
                            </div>
                            <p className="mt-2 font-mono text-xs text-potomac-cream/65">
                                {apiKey.keyPrefix}
                            </p>
                            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                {statusLabel(apiKey.tier)} | Last used{" "}
                                {formatDate(apiKey.lastUsedAt)} | Expires{" "}
                                {formatDate(apiKey.expiresAt)}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        No API keys are active yet.
                    </p>
                )}
            </div>
        </section>
    );
}

function UsagePanel({ dashboard }: { dashboard: DeveloperPlatformDashboard }) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Usage Logs</h2>
            <div className="mt-5 grid gap-3">
                {dashboard.usageLogs.map((log) => (
                    <div key={log.id} className="rounded border border-white/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-bold text-white">
                                {statusLabel(log.endpointKey)}
                            </p>
                            <span className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                                {log.statusCode ?? "Pending"}
                            </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                            {statusLabel(log.eventKind)} | {log.quotaUnits} quota
                            units | {log.responseMs ?? 0} ms |{" "}
                            {formatDate(log.occurredAt)}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

function WebhooksPanel({
    dashboard,
    canUseWebhooks,
}: {
    dashboard: DeveloperPlatformDashboard;
    canUseWebhooks: boolean;
}) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Webhooks</h2>
            {!canUseWebhooks ? (
                <p className="mt-3 rounded border border-potomac-gold/30 p-3 text-sm leading-6 text-potomac-cream/70">
                    Webhook subscriptions are available for Command accounts.
                    Scout users can still use API keys and export jobs.
                </p>
            ) : null}
            <div className="mt-5 grid gap-3">
                {dashboard.webhooks.length ? (
                    dashboard.webhooks.map((webhook) => (
                        <div
                            key={webhook.id}
                            className="rounded border border-white/10 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-sm font-bold text-white">
                                    {webhook.subscriptionName}
                                </h3>
                                <span className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                                    {statusLabel(webhook.status)}
                                </span>
                            </div>
                            <p className="mt-2 break-all font-mono text-xs text-potomac-cream/65">
                                {webhook.endpointUrl}
                            </p>
                            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                                {webhook.eventKinds.join(", ")} | Failures{" "}
                                {webhook.failureCount} | Last delivery{" "}
                                {formatDate(webhook.lastDeliveryAt)}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        No webhook subscriptions are configured.
                    </p>
                )}
            </div>
        </section>
    );
}

function ExportJobsPanel({
    dashboard,
}: {
    dashboard: DeveloperPlatformDashboard;
}) {
    return (
        <section className="glass-card rounded p-5">
            <h2 className="font-serif text-2xl text-white">Export Jobs</h2>
            <div className="mt-5 grid gap-3">
                {dashboard.exportJobs.map((job) => (
                    <div key={job.id} className="rounded border border-white/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-white">
                                {job.exportName}
                            </h3>
                            <span className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                                {statusLabel(job.status)}
                            </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-potomac-cream/55">
                            {statusLabel(job.sourceKind)} | {job.exportFormat} |{" "}
                            {job.rowCount ?? 0} rows | {formatBytes(job.fileSizeBytes)}
                        </p>
                        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.12em] text-potomac-cream/40">
                            Requested {formatDate(job.requestedAt)} | Completed{" "}
                            {formatDate(job.completedAt)} | Expires{" "}
                            {formatDate(job.expiresAt)}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default async function DeveloperPortalPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getDeveloperPlatformAccessContext({
        supabase,
        nextPath: "/member/developer",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canUseDeveloperPlatform || !access.userId) {
        return <LockedGate />;
    }

    const dashboard = await loadDeveloperPlatformDashboard({
        supabase,
        userId: access.userId,
    });
    const quotaUsed = dashboard.usageLogs.reduce(
        (total, log) => total + log.quotaUnits,
        0
    );

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Scout and Command infrastructure
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Developer Portal
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Manage API access, endpoint coverage, quota signals,
                            webhook subscriptions, and export jobs for lunar
                            intelligence workflows.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access state
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            {statusLabel(access.tier)} developer access
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            RLS scopes developer records to the owner,
                            organization admins, and authorized staff.
                        </p>
                        <Link
                            href="/member"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                    </aside>
                </div>

                <LoadWarning dashboard={dashboard} />

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="API keys"
                        value={String(dashboard.apiKeys.length)}
                        detail={`${dashboard.sourceMode} source mode`}
                    />
                    <StatCard
                        label="Endpoints"
                        value={String(dashboard.endpoints.length)}
                        detail="catalog records"
                    />
                    <StatCard
                        label="Quota used"
                        value={numberFormatter.format(quotaUsed)}
                        detail="recent logged units"
                    />
                    <StatCard
                        label="Exports"
                        value={String(dashboard.exportJobs.length)}
                        detail="recent jobs"
                    />
                </dl>

                <div className="mt-12">
                    <TierLimitsPanel dashboard={dashboard} />
                </div>

                <div className="mt-12">
                    <EndpointCatalog endpoints={dashboard.endpoints} />
                </div>

                <div className="mt-12 grid gap-6 lg:grid-cols-2">
                    <ApiKeysPanel dashboard={dashboard} />
                    <UsagePanel dashboard={dashboard} />
                    <WebhooksPanel
                        dashboard={dashboard}
                        canUseWebhooks={access.canUseWebhooks}
                    />
                    <ExportJobsPanel dashboard={dashboard} />
                </div>

                <section className="mt-12 rounded border border-white/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Implementation note
                    </p>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                        This task adds the developer-platform scaffold and data
                        model. Actual API handlers, one-time secret generation,
                        export workers, and webhook dispatch workers should use
                        these tables in follow-on implementation tasks.
                    </p>
                </section>
            </div>
        </section>
    );
}
