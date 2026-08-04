import type { createClient } from "../../lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type DeveloperTierLimit = {
    tier: string;
    monthlyApiQuota: number;
    dailyExportQuota: number;
    maxActiveApiKeys: number;
    maxWebhookSubscriptions: number;
    supportsWebhooks: boolean;
    supportsCommandEndpoints: boolean;
    retentionDays: number;
};

export type DeveloperEndpoint = {
    id: string;
    endpointKey: string;
    title: string;
    description: string;
    method: string;
    routeTemplate: string;
    minimumTier: string;
    quotaWeight: number;
    responseFormat: string;
    includesCommandData: boolean;
    documentationAnchor: string | null;
};

export type DeveloperApiKey = {
    id: string;
    keyName: string;
    keyPrefix: string;
    tier: string;
    status: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
};

export type DeveloperUsageLog = {
    id: string;
    endpointKey: string;
    eventKind: string;
    statusCode: number | null;
    quotaUnits: number;
    responseMs: number | null;
    occurredAt: string;
};

export type DeveloperWebhookSubscription = {
    id: string;
    subscriptionName: string;
    endpointUrl: string;
    eventKinds: string[];
    status: string;
    lastDeliveryAt: string | null;
    failureCount: number;
};

export type DeveloperExportJob = {
    id: string;
    exportName: string;
    sourceKind: string;
    exportFormat: string;
    status: string;
    rowCount: number | null;
    fileSizeBytes: number | null;
    requestedAt: string;
    completedAt: string | null;
    expiresAt: string | null;
};

export type DeveloperPlatformDashboard = {
    tierLimits: DeveloperTierLimit[];
    endpoints: DeveloperEndpoint[];
    apiKeys: DeveloperApiKey[];
    usageLogs: DeveloperUsageLog[];
    webhooks: DeveloperWebhookSubscription[];
    exportJobs: DeveloperExportJob[];
    sourceMode: "supabase" | "fallback";
    loadError: string | null;
};

export const fallbackTierLimits: DeveloperTierLimit[] = [
    {
        tier: "scout",
        monthlyApiQuota: 10000,
        dailyExportQuota: 25,
        maxActiveApiKeys: 3,
        maxWebhookSubscriptions: 0,
        supportsWebhooks: false,
        supportsCommandEndpoints: false,
        retentionDays: 90,
    },
    {
        tier: "command",
        monthlyApiQuota: 250000,
        dailyExportQuota: 250,
        maxActiveApiKeys: 20,
        maxWebhookSubscriptions: 25,
        supportsWebhooks: true,
        supportsCommandEndpoints: true,
        retentionDays: 365,
    },
];

export const fallbackEndpoints: DeveloperEndpoint[] = [
    {
        id: "lunar_articles",
        endpointKey: "lunar_articles",
        title: "Lunar Articles",
        description:
            "Published article teasers, member-readable bodies, tags, citations, and freshness metadata.",
        method: "GET",
        routeTemplate: "/api/v1/articles",
        minimumTier: "scout",
        quotaWeight: 1,
        responseFormat: "json",
        includesCommandData: false,
        documentationAnchor: "articles",
    },
    {
        id: "lunar_missions",
        endpointKey: "lunar_missions",
        title: "Lunar Missions",
        description:
            "Launches, spacecraft, landers, payloads, operators, source citations, and mission status.",
        method: "GET",
        routeTemplate: "/api/v1/lunar-missions",
        minimumTier: "scout",
        quotaWeight: 2,
        responseFormat: "json",
        includesCommandData: false,
        documentationAnchor: "missions",
    },
    {
        id: "procurement_regulatory",
        endpointKey: "procurement_regulatory",
        title: "Procurement And Regulatory",
        description:
            "Lunar solicitations, awards, filings, policy milestones, comment periods, and risk notes.",
        method: "GET",
        routeTemplate: "/api/v1/procurement-regulatory",
        minimumTier: "scout",
        quotaWeight: 2,
        responseFormat: "json",
        includesCommandData: false,
        documentationAnchor: "procurement-regulatory",
    },
    {
        id: "command_briefs",
        endpointKey: "command_briefs",
        title: "Cabeus Council Briefs",
        description:
            "Organization-level briefings, allocation-aware Cabeus Council intelligence, and delivery metadata.",
        method: "GET",
        routeTemplate: "/api/v1/command/briefs",
        minimumTier: "command",
        quotaWeight: 5,
        responseFormat: "json",
        includesCommandData: true,
        documentationAnchor: "command-briefs",
    },
];

