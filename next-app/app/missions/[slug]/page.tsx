import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { getLunarMissionAccess } from "../../../lib/auth/lunar-missions";
import {
    formatFreshness,
    formatTrackerDate,
    formatTrackerDateTime,
    formatTrackerLabel,
    loadLunarMissionBySlug,
    type LunarMissionRecord,
} from "../../_data/lunarMissions";

export const dynamic = "force-dynamic";

type PageParams = {
    slug: string;
};

type AccessView = {
    canReadMemberDetails: boolean;
    canReadScoutDetails: boolean;
    state: string;
};

export async function generateMetadata({
    params,
}: {
    params: Promise<PageParams>;
}): Promise<Metadata> {
    const { slug } = await params;
    const mission = await loadLunarMissionBySlug({ slug });

    if (!mission) {
        return {
            title: "Mission Not Found",
        };
    }

    return {
        title: `${mission.missionName} Mission Tracker`,
        description: mission.summary,
        alternates: {
            canonical: `/missions/${mission.slug}`,
        },
    };
}

function tierLabel(value: string) {
    if (value === "member") {
        return "Explorer+";
    }

    if (value === "scout") {
        return "Scout+";
    }

    if (value === "command") {
        return "Command";
    }

    return "Public";
}

function canSeeTier(tier: string, access: AccessView) {
    if (tier === "public") {
        return true;
    }

    if (tier === "member") {
        return access.canReadMemberDetails;
    }

    if (tier === "scout") {
        return access.canReadScoutDetails;
    }

    return access.state === "command" || access.state === "staff";
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

function LockedPanel({
    tier,
    label,
}: {
    tier: string;
    label: string;
}) {
    return (
        <div className="rounded border border-potomac-gold/25 bg-potomac-gold/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {tierLabel(tier)} detail
            </p>
            <p className="mt-2 text-sm leading-6 text-potomac-cream/70">
                {label} is available to approved {tierLabel(tier)} members when
                the live tracker is configured.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
                <Link
                    href="/apply"
                    className="rounded bg-potomac-gold px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                >
                    Apply
                </Link>
                <Link
                    href="/pricing"
                    className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Compare tiers
                </Link>
            </div>
        </div>
    );
}

function ObjectsSection({
    mission,
    access,
}: {
    mission: LunarMissionRecord;
    access: AccessView;
}) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Mission Objects</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {mission.objects.map((object) =>
                    canSeeTier(object.visibilityTier, access) ? (
                        <article
                            key={object.id}
                            className="rounded border border-white/10 bg-white/[0.02] p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {object.objectName}
                                    </h3>
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {formatTrackerLabel(object.objectType)} |{" "}
                                        {formatTrackerLabel(object.currentStatus)}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                                    {tierLabel(object.visibilityTier)}
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                {object.description || object.destination}
                            </p>
                            <dl className="mt-4 grid gap-3 text-xs text-potomac-cream/55 sm:grid-cols-2">
                                <div>
                                    <dt>Destination</dt>
                                    <dd className="text-potomac-cream/80">
                                        {object.destination}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Orbit</dt>
                                    <dd className="text-potomac-cream/80">
                                        {object.orbitName ?? "Not set"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Launch vehicle</dt>
                                    <dd className="text-potomac-cream/80">
                                        {object.launchVehicle ?? "Not set"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Freshness</dt>
                                    <dd className="text-potomac-cream/80">
                                        {formatFreshness(object.freshnessAt)}
                                    </dd>
                                </div>
                            </dl>
                        </article>
                    ) : (
                        <LockedPanel
                            key={object.id}
                            tier={object.visibilityTier}
                            label={object.objectName}
                        />
                    )
                )}
            </div>
        </section>
    );
}

function LaunchSection({ mission }: { mission: LunarMissionRecord }) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Launch Windows</h2>
            <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.14em] text-potomac-gold">
                        <tr className="border-b border-white/10">
                            <th className="py-3 pr-6 font-semibold">Target</th>
                            <th className="py-3 pr-6 font-semibold">Vehicle</th>
                            <th className="py-3 pr-6 font-semibold">Site</th>
                            <th className="py-3 pr-6 font-semibold">Status</th>
                            <th className="py-3 pr-6 font-semibold">Freshness</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-potomac-cream/75">
                        {mission.launchWindows.length ? (
                            mission.launchWindows.map((window) => (
                                <tr key={window.id}>
                                    <td className="py-4 pr-6 align-top">
                                        {formatTrackerDate(
                                            window.targetLaunchAt ??
                                                window.windowOpenAt
                                        )}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {window.launchVehicle ?? "TBD"}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {window.launchSite ?? "TBD"}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {formatTrackerLabel(window.launchStatus)}
                                    </td>
                                    <td className="py-4 pr-6 align-top">
                                        {formatFreshness(window.freshnessAt)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-6 text-potomac-cream/60"
                                >
                                    No launch window has been published yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function PayloadSection({
    mission,
    access,
}: {
    mission: LunarMissionRecord;
    access: AccessView;
}) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">
                Payloads and Instruments
            </h2>
            <div className="mt-5 space-y-4">
                {mission.payloads.length ? (
                    mission.payloads.map((payload) =>
                        canSeeTier(payload.visibilityTier, access) ? (
                            <article
                                key={payload.id}
                                className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-white">
                                            {payload.payloadName}
                                        </h3>
                                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                            {formatTrackerLabel(
                                                payload.payloadType
                                            )}{" "}
                                            |{" "}
                                            {formatTrackerLabel(
                                                payload.payloadStatus
                                            )}
                                        </p>
                                    </div>
                                    <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                                        {tierLabel(payload.visibilityTier)}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                    {payload.scienceObjective ??
                                        "No objective note saved."}
                                </p>
                            </article>
                        ) : (
                            <LockedPanel
                                key={payload.id}
                                tier={payload.visibilityTier}
                                label={payload.payloadName}
                            />
                        )
                    )
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        No payload records are published yet.
                    </p>
                )}
            </div>
        </section>
    );
}

function SourceSection({ mission }: { mission: LunarMissionRecord }) {
    return (
        <section className="glass-card rounded p-6">
            <h2 className="font-serif text-3xl text-white">Sources</h2>
            <div className="mt-5 space-y-4">
                {mission.citations.length ? (
                    mission.citations.map((citation) => (
                        <article
                            key={citation.id}
                            className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                        >
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
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
                                        {formatTrackerLabel(
                                            citation.reviewStatus
                                        )}
                                    </p>
                                </div>
                                <span className="text-xs text-potomac-cream/55">
                                    Retrieved{" "}
                                    {formatTrackerDate(citation.retrievedAt)}
                                </span>
                            </div>
                            {citation.summary ? (
                                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                    {citation.summary}
                                </p>
                            ) : null}
                        </article>
                    ))
                ) : (
                    <p className="text-sm text-potomac-cream/60">
                        No public citations are attached yet.
                    </p>
                )}
            </div>
        </section>
    );
}

export default async function MissionDetailPage({
    params,
}: {
    params: Promise<PageParams>;
}) {
    const { slug } = await params;
    const hasConfig = hasPotomacSupabasePublicConfig();
    const supabase = hasConfig ? await createClient() : undefined;
    const access = supabase
        ? await getLunarMissionAccess({ supabase })
        : {
              state: "anonymous",
              canReadMemberDetails: false,
              canReadScoutDetails: false,
              canReadCommandDetails: false,
              userId: null,
              roleId: null,
          };
    const mission = await loadLunarMissionBySlug({
        slug,
        supabase,
        includeMemberOnly: access.canReadMemberDetails,
    });

    if (!mission) {
        notFound();
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Mission detail
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            {mission.missionName}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            {mission.summary}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/launches"
                                className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Launch tracker
                            </Link>
                            <Link
                                href="/spacecraft"
                                className="rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                            >
                                Object tracker
                            </Link>
                        </div>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access and freshness
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Status</dt>
                                <dd className="text-white">
                                    {formatTrackerLabel(mission.currentStatus)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Phase</dt>
                                <dd className="text-white">
                                    {formatTrackerLabel(mission.currentPhase)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Detail tier</dt>
                                <dd className="text-white">
                                    {tierLabel(mission.visibilityTier)}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Freshness</dt>
                                <dd className="text-white">
                                    {formatFreshness(mission.freshnessAt)}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <dl className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                        label="Operator"
                        value={mission.primaryOperatorName ?? "TBD"}
                        detail={mission.programName ?? "Program pending"}
                    />
                    <Metric
                        label="Objects"
                        value={String(mission.objects.length)}
                        detail="Spacecraft, landers, satellites"
                    />
                    <Metric
                        label="Launches"
                        value={String(mission.launchWindows.length)}
                        detail="Tracked windows"
                    />
                    <Metric
                        label="Quality"
                        value={`${mission.qualityScore}%`}
                        detail={formatTrackerLabel(mission.confidenceLabel)}
                    />
                </dl>

                {mission.missionObjectives ? (
                    <section className="glass-card mt-10 rounded p-6">
                        <h2 className="font-serif text-3xl text-white">
                            Objectives
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-potomac-cream/75">
                            {mission.missionObjectives}
                        </p>
                    </section>
                ) : null}

                <div className="mt-8 space-y-8">
                    <LaunchSection mission={mission} />
                    <ObjectsSection mission={mission} access={access} />
                    <PayloadSection mission={mission} access={access} />
                    <SourceSection mission={mission} />
                </div>
            </div>
        </section>
    );
}
