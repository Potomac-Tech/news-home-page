import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "xlpkdoeldtlhearqajat";
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;
const lunarTerms = /\b(lunar|moon|cislunar|artemis|clps|gateway)\b/i;

function options(argv) {
    const result = { input: null, apply: false, start: null, end: null };
    for (let i = 0; i < argv.length; i += 1) {
        if (argv[i] === "--input") result.input = argv[++i];
        else if (argv[i] === "--apply") result.apply = true;
        else if (argv[i] === "--start") result.start = argv[++i];
        else if (argv[i] === "--end") result.end = argv[++i];
        else throw new Error(`Unknown argument: ${argv[i]}`);
    }
    return result;
}

function monday(date) {
    const value = new Date(date);
    const day = value.getUTCDay() || 7;
    value.setUTCDate(value.getUTCDate() - day + 1);
    return value.toISOString().slice(0, 10);
}

function status(value = "") {
    const normalized = value.toLowerCase();
    if (/success|complete/.test(normalized)) return "success";
    if (/fail/.test(normalized)) return "failed";
    if (/scrub/.test(normalized)) return "scrubbed";
    if (/hold/.test(normalized)) return "delayed";
    if (/go|confirmed/.test(normalized)) return "confirmed";
    return "planned";
}

export function normalizeLaunch(item, sourceId, runId, checkedAt) {
    const mission = item.mission ?? {};
    const text = [item.name, mission.name, mission.description, mission.type, mission.orbit?.name].filter(Boolean).join(" ");
    if (!lunarTerms.test(text)) return null;
    const scheduledAt = item.net ?? item.window_start ?? null;
    const statusValue = status(item.status?.name);
    return {
        event_type: "launch", title: item.name ?? mission.name ?? "Lunar launch",
        week_timezone: "UTC", week_start_local: monday(scheduledAt ?? checkedAt), scheduled_at: scheduledAt,
        launch_provider: item.launch_service_provider?.name ?? "Provider pending review",
        vehicle: item.rocket?.configuration?.full_name ?? "Vehicle pending review",
        mission_name: mission.name ?? item.name ?? "Mission pending review",
        customer_payload: mission.agencies?.map((agency) => agency.name).join(", ") || null,
        launch_site: [item.pad?.name, item.pad?.location?.name].filter(Boolean).join(" / ") || "Site pending review",
        event_location: item.pad?.location?.name ?? null,
        target_orbit_location: mission.orbit?.name ?? "Lunar/cislunar destination pending review",
        status: statusValue, schedule_confidence: item.probability >= 90 ? "high" : "medium",
        is_lunar_or_cislunar: true, publication_status: "draft", visibility: "member",
        primary_source_id: sourceId, external_source_key: String(item.id), ingestion_run_id: runId,
        source_checked_at: checkedAt, source_conflict: false,
        schedule_change_type: /scrub/.test(item.status?.name?.toLowerCase() ?? "") ? "scrub" : /hold/.test(item.status?.name?.toLowerCase() ?? "") ? "hold" : "new",
        ingestion_confidence: "medium",
    };
}

async function inputData(config, start, end) {
    if (config.input) return JSON.parse(await readFile(config.input, "utf8"));
    const url = new URL("https://ll.thespacedevs.com/2.3.0/launches/upcoming/");
    url.searchParams.set("window_start__gte", start);
    url.searchParams.set("window_start__lte", end);
    url.searchParams.set("limit", "100");
    const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "CabeusExplorer/0.1 info@potomacdb.com" } });
    if (!response.ok) throw new Error(`Launch Library 2 returned ${response.status}.`);
    return response.json();
}

