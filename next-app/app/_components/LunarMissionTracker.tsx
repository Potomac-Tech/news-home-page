import Link from "next/link";
import {
    earliestLaunchTime,
    formatFreshness,
    formatTrackerDate,
    formatTrackerDateTime,
    formatTrackerLabel,
    latestFreshnessTime,
    missionMatchesFilter,
    publicMissionPreview,
    type LunarMissionRecord,
} from "../_data/lunarMissions";

type TrackerMode = "launches" | "spacecraft" | "member";

type LunarMissionTrackerProps = {
    missions: LunarMissionRecord[];
    mode: TrackerMode;
    activeFilter?: string;
    title: string;
    description: string;
    showTierNote?: boolean;
};

const launchFilters = [
    { label: "All", value: "all", href: "/launches" },
    { label: "Upcoming", value: "launches", href: "/launches?filter=launches" },
    { label: "Active", value: "active", href: "/launches?filter=active" },
];

const objectFilters = [
    { label: "All", value: "all", href: "/spacecraft" },
    { label: "Spacecraft", value: "spacecraft", href: "/spacecraft?filter=spacecraft" },
    { label: "Landers", value: "landers", href: "/spacecraft?filter=landers" },
    { label: "Satellites", value: "satellites", href: "/spacecraft?filter=satellites" },
];

const memberFilters = [
    { label: "All", value: "all", href: "/member/missions" },
    {
        label: "Launches",
        value: "launches",
        href: "/member/missions?filter=launches",
    },
    {
        label: "Landers",
        value: "landers",
        href: "/member/missions?filter=landers",
    },
    {
        label: "Satellites",
        value: "satellites",
        href: "/member/missions?filter=satellites",
    },
    {
        label: "Active",
        value: "active",
        href: "/member/missions?filter=active",
    },
];

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

function missionSort(mode: TrackerMode) {
    return (a: LunarMissionRecord, b: LunarMissionRecord) => {
        if (mode === "launches") {
            return earliestLaunchTime(a) - earliestLaunchTime(b);
        }

        return latestFreshnessTime(b) - latestFreshnessTime(a);
    };
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-l border-potomac-gold/35 pl-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-potomac-gold">
                {label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-white">{value}</dd>
        </div>
    );
}

