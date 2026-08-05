import "server-only";

import { apiFailure, apiSuccess, claimDeveloperRequest, finishDeveloperRequest } from "./api-runtime";
import { loadDeveloperSource, type DeveloperSource } from "./data-sources";
import { createServiceClient } from "../supabase/service";

export async function runDeveloperDataRoute(request: Request, endpointKey: DeveloperSource) {
    const startedAt = Date.now();
    const auth = await claimDeveloperRequest(request, endpointKey);
    if (!auth.claim) return auth.response;
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
    const result = await loadDeveloperSource(
        createServiceClient(), endpointKey, auth.claim,
        Number.isFinite(limit) ? limit : 50,
        Number.isFinite(offset) && offset >= 0 ? offset : 0
    );
    if (result.error) {
        await finishDeveloperRequest(auth.claim, startedAt, 500, {}, "source_unavailable");
        return apiFailure("source_unavailable", "The requested data source is temporarily unavailable.", 500, auth.requestId);
    }
    const body = result.data ?? [];
    await finishDeveloperRequest(auth.claim, startedAt, 200, body);
    return apiSuccess(body, auth.claim, auth.requestId);
}
