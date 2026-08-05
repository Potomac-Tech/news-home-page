import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "../supabase/service";

export type DeveloperClaim = {
    usageId: string;
    ownerUserId: string;
    organizationId: string | null;
    tier: string;
    quotaLimit: number;
    quotaUsed: number;
    quotaRemaining: number;
};

const errorMessages: Record<string, string> = {
    missing_api_key: "Provide an API key using Bearer authentication or X-API-Key.",
    invalid_api_key: "The API key is invalid, expired, paused, or revoked.",
    unknown_endpoint: "The requested API endpoint is not available.",
    scope_not_allowed: "This API key is not scoped for the requested endpoint.",
    tier_not_entitled: "This endpoint requires a higher membership tier.",
    monthly_quota_exceeded: "The monthly API quota has been exhausted.",
    per_minute_rate_exceeded: "Too many requests were received for this API key. Retry after one minute.",
};

function apiError(code: string, status: number, requestId: string) {
    return NextResponse.json(
        { error: { code, message: errorMessages[code] ?? "Request failed.", request_id: requestId } },
        { status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } }
    );
}

function suppliedKey(request: Request) {
    const authorization = request.headers.get("authorization") ?? "";
    if (authorization.toLowerCase().startsWith("bearer ")) {
        return authorization.slice(7).trim();
    }
    return request.headers.get("x-api-key")?.trim() ?? "";
}

export async function claimDeveloperRequest(request: Request, endpointKey: string) {
    const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
    const rawKey = suppliedKey(request);
    const keyHash = rawKey ? createHash("sha256").update(rawKey).digest("hex") : "";
    const supabase = createServiceClient();
    const { data: minuteAllowed, error: minuteError } = await supabase.rpc(
        "claim_developer_api_minute",
        { p_key_hash: keyHash, p_request_id: requestId, p_limit: 120 }
    );
    if (minuteError) {
        console.error("Developer API minute-rate claim failed", minuteError);
        return { response: apiError("authorization_unavailable", 503, requestId), claim: null, requestId };
    }
    if (minuteAllowed === false) {
        return { response: apiError("per_minute_rate_exceeded", 429, requestId), claim: null, requestId };
    }
    const { data, error } = await supabase.rpc("claim_developer_api_request", {
        p_key_hash: keyHash,
        p_endpoint_key: endpointKey,
        p_request_id: requestId,
    });
    if (error) {
        console.error("Developer API claim failed", error);
        return { response: apiError("authorization_unavailable", 503, requestId), claim: null, requestId };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.allowed) {
        return { response: apiError(String(row?.error_code ?? "invalid_api_key"), Number(row?.http_status ?? 401), requestId), claim: null, requestId };
    }
    const claim: DeveloperClaim = {
        usageId: String(row.usage_id),
        ownerUserId: String(row.owner_user_id),
        organizationId: row.organization_id ? String(row.organization_id) : null,
        tier: String(row.access_tier),
        quotaLimit: Number(row.quota_limit),
        quotaUsed: Number(row.quota_used),
        quotaRemaining: Number(row.quota_remaining),
    };
    return { response: null, claim, requestId };
}

export async function finishDeveloperRequest(
    claim: DeveloperClaim,
    startedAt: number,
    status: number,
    body: unknown,
    errorCode: string | null = null
) {
    const bytes = new TextEncoder().encode(JSON.stringify(body)).byteLength;
    const supabase = createServiceClient();
    const { error } = await supabase.rpc("complete_developer_api_request", {
        p_usage_id: claim.usageId,
        p_status_code: status,
        p_response_ms: Math.max(0, Date.now() - startedAt),
        p_response_bytes: bytes,
        p_error_code: errorCode,
    });
    if (error) console.error("Developer API usage completion failed", error);
}

export function apiSuccess(data: unknown, claim: DeveloperClaim, requestId: string, status = 200) {
    return NextResponse.json(
        { data, meta: { request_id: requestId, quota_limit: claim.quotaLimit, quota_used: claim.quotaUsed, quota_remaining: claim.quotaRemaining } },
        { status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId, "X-RateLimit-Limit": String(claim.quotaLimit), "X-RateLimit-Remaining": String(claim.quotaRemaining) } }
    );
}

export function apiFailure(code: string, message: string, status: number, requestId: string) {
    return NextResponse.json(
        { error: { code, message, request_id: requestId } },
        { status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } }
    );
}
