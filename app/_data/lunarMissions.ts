import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type LunarVisibilityTier = "public" | "member" | "scout" | "command";

export type LunarMissionRecord = {
    id: string;
    slug: string;
    missionName: string;
    programName: string | null;
    summary: string;
    primaryOperatorId: string | null;
    primaryOperatorName: string | null;
    currentPhase: string;
    currentStatus: string;
    targetBody: string;
    missionObjectives: string | null;
    visibilityTier: LunarVisibilityTier;
    confidenceLabel: string;
    qualityScore: number;
    freshnessAt: string | null;
    lastSourceAt: string | null;
    objects: LunarMissionObjectRecord[];
    launchWindows: LunarLaunchWindowRecord[];
    landingSites: LunarLandingSiteRecord[];
    payloads: LunarPayloadRecord[];
    statusEvents: LunarStatusEventRecord[];
    citations: LunarCitationRecord[];
    isFallback: boolean;
};

export type LunarMissionObjectRecord = {
    id: string;
    missionId: string;
    slug: string;
    objectName: string;
    objectType: string;
    currentPhase: string;
    currentStatus: string;
    spacecraftBus: string | null;
    launchVehicle: string | null;
    cosparId: string | null;
    noradId: number | null;
    massKg: number | null;
    destination: string;
    orbitName: string | null;
    description: string;
    visibilityTier: LunarVisibilityTier;
    confidenceLabel: string;
    freshnessAt: string | null;
    lastSourceAt: string | null;
};

export type LunarLaunchWindowRecord = {
    id: string;
    missionId: string;
    objectId: string | null;
    launchVehicle: string | null;
    launchSite: string | null;
    windowOpenAt: string | null;
    windowCloseAt: string | null;
    targetLaunchAt: string | null;
    actualLaunchAt: string | null;
    launchStatus: string;
    sourceNote: string | null;
    visibilityTier: LunarVisibilityTier;
    confidenceLabel: string;
    freshnessAt: string | null;
};

export type LunarLandingSiteRecord = {
    id: string;
    missionId: string;
    objectId: string | null;
    siteName: string;
    lunarRegion: string | null;
    latitudeDeg: number | null;
    longitudeDeg: number | null;
    targetLandingAt: string | null;
    actualLandingAt: string | null;
    landingStatus: string;
    geospatialNote: string | null;
    visibilityTier: LunarVisibilityTier;
    confidenceLabel: string;
    freshnessAt: string | null;
};

export type LunarPayloadRecord = {
    id: string;
    missionId: string;
    parentObjectId: string | null;
    payloadName: string;
    payloadType: string;
    instrumentCategory: string | null;
    scienceObjective: string | null;
    massKg: number | null;
    powerWatts: number | null;
    payloadStatus: string;
    visibilityTier: LunarVisibilityTier;
    confidenceLabel: string;
    freshnessAt: string | null;
};

export type LunarStatusEventRecord = {
    id: string;
    missionId: string;
    objectId: string | null;
    toPhase: string | null;
    toStatus: string;
    eventAt: string;
    eventSummary: string;
    sourceNote: string | null;
};

