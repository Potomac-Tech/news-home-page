import { createClient } from "../../lib/supabase/server";
import type {
    SavedSearchFrequency,
    SavedWorkObjectKind,
} from "./savedWork";

export type AlertTier = "explorer" | "scout" | "command" | "staff";
export type AlertSeverity = "info" | "watch" | "urgent";
export type AlertTriggerKind =
    | "watched_object_changed"
    | "saved_search_match"
    | "freshness_stale"
    | "platform_event"
    | "command_intelligence";

export type AlertTierLimit = {
    tier: AlertTier;
    maxActiveRules: number;
    maxEmailDeliveriesPerDay: number;
    supportsEmail: boolean;
    supportsWebhooks: boolean;
    supportsCommandIntelligence: boolean;
};

export type MemberAlertRule = {
    id: string;
    ruleName: string;
    triggerKind: AlertTriggerKind;
    objectKind: SavedWorkObjectKind | null;
    objectSlug: string | null;
    severity: AlertSeverity;
    status: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    frequency: SavedSearchFrequency;
    staleAfterHours: number | null;
    perDayLimit: number;
    lastTriggeredAt: string | null;
    updatedAt: string;
};

export type MemberAlertFeedItem = {
    id: string;
    alertKind: string;
    objectKind: SavedWorkObjectKind | null;
    objectTitle: string;
    routePath: string;
    headline: string;
    summary: string | null;
    sourceLabel: string | null;
    severity: AlertSeverity;
    freshnessAt: string | null;
    staleAt: string | null;
    isRead: boolean;
    createdAt: string;
};

export type MemberAlertDeliveryEvent = {
    id: string;
    alertFeedItemId: string | null;
    channel: "in_app" | "email";
    deliveryStatus: string;
    attemptCount: number;
    scheduledAt: string | null;
    sentAt: string | null;
    lastError: string | null;
    createdAt: string;
};

