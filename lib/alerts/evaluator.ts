import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOperationalEmail } from "../email/resend";
import { createServiceClient } from "../supabase/service";
import {
    digestDeferralReason,
    nextDigestAt,
    quietHoursEnd,
    resolveAlertDeliveryMode,
} from "./delivery-policy";

type Frequency = "off" | "immediate" | "daily" | "weekly";
type ObjectKind =
    | "company"
    | "lunar_mission"
    | "procurement"
    | "regulatory_record"
    | "dataset"
    | "event"
    | "marketplace_record";

type AlertRule = {
    id: string;
    owner_user_id: string;
    organization_id: string | null;
    trigger_kind: string;
    object_kind: ObjectKind | null;
    object_id: string | null;
    object_slug: string | null;
    watchlist_id: string | null;
    saved_search_id: string | null;
    severity: "info" | "watch" | "urgent";
    in_app_enabled: boolean;
    email_enabled: boolean;
    frequency: Frequency;
    stale_after_hours: number | null;
    per_day_limit: number;
    last_evaluated_at: string | null;
    created_at: string;
};

type AlertSignal = {
    kind: ObjectKind;
    id: string;
    slug: string | null;
    title: string;
    summary: string | null;
    route: string;
    source: string;
    freshnessAt: string | null;
    updatedAt: string;
};

type SourceAdapter = {
    table: string;
    select: string;
    title: string;
    summary: string;
    route: (slug: string | null) => string;
    source: string;
    configure?: (query: any) => any;
};

type EvaluationCounts = {
    rulesEvaluated: number;
    signalsFound: number;
    feedItemsCreated: number;
    emailsSent: number;
    emailsDeferred: number;
    emailsFailed: number;
    errors: string[];
};

type AlertEmailConfig = {
    digest_cadence_hours: number;
    digest_send_hour_utc: number;
    max_daily_alert_emails: number;
    per_user_daily_email_cap: number;
    instant_daily_reserve: number;
    instant_priority_threshold: "info" | "watch" | "urgent";
    low_budget_buffer: number;
    max_digest_items: number;
};

type AlertEmailRuntime = {
    config: AlertEmailConfig;
    dailyAlertEmailsSent: number;
    dailyQuotaSent: number;
    dailyQuotaReserved: number;
    instantQueued: number;
};

const adapters: Record<ObjectKind, SourceAdapter[]> = {
    company: [{
        table: "lunar_companies",
        select: "id,slug,name,summary,freshness_at,updated_at",
        title: "name",
        summary: "summary",
        route: (slug) => `/companies/${slug}`,
        source: "Lunar company profile",
        configure: (query) => query.eq("publication_status", "published"),
    }],
    lunar_mission: [{
        table: "lunar_missions",
        select: "id,slug,mission_name,summary,freshness_at,updated_at",
        title: "mission_name",
        summary: "summary",
        route: (slug) => `/missions/${slug}`,
        source: "Lunar mission tracker",
        configure: (query) => query.eq("publication_status", "published"),
    }],
    procurement: [{
        table: "lunar_procurements",
        select: "id,slug,title,public_summary,freshness_at,updated_at",
        title: "title",
        summary: "public_summary",
        route: (slug) => `/procurement/${slug}`,
        source: "Lunar procurement tracker",
        configure: (query) => query.eq("publication_status", "published"),
    }],
    regulatory_record: [{
        table: "lunar_regulatory_records",
        select: "id,slug,title,public_summary,freshness_at,updated_at",
        title: "title",
        summary: "public_summary",
        route: (slug) => `/regulatory/${slug}`,
        source: "Lunar regulatory tracker",
        configure: (query) => query.eq("publication_status", "published"),
    }],
    dataset: [{
        table: "dataset_catalog_entries",
        select: "id,slug,title,summary,source_retrieved_at,updated_at",
        title: "title",
        summary: "summary",
        route: () => "/datasets",
        source: "Dataset catalog",
        configure: (query) => query.eq("publication_status", "published"),
    }],
    event: [{
        table: "event_calendar_events",
        select: "id,slug,title,public_summary,published_at,updated_at",
        title: "title",
        summary: "public_summary",
        route: () => "/events",
        source: "Space event calendar",
        configure: (query) => query.eq("status", "published"),
    }],
    marketplace_record: [
        {
            table: "data_market_data_requests",
            select: "id,slug,title,request_summary,published_at,updated_at",
            title: "title",
            summary: "request_summary",
            route: () => "/member/marketplace",
            source: "Data marketplace request",
            configure: (query) => query.eq("review_status", "approved"),
        },
        {
            table: "data_market_data_offers",
            select: "id,slug,title,offer_summary,published_at,updated_at",
            title: "title",
            summary: "offer_summary",
            route: () => "/member/marketplace",
            source: "Data marketplace offer",
            configure: (query) => query.eq("review_status", "approved"),
        },
    ],
};

