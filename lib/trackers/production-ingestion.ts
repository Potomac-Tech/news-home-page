import "server-only";

import { createServiceClient } from "../supabase/service";

const LL2_URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/";
const NOAA_BASE = "https://services.swpc.noaa.gov/products";
const USASPENDING_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
const lunarTerms = /\b(lunar|moon|cislunar|artemis|clps|gateway)\b/i;

type LaunchRecord = {
    id: string;
    url?: string;
    name?: string;
    net?: string | null;
    window_start?: string | null;
    probability?: number | null;
    status?: { name?: string } | null;
    launch_service_provider?: { name?: string } | null;
    rocket?: { configuration?: { full_name?: string } | null } | null;
    mission?: {
        name?: string;
        description?: string;
        type?: string;
        orbit?: { name?: string } | null;
        agencies?: Array<{ name?: string }>;
    } | null;
    pad?: { name?: string; location?: { name?: string } | null } | null;
};

type LaunchResponse = { results?: LaunchRecord[] };
type NOAAScale = { Scale?: string | null; Text?: string | null };
type NOAAScaleRow = {
    DateStamp?: string;
    TimeStamp?: string;
    R?: NOAAScale;
    S?: NOAAScale;
    G?: NOAAScale;
};
type KpRow = { time_tag?: string; Kp?: number; station_count?: number };
type SolarWindSpeed = { proton_speed?: number; time_tag?: string };
type SolarWindField = { bt?: number; bz_gsm?: number; time_tag?: string };
type USAspendingAward = {
    internal_id?: number;
    "Award ID"?: string;
    "Recipient Name"?: string;
    "Start Date"?: string;
    "End Date"?: string;
    "Award Amount"?: number;
    "Awarding Agency"?: string;
    "Awarding Sub Agency"?: string;
    "Award Type"?: string | null;
    Description?: string;
    generated_internal_id?: string;
};
type USAspendingResponse = { results?: USAspendingAward[] };

function monday(value: Date) {
    const date = new Date(value);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return date.toISOString().slice(0, 10);
}

function launchStatus(value = "") {
    const normalized = value.toLowerCase();
    if (/success|complete/.test(normalized)) return "success";
    if (/fail/.test(normalized)) return "failed";
    if (/cancel/.test(normalized)) return "cancelled";
    if (/scrub/.test(normalized)) return "scrubbed";
    if (/hold|delay/.test(normalized)) return "delayed";
    if (/go|confirmed/.test(normalized)) return "confirmed";
    return "planned";
}

function isLunarLaunch(item: LaunchRecord) {
    const mission = item.mission ?? {};
    return lunarTerms.test(
        [item.name, mission.name, mission.description, mission.type, mission.orbit?.name]
            .filter(Boolean)
            .join(" ")
    );
}

function errorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (error && typeof error === "object") {
        const detail = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
        return [detail.message, detail.details, detail.hint, detail.code]
            .filter((value): value is string => typeof value === "string" && value.length > 0)
            .join(" | ");
    }
    return "Unknown ingestion error";
}

function normalizedLaunch(item: LaunchRecord, sourceId: string, runId: string, checkedAt: string) {
    const mission = item.mission ?? {};
    const text = [item.name, mission.name, mission.description, mission.type, mission.orbit?.name]
        .filter(Boolean)
        .join(" ");
    const scheduledAt = item.net ?? item.window_start ?? null;
    const launchSite = [item.pad?.name, item.pad?.location?.name].filter(Boolean).join(" / ");
    return {
        event_type: "launch",
        title: item.name ?? mission.name ?? "Launch awaiting editorial title review",
        week_timezone: "UTC",
        week_start_local: monday(new Date(scheduledAt ?? checkedAt)),
        scheduled_at: scheduledAt,
        launch_provider: item.launch_service_provider?.name ?? "Provider requires editorial review",
        vehicle: item.rocket?.configuration?.full_name ?? "Vehicle requires editorial review",
        mission_name: mission.name ?? item.name ?? "Mission requires editorial review",
        customer_payload: mission.agencies?.map((agency) => agency.name).filter(Boolean).join(", ") || null,
        launch_site: launchSite || "Launch site requires editorial review",
        event_location: item.pad?.location?.name ?? null,
        target_orbit_location: mission.orbit?.name ?? "Destination requires editorial review",
        status: launchStatus(item.status?.name),
        schedule_confidence: (item.probability ?? 0) >= 90 ? "high" : "medium",
        is_lunar_or_cislunar: lunarTerms.test(text),
        visibility: "member",
        primary_source_id: sourceId,
        external_source_key: String(item.id),
        ingestion_run_id: runId,
        source_checked_at: checkedAt,
        source_conflict: false,
        schedule_change_type: "new",
        ingestion_confidence: "medium",
    };
}