const fallbackApiKeys: DeveloperApiKey[] = [
    {
        id: "fallback-key",
        keyName: "Primary integration key",
        keyPrefix: "pot_sc_live_...",
        tier: "scout",
        status: "active",
        lastUsedAt: null,
        expiresAt: null,
    },
];

const fallbackUsageLogs: DeveloperUsageLog[] = [
    {
        id: "fallback-usage-1",
        endpointKey: "lunar_articles",
        eventKind: "api_request",
        statusCode: 200,
        quotaUnits: 1,
        responseMs: 118,
        occurredAt: "2026-07-02T14:30:00.000Z",
    },
    {
        id: "fallback-usage-2",
        endpointKey: "export_jobs",
        eventKind: "export_download",
        statusCode: 202,
        quotaUnits: 5,
        responseMs: 240,
        occurredAt: "2026-07-02T13:05:00.000Z",
    },
];

const fallbackWebhooks: DeveloperWebhookSubscription[] = [
    {
        id: "fallback-webhook",
        subscriptionName: "Cabeus Council alert relay",
        endpointUrl: "https://example.com/potomac/webhooks",
        eventKinds: ["alert.created", "export.completed"],
        status: "active",
        lastDeliveryAt: null,
        failureCount: 0,
    },
];

const fallbackExportJobs: DeveloperExportJob[] = [
    {
        id: "fallback-export",
        exportName: "CLPS company watch",
        sourceKind: "company_profiles",
        exportFormat: "csv",
        status: "ready",
        rowCount: 42,
        fileSizeBytes: 184320,
        requestedAt: "2026-07-02T12:20:00.000Z",
        completedAt: "2026-07-02T12:21:00.000Z",
        expiresAt: "2026-07-09T12:21:00.000Z",
    },
];

function toTierLimit(row: Record<string, unknown>): DeveloperTierLimit {
    return {
        tier: String(row.tier),
        monthlyApiQuota: Number(row.monthly_api_quota ?? 0),
        dailyExportQuota: Number(row.daily_export_quota ?? 0),
        maxActiveApiKeys: Number(row.max_active_api_keys ?? 0),
        maxWebhookSubscriptions: Number(row.max_webhook_subscriptions ?? 0),
        supportsWebhooks: Boolean(row.supports_webhooks),
        supportsCommandEndpoints: Boolean(row.supports_command_endpoints),
        retentionDays: Number(row.retention_days ?? 0),
    };
}

function toEndpoint(row: Record<string, unknown>): DeveloperEndpoint {
    return {
        id: String(row.id),
        endpointKey: String(row.endpoint_key),
        title: String(row.title),
        description: String(row.description),
        method: String(row.method),
        routeTemplate: String(row.route_template),
        minimumTier: String(row.minimum_tier),
        quotaWeight: Number(row.quota_weight ?? 1),
        responseFormat: String(row.response_format),
        includesCommandData: Boolean(row.includes_command_data),
        documentationAnchor:
            typeof row.documentation_anchor === "string"
                ? row.documentation_anchor
                : null,
    };
}

function toApiKey(row: Record<string, unknown>): DeveloperApiKey {
    return {
        id: String(row.id),
        keyName: String(row.key_name),
        keyPrefix: String(row.key_prefix),
        tier: String(row.tier),
        status: String(row.status),
        lastUsedAt: typeof row.last_used_at === "string" ? row.last_used_at : null,
        expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
    };
}

function toUsageLog(row: Record<string, unknown>): DeveloperUsageLog {
    return {
        id: String(row.id),
        endpointKey: String(row.endpoint_key),
        eventKind: String(row.event_kind),
        statusCode:
            typeof row.status_code === "number" ? Number(row.status_code) : null,
        quotaUnits: Number(row.quota_units ?? 0),
        responseMs:
            typeof row.response_ms === "number" ? Number(row.response_ms) : null,
        occurredAt: String(row.occurred_at),
    };
}