const frequencyMilliseconds: Record<Frequency, number> = {
    off: Number.POSITIVE_INFINITY,
    immediate: 0,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
};

export function isAlertRuleDue(
    frequency: Frequency,
    lastEvaluatedAt: string | null,
    now = new Date()
) {
    if (frequency === "off") return false;
    if (!lastEvaluatedAt) return true;
    return now.getTime() - new Date(lastEvaluatedAt).getTime() >= frequencyMilliseconds[frequency];
}

function normalizeRuntime(payload: any): AlertEmailRuntime {
    const config = payload?.config ?? {};
    return {
        config: {
            digest_cadence_hours: config.digest_cadence_hours ?? 24,
            digest_send_hour_utc: config.digest_send_hour_utc ?? 13,
            max_daily_alert_emails: config.max_daily_alert_emails ?? 80,
            per_user_daily_email_cap: config.per_user_daily_email_cap ?? 2,
            instant_daily_reserve: config.instant_daily_reserve ?? 5,
            instant_priority_threshold: config.instant_priority_threshold ?? "urgent",
            low_budget_buffer: config.low_budget_buffer ?? 10,
            max_digest_items: config.max_digest_items ?? 20,
        },
        dailyAlertEmailsSent: Number(payload?.daily_alert_emails_sent ?? 0),
        dailyQuotaSent: Number(payload?.daily_quota?.sent_count ?? 0),
        dailyQuotaReserved: Number(payload?.daily_quota?.reserved_count ?? 0),
        instantQueued: Number(payload?.daily_instant_emails_sent ?? 0),
    };
}

async function loadAlertEmailRuntime(supabase: SupabaseClient) {
    const { data, error } = await supabase.rpc("get_member_alert_runtime_config");
    if (error) throw new Error(`alert email config: ${error.message}`);
    return normalizeRuntime(data);
}

function toSignal(adapter: SourceAdapter, row: Record<string, unknown>): AlertSignal {
    const freshness = row.freshness_at ?? row.source_retrieved_at ?? row.published_at;
    const slug = typeof row.slug === "string" ? row.slug : null;
    return {
        kind: "company",
        id: String(row.id),
        slug,
        title: String(row[adapter.title] ?? "Lunar intelligence update"),
        summary: typeof row[adapter.summary] === "string" ? row[adapter.summary] as string : null,
        route: adapter.route(slug),
        source: adapter.source,
        freshnessAt: typeof freshness === "string" ? freshness : null,
        updatedAt: String(row.updated_at),
    };
}

async function loadSignals(
    supabase: SupabaseClient,
    rule: AlertRule,
    kind: ObjectKind,
    objectId: string | null,
    objectSlug: string | null,
    searchQuery: string | null,
    now: Date
) {
    const signals: AlertSignal[] = [];
    const since = rule.last_evaluated_at ?? rule.created_at;
    for (const adapter of adapters[kind]) {
        let query: any = supabase.from(adapter.table).select(adapter.select).limit(50);
        query = adapter.configure ? adapter.configure(query) : query;
        if (objectId) query = query.eq("id", objectId);
        else if (objectSlug) query = query.eq("slug", objectSlug);
        if (rule.trigger_kind === "freshness_stale") {
            const staleAt = new Date(now.getTime() - (rule.stale_after_hours ?? 24) * 3600000).toISOString();
            const freshnessColumn = kind === "dataset"
                ? "source_retrieved_at"
                : kind === "event" || kind === "marketplace_record"
                    ? "published_at"
                    : "freshness_at";
            query = query.lte(freshnessColumn, staleAt);
        } else {
            query = query.gt("updated_at", since);
        }
        const { data, error } = await query.order("updated_at", { ascending: false });
        if (error) throw new Error(`${adapter.table}: ${error.message}`);
        for (const row of (data ?? []) as Record<string, unknown>[]) {
            const signal = toSignal(adapter, row);
            signal.kind = kind;
            if (searchQuery) {
                const haystack = `${signal.title} ${signal.summary ?? ""}`.toLowerCase();
                if (!haystack.includes(searchQuery.toLowerCase())) continue;
            }
            signals.push(signal);
        }
    }
    return signals;
}

