import { createClient } from "../../lib/supabase/server";

export type SavedWorkObjectKind =
    | "article"
    | "company"
    | "lunar_mission"
    | "procurement"
    | "regulatory_record"
    | "event"
    | "dataset"
    | "marketplace_record"
    | "methodology_source"
    | "calculator"
    | "rfq"
    | "forum_thread";

export type SavedWorkStatus = "active" | "muted" | "archived";
export type SavedSearchFrequency = "off" | "immediate" | "daily" | "weekly";
export type NotificationChannel = "in_app" | "email";

export type MemberWatchlist = {
    id: string;
    name: string;
    description: string | null;
    colorLabel: string | null;
    isDefault: boolean;
    status: SavedWorkStatus;
    updatedAt: string;
    items: MemberWatchlistItem[];
};

export type MemberWatchlistItem = {
    id: string;
    watchlistId: string;
    objectKind: SavedWorkObjectKind;
    objectTitle: string;
    objectSlug: string | null;
    objectRoutePath: string;
    watchReason: string | null;
    status: SavedWorkStatus;
    notifyInApp: boolean;
    notifyEmail: boolean;
    updatedAt: string;
};

export type MemberSavedSearch = {
    id: string;
    name: string;
    query: string;
    scope: SavedWorkObjectKind | null;
    routePath: string;
    status: SavedWorkStatus;
    alertFrequency: SavedSearchFrequency;
    lastResultCount: number | null;
    lastNewResultCount: number | null;
    updatedAt: string;
};

export type MemberReadingListItem = {
    id: string;
    objectKind: SavedWorkObjectKind;
    title: string;
    objectSlug: string | null;
    routePath: string;
    summary: string | null;
    status: SavedWorkStatus;
    isRead: boolean;
    savedAt: string;
};

export type MemberNotificationPreference = {
    id: string;
    channel: NotificationChannel;
    objectKind: SavedWorkObjectKind | null;
    enabled: boolean;
    frequency: SavedSearchFrequency;
    timezone: string;
};

export type MemberDashboardPreference = {
    id: string;
    dashboardKey: string;
    pinnedModuleKeys: string[];
    hiddenModuleKeys: string[];
    defaultFilters: Record<string, unknown>;
    updatedAt: string;
};