export type LunarCitationRecord = {
    id: string;
    missionId: string | null;
    objectId: string | null;
    launchWindowId: string | null;
    landingSiteId: string | null;
    payloadId: string | null;
    sourceName: string;
    title: string;
    url: string | null;
    publisher: string | null;
    publishedAt: string | null;
    retrievedAt: string | null;
    summary: string | null;
    reviewStatus: string;
    confidenceLabel: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const fallbackMissions: LunarMissionRecord[] = [
    {
        id: "fallback-artemis-ii",
        slug: "artemis-ii",
        missionName: "Artemis II",
        programName: "Artemis",
        summary:
            "Crewed lunar flyby mission used as the public tracker reference for launch timing, spacecraft status, and source freshness.",
        primaryOperatorId: "fallback-nasa",
        primaryOperatorName: "NASA",
        currentPhase: "integration",
        currentStatus: "planned",
        targetBody: "Moon",
        missionObjectives:
            "Validate crewed Orion and Space Launch System operations around the Moon before later surface missions.",
        visibilityTier: "public",
        confidenceLabel: "medium",
        qualityScore: 76,
        freshnessAt: "2026-06-30T12:00:00.000Z",
        lastSourceAt: "2026-06-30T12:00:00.000Z",
        objects: [
            {
                id: "fallback-orion",
                missionId: "fallback-artemis-ii",
                slug: "orion",
                objectName: "Orion crew spacecraft",
                objectType: "spacecraft",
                currentPhase: "integration",
                currentStatus: "planned",
                spacecraftBus: "Orion",
                launchVehicle: "SLS",
                cosparId: null,
                noradId: null,
                massKg: null,
                destination: "Lunar flyby",
                orbitName: "Free-return trajectory",
                description:
                    "Crew vehicle and service module tracked as a public mission object with detailed telemetry reserved for members.",
                visibilityTier: "public",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-30T12:00:00.000Z",
                lastSourceAt: "2026-06-30T12:00:00.000Z",
            },
        ],
        launchWindows: [
            {
                id: "fallback-artemis-ii-launch",
                missionId: "fallback-artemis-ii",
                objectId: "fallback-orion",
                launchVehicle: "SLS Block 1",
                launchSite: "Kennedy Space Center LC-39B",
                windowOpenAt: "2026-02-05T00:00:00.000Z",
                windowCloseAt: "2026-04-30T23:59:59.000Z",
                targetLaunchAt: null,
                actualLaunchAt: null,
                launchStatus: "planned",
                sourceNote:
                    "Fallback record should be replaced by live analyst-reviewed launch windows when Supabase is configured.",
                visibilityTier: "public",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-30T12:00:00.000Z",
            },
        ],
        landingSites: [],
        payloads: [],
        statusEvents: [
            {
                id: "fallback-artemis-ii-status",
                missionId: "fallback-artemis-ii",
                objectId: "fallback-orion",
                toPhase: "integration",
                toStatus: "planned",
                eventAt: "2026-06-30T12:00:00.000Z",
                eventSummary:
                    "Fallback tracker entry prepared for member terminal module testing.",
                sourceNote: "Analyst seed record.",
            },
        ],
        citations: [
            {
                id: "fallback-artemis-ii-citation",
                missionId: "fallback-artemis-ii",
                objectId: null,
                launchWindowId: null,
                landingSiteId: null,
                payloadId: null,
                sourceName: "NASA Artemis",
                title: "Artemis mission public information",
                url: "https://www.nasa.gov/humans-in-space/artemis/",
                publisher: "NASA",
                publishedAt: null,
                retrievedAt: "2026-06-30T12:00:00.000Z",
                summary:
                    "Public NASA program material used only as fallback source context.",
                reviewStatus: "queued",
                confidenceLabel: "medium",
            },
        ],
        isFallback: true,
    },
    {
        id: "fallback-clps-south-pole-lander",
        slug: "clps-south-pole-lander",
        missionName: "CLPS South Pole lander watch",
        programName: "Commercial Lunar Payload Services",
        summary:
            "Representative CLPS surface-delivery tracker for lander, payload, and landing-site module behavior.",
        primaryOperatorId: "fallback-clps",
        primaryOperatorName: "Commercial provider",
        currentPhase: "launch_window",
        currentStatus: "planned",
        targetBody: "Moon",
        missionObjectives:
            "Track commercial lunar delivery timing, payload readiness, surface destination, and source confidence.",
        visibilityTier: "member",
        confidenceLabel: "medium",
        qualityScore: 68,
        freshnessAt: "2026-06-29T16:00:00.000Z",
        lastSourceAt: "2026-06-29T16:00:00.000Z",
        objects: [
            {
                id: "fallback-clps-lander",
                missionId: "fallback-clps-south-pole-lander",
                slug: "surface-lander",
                objectName: "South Pole lander",
                objectType: "lander",
                currentPhase: "launch_window",
                currentStatus: "planned",
                spacecraftBus: "Commercial lunar lander",
                launchVehicle: "Commercial launch vehicle",
                cosparId: null,
                noradId: null,
                massKg: null,
                destination: "Lunar south pole region",
                orbitName: null,
                description:
                    "Member tracker object for landing status, payload manifest, and source freshness.",
                visibilityTier: "member",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-29T16:00:00.000Z",
                lastSourceAt: "2026-06-29T16:00:00.000Z",
            },
        ],
        launchWindows: [
            {
                id: "fallback-clps-launch",
                missionId: "fallback-clps-south-pole-lander",
                objectId: "fallback-clps-lander",
                launchVehicle: "Commercial launch vehicle",
                launchSite: "TBD",
                windowOpenAt: "2026-10-01T00:00:00.000Z",
                windowCloseAt: "2026-12-31T23:59:59.000Z",
                targetLaunchAt: null,
                actualLaunchAt: null,
                launchStatus: "planned",
                sourceNote: "Fallback launch window for UI verification.",
                visibilityTier: "member",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-29T16:00:00.000Z",
            },
        ],
        landingSites: [
            {
                id: "fallback-clps-landing",
                missionId: "fallback-clps-south-pole-lander",
                objectId: "fallback-clps-lander",
                siteName: "South pole candidate zone",
                lunarRegion: "South pole",
                latitudeDeg: null,
                longitudeDeg: null,
                targetLandingAt: null,
                actualLandingAt: null,
                landingStatus: "planned",
                geospatialNote:
                    "Exact coordinates are withheld until analyst review or member data access is available.",
                visibilityTier: "member",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-29T16:00:00.000Z",
            },
        ],
        payloads: [
            {
                id: "fallback-clps-payload",
                missionId: "fallback-clps-south-pole-lander",
                parentObjectId: "fallback-clps-lander",
                payloadName: "Surface instrument package",
                payloadType: "payload",
                instrumentCategory: "Surface science",
                scienceObjective:
                    "Demonstrate payload and instrument detail gates in the member tracker.",
                massKg: null,
                powerWatts: null,
                payloadStatus: "manifested",
                visibilityTier: "scout",
                confidenceLabel: "medium",
                freshnessAt: "2026-06-29T16:00:00.000Z",
            },
        ],
        statusEvents: [],
        citations: [
            {
                id: "fallback-clps-citation",
                missionId: "fallback-clps-south-pole-lander",
                objectId: null,
                launchWindowId: null,
                landingSiteId: null,
                payloadId: null,
                sourceName: "NASA CLPS",
                title: "Commercial Lunar Payload Services overview",
                url: "https://www.nasa.gov/commercial-lunar-payload-services/",
                publisher: "NASA",
                publishedAt: null,
                retrievedAt: "2026-06-29T16:00:00.000Z",
                summary:
                    "Public CLPS program context used for fallback tracker records.",
                reviewStatus: "queued",
                confidenceLabel: "medium",
            },
        ],
        isFallback: true,
    },
    {
        id: "fallback-lunar-orbiter",
        slug: "lunar-orbiter-watch",
        missionName: "Lunar orbiter watch",
        programName: "Cislunar communications",
        summary:
            "Representative satellite tracker record for orbit, COSPAR/NORAD placeholders, and detail-level gating.",
        primaryOperatorId: "fallback-orbiter-operator",
        primaryOperatorName: "Lunar communications operator",
        currentPhase: "operations",
        currentStatus: "active",
        targetBody: "Moon",
        missionObjectives:
            "Monitor active lunar relay and mapping satellites with freshness and confidence labels.",
        visibilityTier: "public",
        confidenceLabel: "low",
        qualityScore: 61,
        freshnessAt: "2026-06-28T18:00:00.000Z",
        lastSourceAt: "2026-06-28T18:00:00.000Z",
        objects: [
            {
                id: "fallback-lunar-satellite",
                missionId: "fallback-lunar-orbiter",
                slug: "relay-satellite",
                objectName: "Relay satellite",
                objectType: "lunar_satellite",
                currentPhase: "operations",
                currentStatus: "active",
                spacecraftBus: "Small satellite",
                launchVehicle: null,
                cosparId: null,
                noradId: null,
                massKg: null,
                destination: "Lunar orbit",
                orbitName: "Near-rectilinear halo orbit candidate",
                description:
                    "Public satellite row with orbital detail available to signed-in members as live records mature.",
                visibilityTier: "public",
                confidenceLabel: "low",
                freshnessAt: "2026-06-28T18:00:00.000Z",
                lastSourceAt: "2026-06-28T18:00:00.000Z",
            },
        ],
        launchWindows: [],
        landingSites: [],
        payloads: [],
        statusEvents: [],
        citations: [],
        isFallback: true,
    },
];

function humanize(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function toDate(value: string | null | undefined) {
    if (!value) {
        return 0;
    }

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mapTier(value: string | null | undefined): LunarVisibilityTier {
    if (
        value === "public" ||
        value === "member" ||
        value === "scout" ||
        value === "command"
    ) {
        return value;
    }

    return "member";
}

export function formatTrackerLabel(value: string | null | undefined) {
    return humanize(value);
}

export function formatTrackerDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatTrackerDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(date);
}

export function formatFreshness(value: string | null | undefined) {
    if (!value) {
        return "Freshness pending";
    }

    const timestamp = toDate(value);

    if (!timestamp) {
        return "Freshness pending";
    }

    const ageDays = Math.max(
        0,
        Math.floor((Date.now() - timestamp) / 86_400_000)
    );

    if (ageDays === 0) {
        return "Updated today";
    }

    if (ageDays === 1) {
        return "Updated 1 day ago";
    }

    return `Updated ${ageDays} days ago`;
}

export function earliestLaunchTime(mission: LunarMissionRecord) {
    const launchTimes = mission.launchWindows
        .map(
            (window) =>
                toDate(window.targetLaunchAt) ||
                toDate(window.windowOpenAt) ||
                toDate(window.actualLaunchAt)
        )
        .filter(Boolean);

    return launchTimes.length ? Math.min(...launchTimes) : 0;
}

export function latestFreshnessTime(mission: LunarMissionRecord) {
    return Math.max(
        toDate(mission.freshnessAt),
        ...mission.objects.map((object) => toDate(object.freshnessAt)),
        ...mission.launchWindows.map((window) => toDate(window.freshnessAt)),
        ...mission.landingSites.map((site) => toDate(site.freshnessAt))
    );
}

export function missionMatchesFilter(
    mission: LunarMissionRecord,
    filter: string
) {
    if (filter === "launches") {
        return mission.launchWindows.length > 0;
    }

    if (filter === "landers") {
        return mission.objects.some((object) => object.objectType === "lander");
    }

    if (filter === "satellites") {
        return mission.objects.some(
            (object) => object.objectType === "lunar_satellite"
        );
    }

    if (filter === "spacecraft") {
        return mission.objects.some(
            (object) =>
                object.objectType === "spacecraft" ||
                object.objectType === "lander" ||
                object.objectType === "lunar_satellite" ||
                object.objectType === "rover"
        );
    }

    if (filter === "active") {
        return (
            mission.currentStatus === "active" ||
            mission.objects.some((object) => object.currentStatus === "active")
        );
    }

    return true;
}

export function publicMissionPreview(mission: LunarMissionRecord) {
    const memberObjectCount = mission.objects.filter(
        (object) => object.visibilityTier !== "public"
    ).length;
    const memberPayloadCount = mission.payloads.filter(
        (payload) => payload.visibilityTier !== "public"
    ).length;

    return {
        memberObjectCount,
        memberPayloadCount,
        hiddenDetailCount: memberObjectCount + memberPayloadCount,
    };
}

async function loadOperatorNames(
    supabase: SupabaseServerClient,
    operatorIds: string[]
) {
    if (operatorIds.length === 0) {
        return new Map<string, string>();
    }

    const { data, error } = await supabase
        .from("lunar_operators")
        .select("id,name")
        .in("id", operatorIds);

    if (error) {
        throw new Error(error.message);
    }

    return new Map(
        ((data ?? []) as Array<{ id: string; name: string }>).map((operator) => [
            operator.id,
            operator.name,
        ])
    );
}

export async function loadLunarMissionTracker({
    supabase,
    includeMemberOnly = false,
}: {
    supabase?: SupabaseServerClient;
    includeMemberOnly?: boolean;
} = {}): Promise<LunarMissionRecord[]> {
    if (!hasPotomacSupabasePublicConfig() || !supabase) {
        return fallbackMissions;
    }

    const allowedTiers = includeMemberOnly
        ? ["public", "member", "scout", "command"]
        : ["public"];

    try {
        const missionResult = await supabase
            .from("lunar_missions")
            .select(
                "id,slug,mission_name,program_name,summary,primary_operator_id,current_phase,current_status,target_body,mission_objectives,visibility_tier,confidence_label,quality_score,freshness_at,last_source_at"
            )
            .eq("publication_status", "published")
            .in("visibility_tier", allowedTiers)
            .order("freshness_at", { ascending: false, nullsFirst: false })
            .limit(50);

        if (missionResult.error) {
            throw new Error(missionResult.error.message);
        }

        const missionRows = (missionResult.data ?? []) as Array<{
            id: string;
            slug: string;
            mission_name: string;
            program_name: string | null;
            summary: string;
            primary_operator_id: string | null;
            current_phase: string;
            current_status: string;
            target_body: string;
            mission_objectives: string | null;
            visibility_tier: string;
            confidence_label: string;
            quality_score: number;
            freshness_at: string | null;
            last_source_at: string | null;
        }>;

        if (missionRows.length === 0) {
            return fallbackMissions;
        }

        const missionIds = missionRows.map((mission) => mission.id);
        const operatorIds = missionRows
            .map((mission) => mission.primary_operator_id)
            .filter((id): id is string => Boolean(id));

        const [
            operatorNames,
            objectResult,
            launchResult,
            landingResult,
            payloadResult,
            statusResult,
            citationResult,
        ] = await Promise.all([
            loadOperatorNames(supabase, operatorIds),
            supabase
                .from("lunar_mission_objects")
                .select(
                    "id,mission_id,slug,object_name,object_type,current_phase,current_status,spacecraft_bus,launch_vehicle,cospar_id,norad_id,mass_kg,destination,orbit_name,description,visibility_tier,confidence_label,freshness_at,last_source_at"
                )
                .in("mission_id", missionIds)
                .in("visibility_tier", allowedTiers)
                .order("object_type", { ascending: true }),
            supabase
                .from("lunar_launch_windows")
                .select(
                    "id,mission_id,object_id,launch_vehicle,launch_site,window_open_at,window_close_at,target_launch_at,actual_launch_at,launch_status,source_note,visibility_tier,confidence_label,freshness_at"
                )
                .in("mission_id", missionIds)
                .in("visibility_tier", allowedTiers)
                .order("target_launch_at", { ascending: true, nullsFirst: false }),
            supabase
                .from("lunar_landing_sites")
                .select(
                    "id,mission_id,object_id,site_name,lunar_region,latitude_deg,longitude_deg,target_landing_at,actual_landing_at,landing_status,geospatial_note,visibility_tier,confidence_label,freshness_at"
                )
                .in("mission_id", missionIds)
                .in("visibility_tier", allowedTiers)
                .order("target_landing_at", {
                    ascending: true,
                    nullsFirst: false,
                }),
            supabase
                .from("lunar_payloads")
                .select(
                    "id,mission_id,parent_object_id,payload_name,payload_type,instrument_category,science_objective,mass_kg,power_watts,payload_status,visibility_tier,confidence_label,freshness_at"
                )
                .in("mission_id", missionIds)
                .in("visibility_tier", allowedTiers)
                .order("payload_name", { ascending: true }),
            includeMemberOnly
                ? supabase
                      .from("lunar_mission_status_events")
                      .select(
                          "id,mission_id,object_id,to_phase,to_status,event_at,event_summary,source_note"
                      )
                      .in("mission_id", missionIds)
                      .order("event_at", { ascending: false })
                      .limit(100)
                : Promise.resolve({ data: [], error: null }),
            supabase
                .from("lunar_mission_source_citations")
                .select(
                    "id,mission_id,object_id,launch_window_id,landing_site_id,payload_id,source_name,title,url,publisher,published_at,retrieved_at,summary,review_status,confidence_label"
                )
                .or(
                    `mission_id.in.(${missionIds.join(",")}),object_id.not.is.null,launch_window_id.not.is.null,landing_site_id.not.is.null,payload_id.not.is.null`
                )
                .order("display_order", { ascending: true }),
        ]);

        const firstError =
            objectResult.error ??
            launchResult.error ??
            landingResult.error ??
            payloadResult.error ??
            statusResult.error ??
            citationResult.error;

        if (firstError) {
            throw new Error(firstError.message);
        }

        const objects = (objectResult.data ?? []) as Array<{
            id: string;
            mission_id: string;
            slug: string;
            object_name: string;
            object_type: string;
            current_phase: string;
            current_status: string;
            spacecraft_bus: string | null;
            launch_vehicle: string | null;
            cospar_id: string | null;
            norad_id: number | null;
            mass_kg: number | null;
            destination: string;
            orbit_name: string | null;
            description: string;
            visibility_tier: string;
            confidence_label: string;
            freshness_at: string | null;
            last_source_at: string | null;
        }>;
        const launchWindows = (launchResult.data ?? []) as Array<{
            id: string;
            mission_id: string;
            object_id: string | null;
            launch_vehicle: string | null;
            launch_site: string | null;
            window_open_at: string | null;
            window_close_at: string | null;
            target_launch_at: string | null;
            actual_launch_at: string | null;
            launch_status: string;
            source_note: string | null;
            visibility_tier: string;
            confidence_label: string;
            freshness_at: string | null;
        }>;
        const landingSites = (landingResult.data ?? []) as Array<{
            id: string;
            mission_id: string;
            object_id: string | null;
            site_name: string;
            lunar_region: string | null;
            latitude_deg: number | null;
            longitude_deg: number | null;
            target_landing_at: string | null;
            actual_landing_at: string | null;
            landing_status: string;
            geospatial_note: string | null;
            visibility_tier: string;
            confidence_label: string;
            freshness_at: string | null;
        }>;
        const payloads = (payloadResult.data ?? []) as Array<{
            id: string;
            mission_id: string;
            parent_object_id: string | null;
            payload_name: string;
            payload_type: string;
            instrument_category: string | null;
            science_objective: string | null;
            mass_kg: number | null;
            power_watts: number | null;
            payload_status: string;
            visibility_tier: string;
            confidence_label: string;
            freshness_at: string | null;
        }>;
        const statusEvents = (statusResult.data ?? []) as Array<{
            id: string;
            mission_id: string;
            object_id: string | null;
            to_phase: string | null;
            to_status: string;
            event_at: string;
            event_summary: string;
            source_note: string | null;
        }>;
        const citations = (citationResult.data ?? []) as Array<{
            id: string;
            mission_id: string | null;
            object_id: string | null;
            launch_window_id: string | null;
            landing_site_id: string | null;
            payload_id: string | null;
            source_name: string;
            title: string;
            url: string | null;
            publisher: string | null;
            published_at: string | null;
            retrieved_at: string | null;
            summary: string | null;
            review_status: string;
            confidence_label: string;
        }>;

        return missionRows.map((mission) => {
            const missionObjects = objects.filter(
                (object) => object.mission_id === mission.id
            );
            const missionLaunches = launchWindows.filter(
                (window) => window.mission_id === mission.id
            );
            const missionLandings = landingSites.filter(
                (site) => site.mission_id === mission.id
            );
            const missionPayloads = payloads.filter(
                (payload) => payload.mission_id === mission.id
            );
            const objectIds = new Set(missionObjects.map((object) => object.id));
            const launchIds = new Set(missionLaunches.map((window) => window.id));
            const landingIds = new Set(missionLandings.map((site) => site.id));
            const payloadIds = new Set(
                missionPayloads.map((payload) => payload.id)
            );

            return {
                id: mission.id,
                slug: mission.slug,
                missionName: mission.mission_name,
                programName: mission.program_name,
                summary: mission.summary,
                primaryOperatorId: mission.primary_operator_id,
                primaryOperatorName: mission.primary_operator_id
                    ? operatorNames.get(mission.primary_operator_id) ?? null
                    : null,
                currentPhase: mission.current_phase,
                currentStatus: mission.current_status,
                targetBody: mission.target_body,
                missionObjectives: mission.mission_objectives,
                visibilityTier: mapTier(mission.visibility_tier),
                confidenceLabel: mission.confidence_label,
                qualityScore: mission.quality_score,
                freshnessAt: mission.freshness_at,
                lastSourceAt: mission.last_source_at,
                objects: missionObjects.map((object) => ({
                    id: object.id,
                    missionId: object.mission_id,
                    slug: object.slug,
                    objectName: object.object_name,
                    objectType: object.object_type,
                    currentPhase: object.current_phase,
                    currentStatus: object.current_status,
                    spacecraftBus: object.spacecraft_bus,
                    launchVehicle: object.launch_vehicle,
                    cosparId: object.cospar_id,
                    noradId: object.norad_id,
                    massKg: object.mass_kg,
                    destination: object.destination,
                    orbitName: object.orbit_name,
                    description: object.description,
                    visibilityTier: mapTier(object.visibility_tier),
                    confidenceLabel: object.confidence_label,
                    freshnessAt: object.freshness_at,
                    lastSourceAt: object.last_source_at,
                })),
                launchWindows: missionLaunches.map((window) => ({
                    id: window.id,
                    missionId: window.mission_id,
                    objectId: window.object_id,
                    launchVehicle: window.launch_vehicle,
                    launchSite: window.launch_site,
                    windowOpenAt: window.window_open_at,
                    windowCloseAt: window.window_close_at,
                    targetLaunchAt: window.target_launch_at,
                    actualLaunchAt: window.actual_launch_at,
                    launchStatus: window.launch_status,
                    sourceNote: window.source_note,
                    visibilityTier: mapTier(window.visibility_tier),
                    confidenceLabel: window.confidence_label,
                    freshnessAt: window.freshness_at,
                })),
                landingSites: missionLandings.map((site) => ({
                    id: site.id,
                    missionId: site.mission_id,
                    objectId: site.object_id,
                    siteName: site.site_name,
                    lunarRegion: site.lunar_region,
                    latitudeDeg: site.latitude_deg,
                    longitudeDeg: site.longitude_deg,
                    targetLandingAt: site.target_landing_at,
                    actualLandingAt: site.actual_landing_at,
                    landingStatus: site.landing_status,
                    geospatialNote: site.geospatial_note,
                    visibilityTier: mapTier(site.visibility_tier),
                    confidenceLabel: site.confidence_label,
                    freshnessAt: site.freshness_at,
                })),
                payloads: missionPayloads.map((payload) => ({
                    id: payload.id,
                    missionId: payload.mission_id,
                    parentObjectId: payload.parent_object_id,
                    payloadName: payload.payload_name,
                    payloadType: payload.payload_type,
                    instrumentCategory: payload.instrument_category,
                    scienceObjective: payload.science_objective,
                    massKg: payload.mass_kg,
                    powerWatts: payload.power_watts,
                    payloadStatus: payload.payload_status,
                    visibilityTier: mapTier(payload.visibility_tier),
                    confidenceLabel: payload.confidence_label,
                    freshnessAt: payload.freshness_at,
                })),
                statusEvents: statusEvents
                    .filter((event) => event.mission_id === mission.id)
                    .map((event) => ({
                        id: event.id,
                        missionId: event.mission_id,
                        objectId: event.object_id,
                        toPhase: event.to_phase,
                        toStatus: event.to_status,
                        eventAt: event.event_at,
                        eventSummary: event.event_summary,
                        sourceNote: event.source_note,
                    })),
                citations: citations
                    .filter(
                        (citation) =>
                            citation.mission_id === mission.id ||
                            (citation.object_id &&
                                objectIds.has(citation.object_id)) ||
                            (citation.launch_window_id &&
                                launchIds.has(citation.launch_window_id)) ||
                            (citation.landing_site_id &&
                                landingIds.has(citation.landing_site_id)) ||
                            (citation.payload_id &&
                                payloadIds.has(citation.payload_id))
                    )
                    .map((citation) => ({
                        id: citation.id,
                        missionId: citation.mission_id,
                        objectId: citation.object_id,
                        launchWindowId: citation.launch_window_id,
                        landingSiteId: citation.landing_site_id,
                        payloadId: citation.payload_id,
                        sourceName: citation.source_name,
                        title: citation.title,
                        url: citation.url,
                        publisher: citation.publisher,
                        publishedAt: citation.published_at,
                        retrievedAt: citation.retrieved_at,
                        summary: citation.summary,
                        reviewStatus: citation.review_status,
                        confidenceLabel: citation.confidence_label,
                    })),
                isFallback: false,
            };
        });
    } catch {
        return fallbackMissions;
    }
}

export async function loadLunarMissionBySlug({
    slug,
    supabase,
    includeMemberOnly = false,
}: {
    slug: string;
    supabase?: SupabaseServerClient;
    includeMemberOnly?: boolean;
}) {
    const missions = await loadLunarMissionTracker({
        supabase,
        includeMemberOnly,
    });

    return missions.find((mission) => mission.slug === slug) ?? null;
}