export type MemberAlertsDashboard = {
    tierLimits: AlertTierLimit[];
    rules: MemberAlertRule[];
    feedItems: MemberAlertFeedItem[];
    deliveryEvents: MemberAlertDeliveryEvent[];
    sourceMode: "supabase" | "fallback" | "unavailable";
    loadError: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const fallbackAlertTierLimits: AlertTierLimit[] = [
    {
        tier: "explorer",
        maxActiveRules: 0,
        maxEmailDeliveriesPerDay: 0,
        supportsEmail: false,
        supportsWebhooks: false,
        supportsCommandIntelligence: false,
    },
    {
        tier: "scout",
        maxActiveRules: 25,
        maxEmailDeliveriesPerDay: 100,
        supportsEmail: true,
        supportsWebhooks: false,
        supportsCommandIntelligence: false,
    },
    {
        tier: "command",
        maxActiveRules: 200,
        maxEmailDeliveriesPerDay: 1000,
        supportsEmail: true,
        supportsWebhooks: true,
        supportsCommandIntelligence: true,
    },
];

const fallbackFeedItems: MemberAlertFeedItem[] = [
    {
        id: "fallback-freshness",
        alertKind: "freshness_warning",
        objectKind: "procurement",
        objectTitle: "CLPS instrument RFI",
        routePath: "/procurement/clps-instrument-rfi",
        headline: "Procurement record needs source refresh",
        summary:
            "The source freshness label is stale in the local demo feed. Live alerts come from Supabase once the Task 067 schema is applied.",
        sourceLabel: "Fallback feed",
        severity: "watch",
        freshnessAt: "2026-07-01T08:00:00.000Z",
        staleAt: "2026-07-02T08:00:00.000Z",
        isRead: false,
        createdAt: "2026-07-02T10:12:57.000Z",
    },
    {
        id: "fallback-command",
        alertKind: "command_brief",
        objectKind: "marketplace_record",
        objectTitle: "Lunar data marketplace",
        routePath: "/member/marketplace",
        headline: "Cabeus Council alert hooks are scaffolded",
        summary:
            "Cabeus Council tier supports higher limits, email delivery audit logs, and future webhook delivery events.",
        sourceLabel: "Fallback feed",
        severity: "info",
        freshnessAt: "2026-07-02T10:12:57.000Z",
        staleAt: null,
        isRead: true,
        createdAt: "2026-07-02T10:12:57.000Z",
    },
];

function fallbackDashboard(loadError: string | null = null): MemberAlertsDashboard {
    return {
        tierLimits: fallbackAlertTierLimits,
        rules: [],
        feedItems: fallbackFeedItems,
        deliveryEvents: [],
        sourceMode: loadError ? "unavailable" : "fallback",
        loadError,
    };
}

export async function loadMemberAlertsDashboard({
    supabase,
    userId,
}: {
    supabase: SupabaseServerClient;
    userId: string;
}): Promise<MemberAlertsDashboard> {
    try {
        const [limitsResult, rulesResult, feedResult, deliveryResult] =
            await Promise.all([
                supabase
                    .from("member_alert_tier_limits")
                    .select(
                        "tier,max_active_rules,max_email_deliveries_per_day,supports_email,supports_webhooks,supports_command_intelligence"
                    )
                    .order("max_active_rules", { ascending: true }),
                supabase
                    .from("member_alert_rules")
                    .select(
                        "id,rule_name,trigger_kind,object_kind,object_slug,severity,status,in_app_enabled,email_enabled,frequency,stale_after_hours,per_day_limit,last_triggered_at,updated_at"
                    )
                    .eq("owner_user_id", userId)
                    .neq("status", "archived")
                    .order("updated_at", { ascending: false })
                    .limit(20),
                supabase
                    .from("member_alert_feed_items")
                    .select(
                        "id,alert_kind,object_kind,object_title,route_path,headline,summary,source_label,severity,freshness_at,stale_at,is_read,created_at"
                    )
                    .eq("owner_user_id", userId)
                    .neq("status", "archived")
                    .order("created_at", { ascending: false })
                    .limit(30),
                supabase
                    .from("member_alert_delivery_events")
                    .select(
                        "id,alert_feed_item_id,channel,delivery_status,attempt_count,scheduled_at,sent_at,last_error,created_at"
                    )
                    .eq("owner_user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(20),
            ]);

        const firstError = [
            limitsResult.error,
            rulesResult.error,
            feedResult.error,
            deliveryResult.error,
        ].find(Boolean);

        if (firstError) {
            return fallbackDashboard(firstError.message);
        }

        return {
            tierLimits: ((limitsResult.data ?? []) as Array<{
                tier: AlertTier;
                max_active_rules: number;
                max_email_deliveries_per_day: number;
                supports_email: boolean;
                supports_webhooks: boolean;
                supports_command_intelligence: boolean;
            }>).map((row) => ({
                tier: row.tier,
                maxActiveRules: row.max_active_rules,
                maxEmailDeliveriesPerDay: row.max_email_deliveries_per_day,
                supportsEmail: row.supports_email,
                supportsWebhooks: row.supports_webhooks,
                supportsCommandIntelligence:
                    row.supports_command_intelligence,
            })),
            rules: ((rulesResult.data ?? []) as Array<{
                id: string;
                rule_name: string;
                trigger_kind: AlertTriggerKind;
                object_kind: SavedWorkObjectKind | null;
                object_slug: string | null;
                severity: AlertSeverity;
                status: string;
                in_app_enabled: boolean;
                email_enabled: boolean;
                frequency: SavedSearchFrequency;
                stale_after_hours: number | null;
                per_day_limit: number;
                last_triggered_at: string | null;
                updated_at: string;
            }>).map((row) => ({
                id: row.id,
                ruleName: row.rule_name,
                triggerKind: row.trigger_kind,
                objectKind: row.object_kind,
                objectSlug: row.object_slug,
                severity: row.severity,
                status: row.status,
                inAppEnabled: row.in_app_enabled,
                emailEnabled: row.email_enabled,
                frequency: row.frequency,
                staleAfterHours: row.stale_after_hours,
                perDayLimit: row.per_day_limit,
                lastTriggeredAt: row.last_triggered_at,
                updatedAt: row.updated_at,
            })),
            feedItems: ((feedResult.data ?? []) as Array<{
                id: string;
                alert_kind: string;
                object_kind: SavedWorkObjectKind | null;
                object_title: string;
                route_path: string;
                headline: string;
                summary: string | null;
                source_label: string | null;
                severity: AlertSeverity;
                freshness_at: string | null;
                stale_at: string | null;
                is_read: boolean;
                created_at: string;
            }>).map((row) => ({
                id: row.id,
                alertKind: row.alert_kind,
                objectKind: row.object_kind,
                objectTitle: row.object_title,
                routePath: row.route_path,
                headline: row.headline,
                summary: row.summary,
                sourceLabel: row.source_label,
                severity: row.severity,
                freshnessAt: row.freshness_at,
                staleAt: row.stale_at,
                isRead: row.is_read,
                createdAt: row.created_at,
            })),
            deliveryEvents: ((deliveryResult.data ?? []) as Array<{
                id: string;
                alert_feed_item_id: string | null;
                channel: "in_app" | "email";
                delivery_status: string;
                attempt_count: number;
                scheduled_at: string | null;
                sent_at: string | null;
                last_error: string | null;
                created_at: string;
            }>).map((row) => ({
                id: row.id,
                alertFeedItemId: row.alert_feed_item_id,
                channel: row.channel,
                deliveryStatus: row.delivery_status,
                attemptCount: row.attempt_count,
                scheduledAt: row.scheduled_at,
                sentAt: row.sent_at,
                lastError: row.last_error,
                createdAt: row.created_at,
            })),
            sourceMode: "supabase",
            loadError: null,
        };
    } catch (error) {
        return fallbackDashboard(
            error instanceof Error ? error.message : "Alerts could not load."
        );
    }
}