async function loadCommandSignals(supabase: SupabaseClient, rule: AlertRule) {
    let query: any = supabase
        .from("command_intelligence_allocations")
        .select("id,dataset_id,status,access_mode,exclusive_access_starts_at,updated_at")
        .gt("updated_at", rule.last_evaluated_at ?? rule.created_at)
        .in("status", ["planned", "active"])
        .limit(50);
    query = rule.organization_id
        ? query.or(`allocated_user_id.eq.${rule.owner_user_id},organization_id.eq.${rule.organization_id}`)
        : query.eq("allocated_user_id", rule.owner_user_id);
    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw new Error(`command_intelligence_allocations: ${error.message}`);
    return (data ?? []).map((row: Record<string, unknown>): AlertSignal => ({
        kind: "dataset",
        id: String(row.dataset_id),
        slug: null,
        title: "Command intelligence allocation updated",
        summary: `${String(row.access_mode).replaceAll("_", " ")} access is ${String(row.status)}.`,
        route: "/datasets",
        source: "Command intelligence",
        freshnessAt: String(row.updated_at),
        updatedAt: String(row.updated_at),
    }));
}

async function notificationPreference(
    supabase: SupabaseClient,
    ownerUserId: string,
    organizationId: string | null,
    channel: "in_app" | "email",
    kind: ObjectKind
) {
    const { data } = await supabase
        .from("member_notification_preferences")
        .select("enabled,frequency,quiet_hours_start,quiet_hours_end,timezone,object_kind")
        .eq("owner_user_id", ownerUserId)
        .eq("channel", channel)
        .or(`organization_id.is.null${organizationId ? `,organization_id.eq.${organizationId}` : ""}`)
        .or(`object_kind.is.null,object_kind.eq.${kind}`);
    const rows = data ?? [];
    const specific = rows.find((row: any) => row.object_kind === kind);
    return specific ?? rows.find((row: any) => row.object_kind === null) ?? {
        enabled: true,
        frequency: "immediate",
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: "America/New_York",
    };
}