export type SavedWorkDashboard = {
    watchlists: MemberWatchlist[];
    savedSearches: MemberSavedSearch[];
    readingList: MemberReadingListItem[];
    notificationPreferences: MemberNotificationPreference[];
    dashboardPreference: MemberDashboardPreference | null;
    sourceMode: "supabase" | "empty" | "unavailable";
    loadError: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export const savedWorkObjectKinds: Array<{
    value: SavedWorkObjectKind;
    label: string;
}> = [
    { value: "article", label: "Article" },
    { value: "company", label: "Company" },
    { value: "lunar_mission", label: "Lunar mission" },
    { value: "procurement", label: "Procurement" },
    { value: "regulatory_record", label: "Regulatory record" },
    { value: "event", label: "Event" },
    { value: "dataset", label: "Dataset" },
    { value: "marketplace_record", label: "Marketplace record" },
    { value: "methodology_source", label: "Methodology source" },
    { value: "calculator", label: "Calculator" },
    { value: "rfq", label: "RFQ" },
    { value: "forum_thread", label: "Forum thread" },
];

export const savedSearchFrequencies: Array<{
    value: SavedSearchFrequency;
    label: string;
}> = [
    { value: "off", label: "Off" },
    { value: "immediate", label: "Immediate" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
];

export const dashboardModuleOptions = [
    { value: "news", label: "Lunar news" },
    { value: "launches", label: "Launches" },
    { value: "spacecraft", label: "Spacecraft" },
    { value: "companies", label: "Companies" },
    { value: "procurement", label: "Procurement" },
    { value: "regulatory", label: "Regulatory" },
    { value: "datasets", label: "Datasets" },
    { value: "calculators", label: "Calculators" },
    { value: "marketplace", label: "Marketplace" },
    { value: "economy", label: "Economy" },
    { value: "alerts", label: "Alerts" },
];

export function objectKindLabel(value: SavedWorkObjectKind | null) {
    if (!value) return "All intelligence";

    return (
        savedWorkObjectKinds.find((kind) => kind.value === value)?.label ??
        value
    );
}

function emptyDashboard(loadError: string | null = null): SavedWorkDashboard {
    return {
        watchlists: [],
        savedSearches: [],
        readingList: [],
        notificationPreferences: [],
        dashboardPreference: null,
        sourceMode: loadError ? "unavailable" : "empty",
        loadError,
    };
}

function mapWatchlist(row: {
    id: string;
    name: string;
    description: string | null;
    color_label: string | null;
    is_default: boolean;
    status: SavedWorkStatus;
    updated_at: string;
}): MemberWatchlist {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        colorLabel: row.color_label,
        isDefault: row.is_default,
        status: row.status,
        updatedAt: row.updated_at,
        items: [],
    };
}

export async function loadSavedWorkDashboard({
    supabase,
    userId,
}: {
    supabase: SupabaseServerClient;
    userId: string;
}): Promise<SavedWorkDashboard> {
    try {
        const [
            watchlistsResult,
            watchlistItemsResult,
            savedSearchesResult,
            readingListResult,
            notificationPreferencesResult,
            dashboardPreferencesResult,
        ] = await Promise.all([
            supabase
                .from("member_watchlists")
                .select("id,name,description,color_label,is_default,status,updated_at")
                .eq("owner_user_id", userId)
                .neq("status", "archived")
                .order("is_default", { ascending: false })
                .order("updated_at", { ascending: false })
                .limit(12),
            supabase
                .from("member_watchlist_items")
                .select(
                    "id,watchlist_id,object_kind,object_title,object_slug,object_route_path,watch_reason,status,notify_in_app,notify_email,updated_at"
                )
                .eq("owner_user_id", userId)
                .neq("status", "archived")
                .order("updated_at", { ascending: false })
                .limit(40),
            supabase
                .from("member_saved_searches")
                .select(
                    "id,name,query,scope,route_path,status,alert_frequency,last_result_count,last_new_result_count,updated_at"
                )
                .eq("owner_user_id", userId)
                .neq("status", "archived")
                .order("updated_at", { ascending: false })
                .limit(16),
            supabase
                .from("member_reading_list_items")
                .select(
                    "id,object_kind,title,object_slug,route_path,summary,status,is_read,saved_at"
                )
                .eq("owner_user_id", userId)
                .neq("status", "archived")
                .order("saved_at", { ascending: false })
                .limit(20),
            supabase
                .from("member_notification_preferences")
                .select("id,channel,object_kind,enabled,frequency,timezone")
                .eq("owner_user_id", userId)
                .order("channel", { ascending: true })
                .limit(24),
            supabase
                .from("member_dashboard_preferences")
                .select(
                    "id,dashboard_key,pinned_module_keys,hidden_module_keys,default_filters,updated_at"
                )
                .eq("owner_user_id", userId)
                .eq("dashboard_key", "terminal")
                .maybeSingle(),
        ]);

        const firstError = [
            watchlistsResult.error,
            watchlistItemsResult.error,
            savedSearchesResult.error,
            readingListResult.error,
            notificationPreferencesResult.error,
            dashboardPreferencesResult.error,
        ].find(Boolean);

        if (firstError) {
            return emptyDashboard(firstError.message);
        }

        const watchlists = ((watchlistsResult.data ?? []) as Array<{
            id: string;
            name: string;
            description: string | null;
            color_label: string | null;
            is_default: boolean;
            status: SavedWorkStatus;
            updated_at: string;
        }>).map(mapWatchlist);

        const watchlistById = new Map(
            watchlists.map((watchlist) => [watchlist.id, watchlist])
        );

        ((watchlistItemsResult.data ?? []) as Array<{
            id: string;
            watchlist_id: string;
            object_kind: SavedWorkObjectKind;
            object_title: string;
            object_slug: string | null;
            object_route_path: string;
            watch_reason: string | null;
            status: SavedWorkStatus;
            notify_in_app: boolean;
            notify_email: boolean;
            updated_at: string;
        }>).forEach((row) => {
            watchlistById.get(row.watchlist_id)?.items.push({
                id: row.id,
                watchlistId: row.watchlist_id,
                objectKind: row.object_kind,
                objectTitle: row.object_title,
                objectSlug: row.object_slug,
                objectRoutePath: row.object_route_path,
                watchReason: row.watch_reason,
                status: row.status,
                notifyInApp: row.notify_in_app,
                notifyEmail: row.notify_email,
                updatedAt: row.updated_at,
            });
        });

        return {
            watchlists,
            savedSearches: ((savedSearchesResult.data ?? []) as Array<{
                id: string;
                name: string;
                query: string;
                scope: SavedWorkObjectKind | null;
                route_path: string;
                status: SavedWorkStatus;
                alert_frequency: SavedSearchFrequency;
                last_result_count: number | null;
                last_new_result_count: number | null;
                updated_at: string;
            }>).map((row) => ({
                id: row.id,
                name: row.name,
                query: row.query,
                scope: row.scope,
                routePath: row.route_path,
                status: row.status,
                alertFrequency: row.alert_frequency,
                lastResultCount: row.last_result_count,
                lastNewResultCount: row.last_new_result_count,
                updatedAt: row.updated_at,
            })),
            readingList: ((readingListResult.data ?? []) as Array<{
                id: string;
                object_kind: SavedWorkObjectKind;
                title: string;
                object_slug: string | null;
                route_path: string;
                summary: string | null;
                status: SavedWorkStatus;
                is_read: boolean;
                saved_at: string;
            }>).map((row) => ({
                id: row.id,
                objectKind: row.object_kind,
                title: row.title,
                objectSlug: row.object_slug,
                routePath: row.route_path,
                summary: row.summary,
                status: row.status,
                isRead: row.is_read,
                savedAt: row.saved_at,
            })),
            notificationPreferences: (
                (notificationPreferencesResult.data ?? []) as Array<{
                    id: string;
                    channel: NotificationChannel;
                    object_kind: SavedWorkObjectKind | null;
                    enabled: boolean;
                    frequency: SavedSearchFrequency;
                    timezone: string;
                }>
            ).map((row) => ({
                id: row.id,
                channel: row.channel,
                objectKind: row.object_kind,
                enabled: row.enabled,
                frequency: row.frequency,
                timezone: row.timezone,
            })),
            dashboardPreference: dashboardPreferencesResult.data
                ? {
                      id: dashboardPreferencesResult.data.id as string,
                      dashboardKey: dashboardPreferencesResult.data
                          .dashboard_key as string,
                      pinnedModuleKeys:
                          (dashboardPreferencesResult.data
                              .pinned_module_keys as string[] | null) ?? [],
                      hiddenModuleKeys:
                          (dashboardPreferencesResult.data
                              .hidden_module_keys as string[] | null) ?? [],
                      defaultFilters:
                          (dashboardPreferencesResult.data
                              .default_filters as Record<string, unknown> | null) ??
                          {},
                      updatedAt: dashboardPreferencesResult.data
                          .updated_at as string,
                  }
                : null,
            sourceMode: "supabase",
            loadError: null,
        };
    } catch (error) {
        return emptyDashboard(
            error instanceof Error ? error.message : "Saved work could not load."
        );
    }
}