async function main() {
    const config = options(process.argv.slice(2));
    const now = new Date();
    const start = config.start ?? monday(now);
    const end = config.end ?? new Date(new Date(`${start}T00:00:00Z`).getTime() + 7 * 86_400_000).toISOString();
    const checkedAt = now.toISOString();
    const data = await inputData(config, start, end);
    const deduped = [...new Map((data.results ?? []).map((item) => [String(item.id), item])).values()];
    const preview = deduped.map((item) => normalizeLaunch(item, "SOURCE_ID", "RUN_ID", checkedAt)).filter(Boolean);
    if (!config.apply) {
        console.log(JSON.stringify({ dryRun: true, fetched: deduped.length, relevant: preview.length, entries: preview }, null, 2));
        return;
    }
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
    if (url !== PROJECT_URL || !key) throw new Error(`Apply requires canonical ${PROJECT_REF} service credentials.`);
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const validationKeys = ["launch-library-2", "nasa-launch-schedule", "nasa-clps", "space-force-news", "spaceflight-now-schedule", "next-spaceflight-calendar"];
    const { data: sources, error: sourceError } = await supabase.from("intelligence_data_sources").select("id,source_key").in("source_key", validationKeys);
    if (sourceError) throw sourceError;
    const sourceByKey = new Map(sources.map((source) => [source.source_key, source]));
    const source = sourceByKey.get("launch-library-2");
    if (!source) throw new Error("Approved Launch Library 2 registry source is missing.");
    const runKey = `ll2:${start}:${checkedAt}`;
    const { data: run, error: runError } = await supabase.from("weekly_lunar_ingestion_runs").insert({ run_key: runKey, source_registry_id: source.id, status: "running", window_start_at: new Date(`${start}T00:00:00Z`).toISOString(), window_end_at: end, source_checked_at: checkedAt, records_fetched: deduped.length, metadata: { source: "launch-library-2", review_required: true } }).select("id").single();
    if (runError) throw runError;
    const entries = deduped.map((item) => normalizeLaunch(item, source.id, run.id, checkedAt)).filter(Boolean);
    const keys = entries.map((entry) => entry.external_source_key);
    const { data: existingRows, error: existingError } = keys.length
        ? await supabase.from("weekly_lunar_tracker_entries").select("id,external_source_key,scheduled_at,status").eq("primary_source_id", source.id).in("external_source_key", keys)
        : { data: [], error: null };
    if (existingError) throw existingError;
    const existingByKey = new Map(existingRows.map((entry) => [entry.external_source_key, entry]));
    let created = 0;
    let updated = 0;
    for (const entry of entries) {
        const existing = existingByKey.get(entry.external_source_key);
        if (existing) {
            if (existing.scheduled_at && entry.scheduled_at && new Date(entry.scheduled_at) > new Date(existing.scheduled_at)) entry.schedule_change_type = "slip";
            else if (existing.status !== entry.status) entry.schedule_change_type = "status_change";
            else entry.schedule_change_type = "unchanged";
            const { error } = await supabase.from("weekly_lunar_tracker_entries").update(entry).eq("id", existing.id);
            if (error) throw error;
            updated += 1;
        } else {
            const { error } = await supabase.from("weekly_lunar_tracker_entries").insert(entry);
            if (error) throw error;
            created += 1;
        }
    }
    const sourceChecks = [...sourceByKey.values()].map((candidate) => ({
        ingestion_run_id: run.id,
        source_registry_id: candidate.id,
        check_status: candidate.source_key === "launch-library-2" ? "checked" : "pending_manual",
        checked_at: candidate.source_key === "launch-library-2" ? checkedAt : null,
        citation_url: candidate.source_key === "launch-library-2" ? "https://ll.thespacedevs.com/" : null,
        check_note: candidate.source_key === "launch-library-2" ? "Primary API fetch completed." : "Official/customer or commercial cross-check queued for editor review.",
    }));
    const { error: checksError } = await supabase.from("weekly_lunar_ingestion_source_checks").insert(sourceChecks);
    if (checksError) throw checksError;
    const { error: finishError } = await supabase.from("weekly_lunar_ingestion_runs").update({ status: "completed", records_relevant: entries.length, records_created: created, records_updated: updated, completed_at: new Date().toISOString() }).eq("id", run.id);
    if (finishError) throw finishError;
    if (!entries.length) {
        const { error } = await supabase.from("weekly_lunar_empty_states").upsert({ week_timezone: "UTC", week_start_local: start, filter_scope: "lunar_cislunar", source_registry_id: source.id, ingestion_run_id: run.id, source_checked_at: checkedAt });
        if (error) throw error;
    }
    console.log(JSON.stringify({ applied: true, runId: run.id, entries: entries.length }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