async function createDeliveries(
    supabase: SupabaseClient,
    rule: AlertRule,
    signal: AlertSignal,
    counts: EvaluationCounts,
    now: Date,
    runtime: AlertEmailRuntime
) {
    const dedupeKey = [rule.id, signal.source, signal.id, signal.updatedAt, rule.trigger_kind].join(":");
    const staleAt = rule.trigger_kind === "freshness_stale" && signal.freshnessAt
        ? new Date(new Date(signal.freshnessAt).getTime() + (rule.stale_after_hours ?? 24) * 3600000).toISOString()
        : null;
    const alertKind = rule.trigger_kind === "saved_search_match"
        ? "saved_search_result"
        : rule.trigger_kind === "freshness_stale"
            ? "freshness_warning"
            : rule.trigger_kind === "platform_event"
                ? "platform_notice"
                : rule.trigger_kind === "command_intelligence"
                    ? "command_brief"
                    : "watchlist_update";
    const inApp = await notificationPreference(
        supabase, rule.owner_user_id, rule.organization_id, "in_app", signal.kind
    );
    const email = await notificationPreference(
        supabase, rule.owner_user_id, rule.organization_id, "email", signal.kind
    );
    if ((!rule.in_app_enabled || !inApp.enabled) && (!rule.email_enabled || !email.enabled)) return;

    const { data: inserted, error: insertError } = await supabase
        .from("member_alert_feed_items")
        .upsert({
            owner_user_id: rule.owner_user_id,
            organization_id: rule.organization_id,
            alert_rule_id: rule.id,
            alert_kind: alertKind,
            object_kind: signal.kind,
            object_id: signal.id,
            object_slug: signal.slug,
            object_title: signal.title,
            route_path: signal.route,
            headline: rule.trigger_kind === "freshness_stale"
                ? `${signal.title} needs a freshness review`
                : `${signal.title} has new intelligence`,
            summary: signal.summary,
            source_label: signal.source,
            severity: rule.severity,
            freshness_at: signal.freshnessAt,
            stale_at: staleAt,
            dedupe_key: dedupeKey,
            metadata: { evaluator: "production-v1", source_updated_at: signal.updatedAt },
        }, { onConflict: "owner_user_id,dedupe_key", ignoreDuplicates: true })
        .select("id")
        .maybeSingle();
    if (insertError) throw new Error(`feed insert: ${insertError.message}`);
    if (!inserted?.id) return;
    counts.feedItemsCreated += 1;

    if (rule.in_app_enabled && inApp.enabled) {
        await supabase.from("member_alert_delivery_events").upsert({
            alert_feed_item_id: inserted.id,
            alert_rule_id: rule.id,
            owner_user_id: rule.owner_user_id,
            organization_id: rule.organization_id,
            channel: "in_app",
            delivery_status: "sent",
            sent_at: now.toISOString(),
        }, { onConflict: "alert_feed_item_id,channel", ignoreDuplicates: true });
    }

    if (!rule.email_enabled || !email.enabled || email.frequency === "off") return;
    const { data: profile } = await supabase
        .from("member_profiles")
        .select("email")
        .eq("user_id", rule.owner_user_id)
        .maybeSingle();
    if (!profile?.email) return;
    const globalBudgetRemaining = Math.min(
        runtime.config.max_daily_alert_emails - runtime.dailyAlertEmailsSent,
        runtime.config.max_daily_alert_emails - runtime.dailyQuotaSent - runtime.dailyQuotaReserved
    );
    const deliveryMode = resolveAlertDeliveryMode({
        severity: rule.severity,
        threshold: runtime.config.instant_priority_threshold,
        instantUsed: runtime.instantQueued,
        instantReserve: runtime.config.instant_daily_reserve,
        budgetRemaining: globalBudgetRemaining,
        lowBudgetBuffer: runtime.config.low_budget_buffer,
    });
    const immediateEligible = deliveryMode === "immediate";
    if (immediateEligible) runtime.instantQueued += 1;
    const cadence = email.frequency === "weekly"
        ? Math.max(168, runtime.config.digest_cadence_hours)
        : Math.max(24, runtime.config.digest_cadence_hours);
    const baseSchedule = immediateEligible
        ? now
        : nextDigestAt(now, cadence, runtime.config.digest_send_hour_utc);
    const quietUntil = quietHoursEnd(
        baseSchedule,
        email.quiet_hours_start,
        email.quiet_hours_end,
        email.timezone
    );
    const scheduledAt = quietUntil ?? baseSchedule;
    const { count } = await supabase
        .from("member_alert_delivery_events")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", rule.owner_user_id)
        .eq("channel", "email")
        .gte("created_at", new Date(now.getTime() - 86400000).toISOString());
    if ((count ?? 0) >= rule.per_day_limit) {
        await supabase.from("member_alert_delivery_events").upsert({
            alert_feed_item_id: inserted.id,
            alert_rule_id: rule.id,
            owner_user_id: rule.owner_user_id,
            organization_id: rule.organization_id,
            channel: "email",
            delivery_status: "suppressed",
            delivery_target: profile.email,
            last_error: "Rule daily delivery limit reached.",
        }, { onConflict: "alert_feed_item_id,channel", ignoreDuplicates: true });
        return;
    }
    await supabase.from("member_alert_delivery_events").upsert({
        alert_feed_item_id: inserted.id,
        alert_rule_id: rule.id,
        owner_user_id: rule.owner_user_id,
        organization_id: rule.organization_id,
        channel: "email",
        delivery_status: "queued",
        delivery_target: profile.email,
        scheduled_at: scheduledAt.toISOString(),
        next_retry_at: null,
        digest_key: deliveryMode === "digest"
            ? `${rule.owner_user_id}:${scheduledAt.toISOString()}`
            : null,
        metadata: {
            delivery_mode: deliveryMode,
            preference_frequency: email.frequency,
            quiet_hours_deferred: Boolean(quietUntil),
        },
    }, { onConflict: "alert_feed_item_id,channel", ignoreDuplicates: true });
    if (deliveryMode === "digest" || quietUntil) counts.emailsDeferred += 1;
}