function FilterBar({
    filters,
    activeFilter,
}: {
    filters: Array<{ label: string; value: string; href: string }>;
    activeFilter: string;
}) {
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

function LaunchWindowList({ mission }: { mission: LunarMissionRecord }) {
    if (mission.launchWindows.length === 0) {
        return (
            <p className="text-sm text-potomac-cream/55">
                No launch window is published for this tracker record yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {mission.launchWindows.slice(0, 2).map((window) => (
                <div
                    key={window.id}
                    className="rounded border border-white/10 bg-white/[0.02] p-3"
                >
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-white">
                            {window.launchVehicle ?? "Launch vehicle TBD"}
                        </p>
                        <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                            {formatTrackerLabel(window.launchStatus)}
                        </span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs text-potomac-cream/55 sm:grid-cols-2">
                        <div>
                            <dt>Target</dt>
                            <dd className="text-potomac-cream/80">
                                {formatTrackerDate(
                                    window.targetLaunchAt ?? window.windowOpenAt
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt>Site</dt>
                            <dd className="text-potomac-cream/80">
                                {window.launchSite ?? "TBD"}
                            </dd>
                        </div>
                    </dl>
                </div>
            ))}
        </div>
    );
}

function ObjectList({ mission }: { mission: LunarMissionRecord }) {
    if (mission.objects.length === 0) {
        return (
            <p className="text-sm text-potomac-cream/55">
                No spacecraft, lander, or satellite objects are published yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {mission.objects.slice(0, 3).map((object) => (
                <div
                    key={object.id}
                    className="rounded border border-white/10 bg-white/[0.02] p-3"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-white">
                                {object.objectName}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                {formatTrackerLabel(object.objectType)} |{" "}
                                {formatTrackerLabel(object.currentPhase)}
                            </p>
                        </div>
                        <span className="shrink-0 rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                            {tierLabel(object.visibilityTier)}
                        </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-potomac-cream/60">
                        {object.description || object.destination}
                    </p>
                </div>
            ))}
        </div>
    );
}

function MissionCard({
    mission,
    mode,
}: {
    mission: LunarMissionRecord;
    mode: TrackerMode;
}) {
    const preview = publicMissionPreview(mission);

    return (
        <article className="glass-card rounded p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        {mission.programName ?? "Lunar mission"}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                        <Link
                            href={`/missions/${mission.slug}`}
                            className="transition hover:text-potomac-gold"
                        >
                            {mission.missionName}
                        </Link>
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                        {mission.summary}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded border border-potomac-gold/40 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-gold">
                        {formatTrackerLabel(mission.currentStatus)}
                    </span>
                    <span className="rounded border border-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-potomac-cream/60">
                        {tierLabel(mission.visibilityTier)}
                    </span>
                </div>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                    label="Phase"
                    value={formatTrackerLabel(mission.currentPhase)}
                />
                <Stat
                    label="Operator"
                    value={mission.primaryOperatorName ?? "TBD"}
                />
                <Stat
                    label="Objects"
                    value={String(mission.objects.length)}
                />
                <Stat
                    label="Freshness"
                    value={formatFreshness(mission.freshnessAt)}
                />
            </dl>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        {mode === "launches" ? "Launch windows" : "Mission objects"}
                    </h3>
                    {mode === "launches" ? (
                        <LaunchWindowList mission={mission} />
                    ) : (
                        <ObjectList mission={mission} />
                    )}
                </section>
                <section>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                        Source and access
                    </h3>
                    <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-sm leading-6 text-potomac-cream/65">
                        <p>
                            Confidence:{" "}
                            <span className="text-white">
                                {formatTrackerLabel(mission.confidenceLabel)}
                            </span>
                        </p>
                        <p>
                            Last source:{" "}
                            <span className="text-white">
                                {formatTrackerDateTime(mission.lastSourceAt)}
                            </span>
                        </p>
                        <p>
                            Citations:{" "}
                            <span className="text-white">
                                {mission.citations.length}
                            </span>
                        </p>
                        {preview.hiddenDetailCount > 0 ? (
                            <p className="mt-3 text-xs text-potomac-cream/50">
                                {preview.hiddenDetailCount} object or payload
                                details require Explorer, Scout, or Command
                                access.
                            </p>
                        ) : null}
                    </div>
                    <Link
                        href={`/missions/${mission.slug}`}
                        className="mt-4 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Detail page
                    </Link>
                </section>
            </div>
        </article>
    );
}

export function LunarMissionTracker({
    missions,
    mode,
    activeFilter = "all",
    title,
    description,
    showTierNote = true,
}: LunarMissionTrackerProps) {
    const filters =
        mode === "launches"
            ? launchFilters
            : mode === "member"
              ? memberFilters
              : objectFilters;
    const visibleMissions = missions
        .filter((mission) => missionMatchesFilter(mission, activeFilter))
        .sort(missionSort(mode));
    const objectCount = visibleMissions.reduce(
        (sum, mission) => sum + mission.objects.length,
        0
    );
    const launchCount = visibleMissions.reduce(
        (sum, mission) => sum + mission.launchWindows.length,
        0
    );
    const fallback = visibleMissions.some((mission) => mission.isFallback);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Lunar mission tracker
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            {description}
                        </p>
                        {showTierNote ? (
                            <p className="mt-4 max-w-3xl text-sm leading-6 text-potomac-cream/55">
                                Public rows show source-backed summaries.
                                Explorer members unlock deeper object and status
                                context; Scout and Command tiers unlock richer
                                payload, citation, and export-ready detail as
                                the dataset matures.
                            </p>
                        ) : null}
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Tracker status
                        </p>
                        <dl className="mt-5 space-y-3 text-sm text-potomac-cream/65">
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Missions</dt>
                                <dd className="text-white">
                                    {visibleMissions.length}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Objects</dt>
                                <dd className="text-white">{objectCount}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Launch windows</dt>
                                <dd className="text-white">{launchCount}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                                <dt>Source mode</dt>
                                <dd className="text-white">
                                    {fallback ? "Fallback" : "Supabase"}
                                </dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <div className="mt-10 flex flex-col gap-4 border-y border-white/10 py-5 md:flex-row md:items-center md:justify-between">
                    <FilterBar filters={filters} activeFilter={activeFilter} />
                    <Link
                        href="/member"
                        className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:text-potomac-cream"
                    >
                        Member workspace
                    </Link>
                </div>

                <div className="mt-8 space-y-6">
                    {visibleMissions.length ? (
                        visibleMissions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                mode={mode}
                            />
                        ))
                    ) : (
                        <section className="glass-card rounded p-6">
                            <h2 className="font-serif text-3xl text-white">
                                No matching tracker records.
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                                Change filters or return to the full lunar
                                tracker view.
                            </p>
                        </section>
                    )}
                </div>
            </div>
        </section>
    );
}
