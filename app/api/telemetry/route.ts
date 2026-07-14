import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "../../../lib/supabase/service";

export const dynamic = "force-dynamic";

const eventKinds = new Set(["navigation", "web_vital", "client_error"]);
const metricNames = new Set(["CLS", "FCP", "INP", "LCP", "TTFB", "window_error", "unhandled_rejection"]);

function cleanText(value: unknown, maxLength: number) {
    return String(value ?? "")
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
        .slice(0, maxLength);
}

function cleanMetadata(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const source = value as Record<string, unknown>;
    const allowed = ["navigation_type", "message"];
    return Object.fromEntries(allowed.filter((key) => key in source).map((key) => [key, cleanText(source[key], 240)]));
}

export async function POST(request: Request) {
    const requestId = request.headers.get("x-request-id")?.slice(0, 100) || randomUUID();
    if (request.headers.get("x-analytics-consent") !== "granted") {
        return NextResponse.json({ error: "Analytics consent is required.", request_id: requestId }, { status: 403 });
    }
    const hashSecret = process.env.TELEMETRY_HASH_SECRET?.trim();
    if (!hashSecret) {
        console.error(JSON.stringify({ level: "error", event: "telemetry_config_missing", request_id: requestId }));
        return NextResponse.json({ error: "Telemetry is unavailable.", request_id: requestId }, { status: 503 });
    }
    if (Number(request.headers.get("content-length") ?? 0) > 16384) {
        return NextResponse.json({ error: "Payload is too large.", request_id: requestId }, { status: 413 });
    }
    const input = await request.json().catch(() => null) as Record<string, unknown> | null;
    const eventKind = cleanText(input?.event_kind, 40);
    const routePath = cleanText(input?.route_path, 200).split(/[?#]/, 1)[0];
    const metricName = input?.metric_name ? cleanText(input.metric_name, 80) : null;
    const metricValue = typeof input?.metric_value === "number" && Number.isFinite(input.metric_value)
        ? Math.max(-1_000_000, Math.min(input.metric_value, 1_000_000))
        : null;
    const metricRating = ["good", "needs-improvement", "poor"].includes(String(input?.metric_rating))
        ? String(input?.metric_rating)
        : null;
    if (!eventKinds.has(eventKind) || !routePath.startsWith("/") || (metricName && !metricNames.has(metricName))) {
        return NextResponse.json({ error: "Invalid telemetry payload.", request_id: requestId }, { status: 400 });
    }

    const networkIdentity = request.headers.get("cf-connecting-ip")
        ?? request.headers.get("x-forwarded-for")?.split(",", 1)[0]
        ?? "unknown";
    const fingerprint = createHash("sha256")
        .update(`${hashSecret}:${networkIdentity}:${request.headers.get("user-agent") ?? "unknown"}`)
        .digest("hex");
    const supabase = createServiceClient();
    const { data: allowed, error: rateError } = await supabase.rpc("claim_operational_telemetry_event", {
        p_fingerprint_hash: fingerprint,
        p_limit: 60,
    });
    if (rateError || allowed !== true) {
        console.warn(JSON.stringify({ level: "warn", event: "telemetry_rate_limited", request_id: requestId }));
        return NextResponse.json({ error: "Telemetry rate limit exceeded.", request_id: requestId }, { status: 429 });
    }
    const { error } = await supabase.from("operational_telemetry_events").insert({
        event_kind: eventKind,
        route_path: routePath,
        metric_name: metricName,
        metric_value: metricValue,
        metric_rating: metricRating,
        request_id: requestId,
        session_hash: fingerprint,
        metadata: cleanMetadata(input?.metadata),
    });
    if (error) {
        console.error(JSON.stringify({ level: "error", event: "telemetry_insert_failed", request_id: requestId, code: error.code }));
        return NextResponse.json({ error: "Telemetry could not be recorded.", request_id: requestId }, { status: 500 });
    }
    console.info(JSON.stringify({ level: "info", event: "telemetry_recorded", event_kind: eventKind, metric_name: metricName, request_id: requestId }));
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } });
}