type QueuedDelivery = {
    id: string;
    owner_user_id: string;
    delivery_target: string | null;
    attempt_count: number;
    digest_key: string | null;
    metadata: Record<string, unknown>;
    member_alert_feed_items: any;
};

function feedFor(delivery: QueuedDelivery) {
    return Array.isArray(delivery.member_alert_feed_items)
        ? delivery.member_alert_feed_items[0]
        : delivery.member_alert_feed_items;
}

function nextUtcDay(now: Date) {
    const next = new Date(now);
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 5, 0, 0);
    return next;
}

async function claimAndSend(
    supabase: SupabaseClient,
    delivery: QueuedDelivery,
    subject: string,
    text: string,
    counts: EvaluationCounts
) {
    const { data: claim, error: claimError } = await supabase
        .rpc("claim_member_alert_email_delivery", { p_delivery_id: delivery.id });
    if (claimError) {
        counts.errors.push(`claim ${delivery.id}: ${claimError.message}`);
        return null;
    }
    const result = claim?.[0];
    if (!result?.allowed) {
        if (result?.retry_at) counts.emailsDeferred += 1;
        return null;
    }
    const email = await sendOperationalEmail({
        formType: "member_alert",
        to: delivery.delivery_target ?? undefined,
        subject,
        text,
    });
    const { error: completionError } = await supabase.rpc(
        "complete_member_alert_email_delivery",
        {
            p_delivery_id: delivery.id,
            p_delivery_status: email.deliveryStatus,
            p_provider_message_id: email.providerMessageId,
            p_failure_reason: email.failureReason,
            p_provider_headers: email.providerHeaders,
            p_next_retry_at: email.retryAt,
        }
    );
    if (completionError) counts.errors.push(`complete ${delivery.id}: ${completionError.message}`);
    if (email.deliveryStatus === "sent") counts.emailsSent += 1;
    else if (email.deliveryStatus === "held" || email.deliveryStatus === "configuration_missing") counts.emailsDeferred += 1;
    else counts.emailsFailed += 1;
    return email;
}