async function checkedJson<T>(url: string | URL): Promise<T> {
    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            "user-agent": "CabeusExplorer/1.0 info@potomacdb.com",
        },
        signal: AbortSignal.timeout(20_000),
        cache: "no-store",
    });
    if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}.`);
    return (await response.json()) as T;
}

async function checkedJsonPost<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "user-agent": "CabeusExplorer/1.0 info@potomacdb.com",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
    });
    if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}.`);
    return (await response.json()) as T;
}

export async function ingestLaunchLibrary() {
    const supabase = createServiceClient();
    const checkedAt = new Date().toISOString();
    const start = monday(new Date());
    const windowStart = new Date(`${start}T00:00:00Z`);
    const windowEnd = new Date(windowStart.getTime() + 14 * 86_400_000);
    const url = new URL(LL2_URL);
    url.searchParams.set("window_start__gte", windowStart.toISOString());
    url.searchParams.set("window_start__lte", windowEnd.toISOString());
    url.searchParams.set("limit", "100");

    const [{ data: source, error: sourceError }, payload] = await Promise.all([
        supabase
            .from("intelligence_data_sources")
            .select("id,source_key,license_status,analyst_review_state,publication_status")
            .eq("source_key", "launch-library-2")
            .single(),
        checkedJson<LaunchResponse>(url),
    ]);
    if (sourceError || !source) throw new Error("Approved Launch Library 2 registry source is missing.");
    if (
        source.license_status !== "approved" ||
        source.analyst_review_state !== "approved" ||
        source.publication_status !== "published"
    ) {
        throw new Error("Launch Library 2 is not approved for production ingestion.");
    }

    const fetchedRecords = [...new Map((payload.results ?? []).map((item) => [String(item.id), item])).values()];
    const records = fetchedRecords.filter(isLunarLaunch);
    const runKey = `ll2:${start}:${checkedAt}`;
    const { data: run, error: runError } = await supabase
        .from("weekly_lunar_ingestion_runs")
        .insert({
            run_key: runKey,
            source_registry_id: source.id,
            status: "running",
            window_start_at: windowStart.toISOString(),
            window_end_at: windowEnd.toISOString(),
            source_checked_at: checkedAt,
            records_fetched: fetchedRecords.length,
            metadata: { source: "launch-library-2", review_required: true, scheduled: true },
        })
        .select("id")
        .single();
    if (runError || !run) throw new Error(runError?.message ?? "Launch ingestion run could not start.");

    let created = 0;
    let updated = 0;
    try {
        for (const item of records) {
            const entry = normalizedLaunch(item, source.id, run.id, checkedAt);
            const { data: existing, error: existingError } = await supabase
                .from("weekly_lunar_tracker_entries")
                .select("id,scheduled_at,status,publication_status")
                .eq("primary_source_id", source.id)
                .eq("external_source_key", entry.external_source_key)
                .maybeSingle();
            if (existingError) throw existingError;
            let entryId: string;
            if (existing) {
                const scheduleChange =
                    existing.scheduled_at && entry.scheduled_at && new Date(entry.scheduled_at) > new Date(existing.scheduled_at)
                        ? "slip"
                        : existing.status !== entry.status
                          ? "status_change"
                          : "unchanged";
                const { error } = await supabase
                    .from("weekly_lunar_tracker_entries")
                    .update({ ...entry, schedule_change_type: scheduleChange })
                    .eq("id", existing.id);
                if (error) throw error;
                entryId = existing.id;
                updated += 1;
            } else {
                const { data: inserted, error } = await supabase
                    .from("weekly_lunar_tracker_entries")
                    .insert({ ...entry, publication_status: "draft" })
                    .select("id")
                    .single();
                if (error || !inserted) throw error ?? new Error("Launch row could not be inserted.");
                entryId = inserted.id;
                created += 1;
            }
            const citationUrl = item.url?.startsWith("https://") ? item.url : LL2_URL;
            const { error: citationError } = await supabase
                .from("weekly_lunar_tracker_sources")
                .upsert(
                    {
                        tracker_entry_id: entryId,
                        source_registry_id: source.id,
                        citation_title: item.name ?? "Launch Library 2 launch record",
                        citation_url: citationUrl,
                        retrieved_at: checkedAt,
                        is_primary: true,
                    },
                    { onConflict: "tracker_entry_id,source_registry_id,citation_url" }
                );
            if (citationError) throw citationError;
        }

        const { error: sourceCheckError } = await supabase
            .from("weekly_lunar_ingestion_source_checks")
            .insert({
                ingestion_run_id: run.id,
                source_registry_id: source.id,
                check_status: "checked",
                checked_at: checkedAt,
                citation_url: LL2_URL,
                check_note: "Scheduled Launch Library 2 API fetch completed; rows require editorial approval.",
            });
        if (sourceCheckError) throw sourceCheckError;
        const { error: finishError } = await supabase
            .from("weekly_lunar_ingestion_runs")
            .update({
                status: "completed",
                records_relevant: records.length,
                records_created: created,
                records_updated: updated,
                completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
        if (finishError) throw finishError;
        return { runId: run.id, fetched: records.length, created, updated };
    } catch (error) {
        await supabase
            .from("weekly_lunar_ingestion_runs")
            .update({
                status: "failed",
                error_summary: errorMessage(error).slice(0, 500),
                completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
        throw error;
    }
}

function sourceTime(value?: string) {
    if (!value) return null;
    const parsed = new Date(value.endsWith("Z") ? value : `${value}Z`);
    return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function freshness(sourceUpdatedAt: Date, staleAfterMinutes: number) {
    return Date.now() - sourceUpdatedAt.getTime() <= staleAfterMinutes * 60_000 ? "current" : "stale";
}

export async function ingestNoaaSpaceWeather() {
    const supabase = createServiceClient();
    const retrievedAt = new Date();
    const [scales, kpRows, speedRows, fieldRows] = await Promise.all([
        checkedJson<Record<string, NOAAScaleRow>>(`${NOAA_BASE}/noaa-scales.json`),
        checkedJson<KpRow[]>(`${NOAA_BASE}/noaa-planetary-k-index.json`),
        checkedJson<SolarWindSpeed[]>(`${NOAA_BASE}/summary/solar-wind-speed.json`),
        checkedJson<SolarWindField[]>(`${NOAA_BASE}/summary/solar-wind-mag-field.json`),
    ]);
    const observed = scales["0"];
    const kp = kpRows.at(-1);
    const speed = speedRows.at(-1);
    const field = fieldRows.at(-1);
    const scaleTime = sourceTime(
        observed?.DateStamp && observed.TimeStamp
            ? `${observed.DateStamp}T${observed.TimeStamp}`
            : undefined
    );
    const kpTime = sourceTime(kp?.time_tag);
    const solarWindTime = sourceTime(speed?.time_tag ?? field?.time_tag);
    if (!scaleTime || !kpTime || !solarWindTime) throw new Error("NOAA SWPC response omitted source timestamps.");

    const scaleValues = [observed.R?.Scale, observed.S?.Scale, observed.G?.Scale]
        .map((value) => Number(value ?? 0));
    const maximumScale = Math.max(...scaleValues);
    const rows = [
        {
            source_key: "noaa-swpc-current-conditions",
            source_name: "NOAA SWPC Current Conditions",
            source_agency: "NOAA / NWS Space Weather Prediction Center",
            source_product: "NOAA Scales current conditions",
            source_url: `${NOAA_BASE}/noaa-scales.json`,
            source_updated_at: scaleTime.toISOString(),
            source_retrieved_at: retrievedAt.toISOString(),
            stale_after_minutes: 30,
            freshness_status: freshness(scaleTime, 30),
            status_summary: `Observed NOAA scales: R${observed.R?.Scale ?? 0}, S${observed.S?.Scale ?? 0}, G${observed.G?.Scale ?? 0}.`,
            risk_label: maximumScale >= 3 ? "warning" : maximumScale >= 1 ? "watch" : "nominal",
            key_metrics: {
                radio_blackout: `R${observed.R?.Scale ?? 0} ${observed.R?.Text ?? "none"}`,
                solar_radiation: `S${observed.S?.Scale ?? 0} ${observed.S?.Text ?? "none"}`,
                geomagnetic_storm: `G${observed.G?.Scale ?? 0} ${observed.G?.Text ?? "none"}`,
            },
            publication_status: "published",
            published_at: retrievedAt.toISOString(),
            display_order: 10,
            metadata: { ingestion: "scheduled_noaa_swpc" },
        },
        {
            source_key: "noaa-swpc-planetary-k-index",
            source_name: "NOAA SWPC Planetary K-index",
            source_agency: "NOAA / NWS Space Weather Prediction Center",
            source_product: "Planetary K-index",
            source_url: `${NOAA_BASE}/noaa-planetary-k-index.json`,
            source_updated_at: kpTime.toISOString(),
            source_retrieved_at: retrievedAt.toISOString(),
            stale_after_minutes: 240,
            freshness_status: freshness(kpTime, 240),
            status_summary: `Latest reported planetary K-index is ${Number(kp?.Kp ?? 0).toFixed(2)}.`,
            risk_label: Number(kp?.Kp ?? 0) >= 7 ? "warning" : Number(kp?.Kp ?? 0) >= 5 ? "watch" : "nominal",
            key_metrics: { kp: kp?.Kp ?? null, reporting_stations: kp?.station_count ?? null },
            publication_status: "published",
            published_at: retrievedAt.toISOString(),
            display_order: 20,
            metadata: { ingestion: "scheduled_noaa_swpc" },
        },
        {
            source_key: "noaa-swpc-real-time-solar-wind",
            source_name: "NOAA SWPC Solar Wind Summary",
            source_agency: "NOAA / NWS Space Weather Prediction Center",
            source_product: "Real-time solar wind summary",
            source_url: `${NOAA_BASE}/summary/`,
            source_updated_at: solarWindTime.toISOString(),
            source_retrieved_at: retrievedAt.toISOString(),
            stale_after_minutes: 30,
            freshness_status: freshness(solarWindTime, 30),
            status_summary: `Solar-wind speed is ${speed?.proton_speed ?? "unavailable"} km/s; Bz GSM is ${field?.bz_gsm ?? "unavailable"} nT.`,
            risk_label: Number(speed?.proton_speed ?? 0) >= 700 ? "watch" : "nominal",
            key_metrics: {
                speed_km_s: speed?.proton_speed ?? null,
                total_field_nt: field?.bt ?? null,
                bz_gsm_nt: field?.bz_gsm ?? null,
            },
            publication_status: "published",
            published_at: retrievedAt.toISOString(),
            display_order: 30,
            metadata: { ingestion: "scheduled_noaa_swpc" },
        },
    ];
    const { error } = await supabase
        .from("space_weather_source_snapshots")
        .upsert(rows, { onConflict: "source_key" });
    if (error) throw error;
    return { updated: rows.length, retrievedAt: retrievedAt.toISOString() };
}

export async function ingestUSAspendingContractAwards(providedPayload?: USAspendingResponse) {
    const supabase = createServiceClient();
    const checkedAt = new Date().toISOString();
    const endDate = checkedAt.slice(0, 10);
    const startDate = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
    const sourceRequest = supabase
        .from("intelligence_data_sources")
        .select("id,source_key,license_status,analyst_review_state,publication_status")
        .eq("source_key", "usaspending-awards-api")
        .single();
    const payloadRequest = providedPayload
        ? Promise.resolve(providedPayload)
        : checkedJsonPost<USAspendingResponse>(USASPENDING_URL, {
            filters: {
                keywords: ["lunar", "moon", "cislunar", "artemis", "clps", "gateway"],
                award_type_codes: ["A", "B", "C", "D"],
                time_period: [{ start_date: startDate, end_date: endDate }],
            },
            fields: [
                "Award ID",
                "Recipient Name",
                "Start Date",
                "End Date",
                "Award Amount",
                "Awarding Agency",
                "Awarding Sub Agency",
                "Award Type",
                "Description",
            ],
            page: 1,
            limit: 10,
            sort: "Start Date",
            order: "desc",
          });
    const [{ data: source, error: sourceError }, payload] = await Promise.all([
        sourceRequest,
        payloadRequest,
    ]);
    if (sourceError || !source) throw new Error("Approved USAspending registry source is missing.");
    if (
        source.license_status !== "approved" ||
        source.analyst_review_state !== "approved" ||
        source.publication_status !== "published"
    ) {
        throw new Error("USAspending is not approved for production ingestion.");
    }

    const fetched = [...new Map((payload.results ?? []).map((item) => [String(item["Award ID"]), item])).values()];
    const records = fetched.filter((item) => {
        return Boolean(item["Award ID"] && item["Start Date"] && lunarTerms.test(item.Description ?? ""));
    });
    const { data: run, error: runError } = await supabase
        .from("contract_award_ingestion_runs")
        .insert({
            run_key: `usaspending-awards-api:${checkedAt}`,
            source_registry_id: source.id,
            source_checked_at: checkedAt,
            records_fetched: fetched.length,
            metadata: { source: "usaspending-awards-api", review_required: true, scheduled: true },
        })
        .select("id")
        .single();
    if (runError || !run) throw new Error(errorMessage(runError) || "Contract ingestion run could not start.");

    let created = 0;
    let updated = 0;
    try {
        for (let offset = 0; offset < records.length; offset += 10) {
            await Promise.all(records.slice(offset, offset + 10).map(async (item) => {
            const awardId = String(item["Award ID"]);
            const description = (item.Description ?? `Lunar contract ${awardId}`).trim();
            const citationUrl = item.generated_internal_id
                ? `https://www.usaspending.gov/award/${encodeURIComponent(item.generated_internal_id)}/latest`
                : `https://www.usaspending.gov/search/?hash=award_id&award_id=${encodeURIComponent(awardId)}`;
            const award = {
                external_source_key: awardId,
                source_registry_id: source.id,
                ingestion_run_id: run.id,
                title: description.slice(0, 240),
                award_date: item["Start Date"],
                customer_name: item["Awarding Agency"] ?? "U.S. government customer requires editorial review",
                vendor_name: item["Recipient Name"] ?? "Recipient requires editorial review",
                award_vehicle: item["Award Type"] ?? null,
                award_number: awardId,
                relevance_scope: "lunar",
                relevance_statement: "Direct lunar relevance is present in the cited USAspending award description.",
                is_space_or_lunar_relevant: true,
                confidence_label: "official",
                tier_visibility: "member",
                source_checked_at: checkedAt,
            };
            const { data: existing, error: existingError } = await supabase
                .from("contract_awards")
                .select("id")
                .eq("source_registry_id", source.id)
                .eq("external_source_key", awardId)
                .maybeSingle();
            if (existingError) throw existingError;
            let contractAwardId: string;
            if (existing) {
                const { error } = await supabase.from("contract_awards").update(award).eq("id", existing.id);
                if (error) throw error;
                contractAwardId = existing.id;
                updated += 1;
            } else {
                const { data: inserted, error } = await supabase
                    .from("contract_awards")
                    .insert({ ...award, publication_status: "draft" })
                    .select("id")
                    .single();
                if (error || !inserted) throw error ?? new Error("Contract award could not be inserted.");
                contractAwardId = inserted.id;
                created += 1;
            }
            const { error: citationError } = await supabase.from("contract_award_citations").upsert(
                {
                    contract_award_id: contractAwardId,
                    source_registry_id: source.id,
                    citation_title: `USAspending award ${awardId}`,
                    citation_url: citationUrl,
                    retrieved_at: checkedAt,
                    is_primary: true,
                },
                { onConflict: "contract_award_id,source_registry_id,citation_url" }
            );
            if (citationError) throw citationError;
            const amount = Number(item["Award Amount"]);
            const { error: valueError } = await supabase.from("contract_award_values").upsert(
                {
                    contract_award_id: contractAwardId,
                    value_state: Number.isFinite(amount) && amount >= 0 ? "exact_cited" : "unknown",
                    value_visibility: "scout",
                    currency_code: "USD",
                    exact_cited_amount: Number.isFinite(amount) && amount >= 0 ? amount : null,
                    source_registry_id: source.id,
                    source_citation_url: citationUrl,
                },
                { onConflict: "contract_award_id" }
            );
            if (valueError) throw valueError;
            }));
        }
        const { error: checkError } = await supabase.from("contract_award_source_checks").insert({
            ingestion_run_id: run.id,
            source_registry_id: source.id,
            check_status: "checked",
            checked_at: checkedAt,
            citation_url: USASPENDING_URL,
            check_note: "Scheduled USAspending API search completed; lunar records require editorial approval.",
        });
        if (checkError) throw checkError;
        const { error: finishError } = await supabase
            .from("contract_award_ingestion_runs")
            .update({
                status: "completed",
                records_relevant: records.length,
                records_created: created,
                records_updated: updated,
                records_excluded: fetched.length - records.length,
                completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
        if (finishError) throw finishError;
        return { runId: run.id, fetched: fetched.length, relevant: records.length, created, updated };
    } catch (error) {
        await supabase
            .from("contract_award_ingestion_runs")
            .update({
                status: "failed",
                error_summary: errorMessage(error).slice(0, 500),
                completed_at: new Date().toISOString(),
            })
            .eq("id", run.id);
        throw error;
    }
}

export type TrackerIngestionJob = "launches" | "space-weather" | "contract-awards";

export async function runTrackerIngestion(job: TrackerIngestionJob, payload?: unknown) {
    if (job === "launches") return { job, result: await ingestLaunchLibrary() };
    if (job === "contract-awards") {
        const providedPayload =
            payload && typeof payload === "object" && Array.isArray((payload as USAspendingResponse).results)
                ? (payload as USAspendingResponse)
                : undefined;
        return { job, result: await ingestUSAspendingContractAwards(providedPayload) };
    }
    return { job, result: await ingestNoaaSpaceWeather() };
}