function toWebhook(row: Record<string, unknown>): DeveloperWebhookSubscription {
    return {
        id: String(row.id),
        subscriptionName: String(row.subscription_name),
        endpointUrl: String(row.endpoint_url),
        eventKinds: Array.isArray(row.event_kinds)
            ? row.event_kinds.map(String)
            : [],
        status: String(row.status),
        lastDeliveryAt:
            typeof row.last_delivery_at === "string" ? row.last_delivery_at : null,
        failureCount: Number(row.failure_count ?? 0),
    };
}

function toExportJob(row: Record<string, unknown>): DeveloperExportJob {
    return {
        id: String(row.id),
        exportName: String(row.export_name),
        sourceKind: String(row.source_kind),
        exportFormat: String(row.export_format),
        status: String(row.status),
        rowCount: typeof row.row_count === "number" ? Number(row.row_count) : null,
        fileSizeBytes:
            typeof row.file_size_bytes === "number"
                ? Number(row.file_size_bytes)
                : null,
        requestedAt: String(row.requested_at),
        completedAt:
            typeof row.completed_at === "string" ? row.completed_at : null,
        expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
    };
}

export async function loadDeveloperPlatformDashboard({
    supabase,
    userId,
}: {
    supabase: SupabaseServerClient;
    userId: string;
}): Promise<DeveloperPlatformDashboard> {
    try {
        const [
            tierLimitResult,
            endpointResult,
            apiKeyResult,
            usageResult,
            webhookResult,
            exportJobResult,
        ] = await Promise.all([
            supabase
                .from("developer_tier_limits")
                .select("*")
                .order("monthly_api_quota", { ascending: true }),
            supabase
                .from("developer_endpoint_catalog")
                .select("*")
                .eq("status", "active")
                .order("minimum_tier", { ascending: true })
                .order("endpoint_key", { ascending: true }),
            supabase
                .from("developer_api_keys")
                .select("*")
                .eq("owner_user_id", userId)
                .order("updated_at", { ascending: false }),
            supabase
                .from("developer_api_usage_logs")
                .select("*")
                .eq("owner_user_id", userId)
                .order("occurred_at", { ascending: false })
                .limit(8),
            supabase
                .from("developer_webhook_subscriptions")
                .select("*")
                .eq("owner_user_id", userId)
                .order("updated_at", { ascending: false }),
            supabase
                .from("developer_export_jobs")
                .select("*")
                .eq("owner_user_id", userId)
                .order("requested_at", { ascending: false })
                .limit(8),
        ]);

        const firstError = [
            tierLimitResult.error,
            endpointResult.error,
            apiKeyResult.error,
            usageResult.error,
            webhookResult.error,
            exportJobResult.error,
        ].find(Boolean);

        if (firstError) {
            throw new Error(firstError.message);
        }

        return {
            tierLimits: (tierLimitResult.data ?? []).map((row) =>
                toTierLimit(row as Record<string, unknown>)
            ),
            endpoints: (endpointResult.data ?? []).map((row) =>
                toEndpoint(row as Record<string, unknown>)
            ),
            apiKeys: (apiKeyResult.data ?? []).map((row) =>
                toApiKey(row as Record<string, unknown>)
            ),
            usageLogs: (usageResult.data ?? []).map((row) =>
                toUsageLog(row as Record<string, unknown>)
            ),
            webhooks: (webhookResult.data ?? []).map((row) =>
                toWebhook(row as Record<string, unknown>)
            ),
            exportJobs: (exportJobResult.data ?? []).map((row) =>
                toExportJob(row as Record<string, unknown>)
            ),
            sourceMode: "supabase",
            loadError: null,
        };
    } catch (error) {
        return {
            tierLimits: fallbackTierLimits,
            endpoints: fallbackEndpoints,
            apiKeys: fallbackApiKeys,
            usageLogs: fallbackUsageLogs,
            webhooks: fallbackWebhooks,
            exportJobs: fallbackExportJobs,
            sourceMode: "fallback",
            loadError: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