async function deliverQueuedEmails(
    supabase: SupabaseClient,
    counts: EvaluationCounts,
    now: Date,
    runtime: AlertEmailRuntime
) {
    const { data, error } = await supabase
        .from("member_alert_delivery_events")
        .select("id,owner_user_id,delivery_target,attempt_count,digest_key,metadata,member_alert_feed_items(headline,summary,route_path)")
        .eq("channel", "email")
        .in("delivery_status", ["queued", "failed"])
        .or(`scheduled_at.is.null,scheduled_at.lte.${now.toISOString()}`)
        .or(`next_retry_at.is.null,next_retry_at.lte.${now.toISOString()}`)
        .lt("attempt_count", 5)
        .order("created_at")
        .limit(25);
    if (error) throw new Error(`email queue: ${error.message}`);
    const queued = (data ?? []) as QueuedDelivery[];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
        ?? "https://cabeus-explorer.jake-249.workers.dev";
    const preferenceUrl = `${baseUrl}/member/saved-work#notification-preferences`;
    const immediate = queued.filter((item) => item.metadata?.delivery_mode === "immediate");
    for (const delivery of immediate) {
        if (
            runtime.dailyAlertEmailsSent >= runtime.config.max_daily_alert_emails
            || runtime.dailyQuotaSent + runtime.dailyQuotaReserved >= runtime.config.max_daily_alert_emails
        ) {
            await supabase.from("member_alert_delivery_events").update({
                scheduled_at: nextUtcDay(now).toISOString(),
                metadata: { ...delivery.metadata, delivery_mode: "digest", budget_deferred: true },
            }).eq("id", delivery.id);
            counts.emailsDeferred += 1;
            continue;
        }
        const feed = feedFor(delivery);
        const sent = await claimAndSend(
            supabase,
            delivery,
            feed?.headline ?? "Cabeus Explorer urgent intelligence alert",
            [
                feed?.headline ?? "Urgent lunar intelligence is available.",
                feed?.summary ?? "",
                `${baseUrl}${feed?.route_path ?? "/alerts"}`,
                `Manage notification preferences: ${preferenceUrl}`,
            ].filter(Boolean).join("\n\n"),
            counts
        );
        if (sent?.deliveryStatus === "sent") runtime.dailyAlertEmailsSent += 1;
    }

    const digestGroups = new Map<string, QueuedDelivery[]>();
    for (const delivery of queued.filter((item) => item.metadata?.delivery_mode !== "immediate")) {
        const key = delivery.digest_key ?? `${delivery.owner_user_id}:unscheduled`;
        digestGroups.set(key, [...(digestGroups.get(key) ?? []), delivery]);
    }
    const { data: sentRows } = await supabase
        .from("member_alert_delivery_events")
        .select("owner_user_id,provider_message_id")
        .eq("channel", "email")
        .eq("delivery_status", "sent")
        .gte("sent_at", new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString());
    const userMessages = new Map<string, Set<string>>();
    for (const row of sentRows ?? []) {
        if (!row.provider_message_id) continue;
        const set = userMessages.get(row.owner_user_id) ?? new Set<string>();
        set.add(row.provider_message_id);
        userMessages.set(row.owner_user_id, set);
    }
    for (const group of digestGroups.values()) {
        const selected = group.slice(0, runtime.config.max_digest_items);
        const representative = selected[0];
        const perUserSent = userMessages.get(representative.owner_user_id)?.size ?? 0;
        const deferralReason = digestDeferralReason({
            dailyAlertEmailsSent: runtime.dailyAlertEmailsSent,
            dailyQuotaSent: runtime.dailyQuotaSent,
            dailyQuotaReserved: runtime.dailyQuotaReserved,
            maxDailyAlertEmails: runtime.config.max_daily_alert_emails,
            lowBudgetBuffer: runtime.config.low_budget_buffer,
            userMessagesSent: perUserSent,
            perUserDailyCap: runtime.config.per_user_daily_email_cap,
        });
        if (deferralReason) {
            await supabase.from("member_alert_delivery_events").update({
                scheduled_at: nextUtcDay(now).toISOString(),
                next_retry_at: nextUtcDay(now).toISOString(),
                last_error: deferralReason === "budget" ? "Queued for next digest window: alert email budget is low." : "Queued for next digest window: member daily cap reached.",
            }).in("id", selected.map((item) => item.id));
            counts.emailsDeferred += selected.length;
            continue;
        }
        const sections = selected.map((delivery, index) => {
            const feed = feedFor(delivery);
            return [
                `${index + 1}. ${feed?.headline ?? "Lunar intelligence update"}`,
                feed?.summary ?? "",
                `${baseUrl}${feed?.route_path ?? "/alerts"}`,
            ].filter(Boolean).join("\n");
        });
        const email = await claimAndSend(
            supabase,
            representative,
            `Cabeus Explorer lunar intelligence digest (${selected.length})`,
            [
                `Your lunar intelligence digest contains ${selected.length} update${selected.length === 1 ? "" : "s"}.`,
                ...sections,
                `Manage notification preferences: ${preferenceUrl}`,
            ].join("\n\n"),
            counts
        );
        if (email?.deliveryStatus === "sent") {
            runtime.dailyAlertEmailsSent += 1;
            const set = userMessages.get(representative.owner_user_id) ?? new Set<string>();
            if (email.providerMessageId) set.add(email.providerMessageId);
            userMessages.set(representative.owner_user_id, set);
            const siblings = selected.filter((item) => item.id !== representative.id);
            if (siblings.length) {
                await supabase.from("member_alert_delivery_events").update({
                    delivery_status: "sent",
                    provider_message_id: email.providerMessageId,
                    sent_at: new Date().toISOString(),
                    last_error: null,
                    next_retry_at: null,
                }).in("id", siblings.map((item) => item.id));
            }
        }
    }
}

