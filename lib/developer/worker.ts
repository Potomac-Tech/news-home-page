import "server-only";

import { createHmac } from "node:crypto";
import { createServiceClient } from "../supabase/service";
import { flattenSourceRows, loadDeveloperSource, type DeveloperSource } from "./data-sources";
import { toCsv, toPdf } from "./formats";

type ExportJob = {
    id: string;
    owner_user_id: string;
    organization_id: string | null;
    export_name: string;
    source_kind: DeveloperSource;
    export_format: "csv" | "pdf" | "json";
};

type WebhookDelivery = {
    delivery_id: string;
    subscription_id: string;
    endpoint_url: string;
    signing_secret: string;
    event_kind: string;
    payload: Record<string, unknown>;
    attempt_count: number;
};

function exportFile(job: ExportJob, rows: Record<string, unknown>[]) {
    if (job.export_format === "csv") return { body: toCsv(rows), contentType: "text/csv" };
    if (job.export_format === "pdf") return { body: toPdf(job.export_name, rows), contentType: "application/pdf" };
    return { body: JSON.stringify(rows, null, 2), contentType: "application/json" };
}

async function queueExportWebhooks(job: ExportJob) {
    const supabase = createServiceClient();
    let query = supabase.from("developer_webhook_subscriptions")
        .select("id,owner_user_id,organization_id")
        .eq("owner_user_id", job.owner_user_id).eq("status", "active")
        .contains("event_kinds", ["export.completed"]);
    if (job.organization_id) query = query.eq("organization_id", job.organization_id);
    const { data } = await query;
    if (!data?.length) return;
    await supabase.from("developer_webhook_delivery_events").upsert(data.map((subscription) => ({
        subscription_id: subscription.id,
        owner_user_id: subscription.owner_user_id,
        organization_id: subscription.organization_id,
        event_kind: "export.completed",
        idempotency_key: `export.completed:${job.id}:${subscription.id}`,
        metadata: { payload: { id: job.id, type: "export.completed", occurred_at: new Date().toISOString(), data: { export_id: job.id, name: job.export_name, source: job.source_kind, format: job.export_format } } },
    })), { onConflict: "idempotency_key", ignoreDuplicates: true });
}

async function processExports() {
    const supabase = createServiceClient();
    const { data } = await supabase.from("developer_export_jobs").select("id,owner_user_id,organization_id,export_name,source_kind,export_format")
        .eq("status", "queued").order("requested_at").limit(5);
    let completed = 0;
    let failed = 0;
    for (const rawJob of data ?? []) {
        const job = rawJob as ExportJob;
        const { data: claimed } = await supabase.from("developer_export_jobs").update({ status: "processing", updated_at: new Date().toISOString() })
            .eq("id", job.id).eq("status", "queued").select("id").maybeSingle();
        if (!claimed) continue;
        try {
            const result = await loadDeveloperSource(supabase, job.source_kind, {
                usageId: "worker", ownerUserId: job.owner_user_id, organizationId: job.organization_id,
                tier: job.source_kind === "command_briefs" ? "command" : "scout", quotaLimit: 0, quotaUsed: 0, quotaRemaining: 0,
            }, 100, 0);
            if (result.error) throw new Error(result.error.message);
            const rows = flattenSourceRows(result.data);
            const file = exportFile(job, rows);
            const path = `${job.owner_user_id}/${job.id}.${job.export_format}`;
            const { error: uploadError } = await supabase.storage.from("developer-exports").upload(path, file.body, { contentType: file.contentType, upsert: true });
            if (uploadError) throw new Error(uploadError.message);
            const bytes = typeof file.body === "string" ? new TextEncoder().encode(file.body).byteLength : file.body.byteLength;
            const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
            await supabase.from("developer_export_jobs").update({ status: "ready", storage_bucket: "developer-exports", storage_path: path, row_count: rows.length, file_size_bytes: bytes, completed_at: new Date().toISOString(), expires_at: expiresAt, failure_reason: null }).eq("id", job.id);
            await queueExportWebhooks(job);
            completed += 1;
        } catch (error) {
            await supabase.from("developer_export_jobs").update({ status: "failed", completed_at: new Date().toISOString(), failure_reason: error instanceof Error ? error.message.slice(0, 1000) : "Unknown export error" }).eq("id", job.id);
            failed += 1;
        }
    }
    return { completed, failed };
}

async function processWebhooks() {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("claim_developer_webhook_deliveries", { p_limit: 20 });
    if (error) throw new Error(error.message);
    let delivered = 0;
    let retried = 0;
    for (const rawDelivery of data ?? []) {
        const delivery = rawDelivery as WebhookDelivery;
        const body = JSON.stringify(delivery.payload);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = createHmac("sha256", delivery.signing_secret).update(`${timestamp}.${body}`).digest("hex");
        const startedAt = Date.now();
        let status = 0;
        let message: string | null = null;
        try {
            const response = await fetch(delivery.endpoint_url, { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Cabeus-Explorer-Webhooks/1.0", "X-Cabeus-Event": delivery.event_kind, "X-Cabeus-Delivery": delivery.delivery_id, "X-Cabeus-Timestamp": timestamp, "X-Cabeus-Signature": `v1=${signature}` }, body, signal: AbortSignal.timeout(10000) });
            status = response.status;
            if (!response.ok) message = `Endpoint returned HTTP ${response.status}.`;
        } catch (caught) {
            message = caught instanceof Error ? caught.message : "Webhook request failed.";
        }
        const success = status >= 200 && status < 300;
        await supabase.rpc("finish_developer_webhook_delivery", { p_delivery_id: delivery.delivery_id, p_success: success, p_status_code: status || null, p_response_ms: Date.now() - startedAt, p_error: message });
        if (success) delivered += 1; else retried += 1;
    }
    return { delivered, retried };
}

export async function runDeveloperWorker() {
    const [exports, webhooks] = await Promise.all([processExports(), processWebhooks()]);
    return { exports, webhooks, completed_at: new Date().toISOString() };
}