export async function runMemberAlertEvaluator() {
    const supabase = createServiceClient();
    const now = new Date();
    const runKey = `alerts:${now.toISOString().slice(0, 16)}`;
    const counts: EvaluationCounts = {
        rulesEvaluated: 0,
        signalsFound: 0,
        feedItemsCreated: 0,
        emailsSent: 0,
        emailsDeferred: 0,
        emailsFailed: 0,
        errors: [],
    };
    const runtime = await loadAlertEmailRuntime(supabase);
    const { data: run, error: runError } = await supabase
        .from("member_alert_evaluation_runs")
        .upsert({ run_key: runKey }, { onConflict: "run_key", ignoreDuplicates: true })
        .select("id,status")
        .maybeSingle();
    if (runError) throw new Error(runError.message);
    if (!run) return { skipped: true, reason: "run_already_claimed", ...counts };

    try {
        const { data: rules, error } = await supabase
            .from("member_alert_rules")
            .select("*")
            .eq("status", "active")
            .order("last_evaluated_at", { ascending: true, nullsFirst: true })
            .limit(250);
        if (error) throw new Error(error.message);
        for (const rule of (rules ?? []) as AlertRule[]) {
            if (!isAlertRuleDue(rule.frequency, rule.last_evaluated_at, now)) continue;
            counts.rulesEvaluated += 1;
            try {
                let signals: AlertSignal[] = [];
                if (rule.trigger_kind === "command_intelligence") {
                    signals = await loadCommandSignals(supabase, rule);
                } else {
                    let searchQuery: string | null = null;
                    if (rule.saved_search_id) {
                        const { data: savedSearch } = await supabase
                            .from("member_saved_searches")
                            .select("query")
                            .eq("id", rule.saved_search_id)
                            .maybeSingle();
                        searchQuery = savedSearch?.query?.trim() || null;
                    }
                    const targets: Array<{ kind: ObjectKind; id: string | null; slug: string | null }> = [];
                    if (rule.object_kind) targets.push({ kind: rule.object_kind, id: rule.object_id, slug: rule.object_slug });
                    if (rule.watchlist_id) {
                        const { data: items } = await supabase
                            .from("member_watchlist_items")
                            .select("object_kind,object_id,object_slug")
                            .eq("watchlist_id", rule.watchlist_id)
                            .eq("status", "active");
                        for (const item of items ?? []) {
                            if (item.object_kind in adapters) targets.push({
                                kind: item.object_kind as ObjectKind,
                                id: item.object_id,
                                slug: item.object_slug,
                            });
                        }
                    }
                    if (rule.trigger_kind === "platform_event" && !targets.length) {
                        targets.push({ kind: "event", id: null, slug: null });
                    }
                    for (const target of targets) {
                        signals.push(...await loadSignals(
                            supabase, rule, target.kind, target.id, target.slug, searchQuery, now
                        ));
                    }
                }
                const uniqueSignals = [...new Map(signals.map((signal) => [`${signal.source}:${signal.id}`, signal])).values()];
                counts.signalsFound += uniqueSignals.length;
                for (const signal of uniqueSignals.slice(0, rule.per_day_limit)) {
                    await createDeliveries(supabase, rule, signal, counts, now, runtime);
                }
                await supabase.from("member_alert_rules").update({
                    last_evaluated_at: now.toISOString(),
                    last_triggered_at: uniqueSignals.length ? now.toISOString() : rule.last_evaluated_at,
                }).eq("id", rule.id);
            } catch (ruleError) {
                counts.errors.push(`${rule.id}: ${ruleError instanceof Error ? ruleError.message : String(ruleError)}`);
            }
        }
        await deliverQueuedEmails(supabase, counts, now, runtime);
        await supabase.from("member_alert_evaluation_runs").update({
            status: counts.errors.length ? "completed_with_errors" : "completed",
            rules_evaluated: counts.rulesEvaluated,
            signals_found: counts.signalsFound,
            feed_items_created: counts.feedItemsCreated,
            emails_sent: counts.emailsSent,
            emails_deferred: counts.emailsDeferred,
            emails_failed: counts.emailsFailed,
            error_summary: counts.errors.length ? counts.errors.slice(0, 20).join("\n") : null,
            completed_at: new Date().toISOString(),
        }).eq("id", run.id);
        return { skipped: false, ...counts };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await supabase.from("member_alert_evaluation_runs").update({
            status: "failed",
            error_summary: message,
            completed_at: new Date().toISOString(),
        }).eq("id", run.id);
        throw error;
    }
}
