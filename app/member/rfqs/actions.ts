"use server";

import { revalidatePath } from "next/cache";
import { requireRfqAccess } from "../../../lib/auth/rfq";

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function getOptionalString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    return value || null;
}

function getOptionalDateTime(formData: FormData, key: string) {
    const value = getOptionalString(formData, key);

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ${key}.`);
    }

    return date.toISOString();
}

function assertLength(value: string, maxLength: number, label: string) {
    if (value.length > maxLength) {
        throw new Error(`${label} is too long.`);
    }
}

export async function createRfqPost(formData: FormData) {
    const { supabase, userId } = await requireRfqAccess();
    const title = getRequiredString(formData, "title");
    const summary = getRequiredString(formData, "summary");
    const description = getRequiredString(formData, "description");
    const category = getRequiredString(formData, "category");
    const visibility = getRequiredString(formData, "visibility");
    const organizationId = getOptionalString(formData, "organization_id");
    const dueAt = getOptionalDateTime(formData, "due_at");
    const questionDeadlineAt = getOptionalDateTime(
        formData,
        "question_deadline_at"
    );
    const status = getOptionalString(formData, "publish_now") ? "open" : "draft";
    const rfqId = crypto.randomUUID();
    const now = new Date().toISOString();

    assertLength(title, 180, "RFQ title");
    assertLength(summary, 500, "RFQ summary");
    assertLength(description, 10000, "RFQ description");

    if (!["scout_command", "command_only", "invited_organizations"].includes(visibility)) {
        throw new Error("Invalid RFQ visibility.");
    }

    const { error } = await supabase.from("rfq_posts").insert({
        id: rfqId,
        title,
        summary,
        description,
        category,
        procurement_stage: getOptionalString(formData, "procurement_stage"),
        location: getOptionalString(formData, "location"),
        budget_range: getOptionalString(formData, "budget_range"),
        due_at: dueAt,
        question_deadline_at: questionDeadlineAt,
        visibility,
        status,
        created_by: userId,
        organization_id: organizationId,
        contact_name: getOptionalString(formData, "contact_name"),
        contact_email: getOptionalString(formData, "contact_email"),
        published_at: status === "open" ? now : null,
    });

    if (error) {
        throw new Error(error.message);
    }

    await Promise.all([
        supabase.from("rfq_status_events").insert({
            rfq_id: rfqId,
            actor_user_id: userId,
            to_status: status,
            note: status === "open" ? "RFQ published." : "RFQ draft created.",
        }),
        supabase.from("rfq_audit_events").insert({
            actor_user_id: userId,
            rfq_id: rfqId,
            organization_id: organizationId,
            event_type: "rfq_created",
            event_summary: "Member created an RFQ.",
        }),
    ]);

    revalidatePath("/member/rfqs");
}

export async function updateRfqStatus(formData: FormData) {
    const { supabase, userId } = await requireRfqAccess();
    const rfqId = getRequiredString(formData, "rfq_id");
    const toStatus = getRequiredString(formData, "to_status");
    const allowedStatuses = ["draft", "open", "paused", "awarded", "closed", "cancelled"];

    if (!allowedStatuses.includes(toStatus)) {
        throw new Error("Invalid RFQ status.");
    }

    const { data: existing, error: existingError } = await supabase
        .from("rfq_posts")
        .select("status")
        .eq("id", rfqId)
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    const patch: Record<string, string | null> = { status: toStatus };

    if (toStatus === "open") {
        patch.published_at = new Date().toISOString();
    }

    if (["awarded", "closed", "cancelled"].includes(toStatus)) {
        patch.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from("rfq_posts")
        .update(patch)
        .eq("id", rfqId);

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("rfq_status_events").insert({
        rfq_id: rfqId,
        actor_user_id: userId,
        from_status: existing?.status ?? null,
        to_status: toStatus,
        note: getOptionalString(formData, "note"),
    });

    revalidatePath("/member/rfqs");
}

export async function submitRfqResponse(formData: FormData) {
    const { supabase, userId } = await requireRfqAccess();
    const rfqId = getRequiredString(formData, "rfq_id");
    const responseSummary = getRequiredString(formData, "response_summary");
    const responseBody = getRequiredString(formData, "response_body");
    const organizationId = getOptionalString(formData, "organization_id");
    const responseId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    assertLength(responseSummary, 500, "Response summary");
    assertLength(responseBody, 10000, "Response body");

    const { error } = await supabase.from("rfq_responses").insert({
        id: responseId,
        rfq_id: rfqId,
        responder_user_id: userId,
        organization_id: organizationId,
        status: "submitted",
        response_summary: responseSummary,
        response_body: responseBody,
        estimated_price: getOptionalString(formData, "estimated_price"),
        delivery_timeline: getOptionalString(formData, "delivery_timeline"),
        contact_name: getOptionalString(formData, "contact_name"),
        contact_email: getOptionalString(formData, "contact_email"),
        submitted_at: submittedAt,
    });

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("rfq_audit_events").insert({
        actor_user_id: userId,
        rfq_id: rfqId,
        response_id: responseId,
        organization_id: organizationId,
        event_type: "rfq_response_submitted",
        event_summary: "Member submitted an RFQ response.",
    });

    revalidatePath("/member/rfqs");
}

export async function reportRfq(formData: FormData) {
    const { supabase, userId } = await requireRfqAccess();
    const rfqId = getRequiredString(formData, "rfq_id");
    const responseId = getOptionalString(formData, "response_id");
    const reason = getRequiredString(formData, "reason");
    const reporterNote = getOptionalString(formData, "reporter_note");

    const { error } = await supabase.from("rfq_reports").insert({
        rfq_id: rfqId,
        response_id: responseId,
        reporter_user_id: userId,
        reported_user_id: getOptionalString(formData, "reported_user_id"),
        reason,
        reporter_note: reporterNote,
    });

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("rfq_audit_events").insert({
        actor_user_id: userId,
        rfq_id: rfqId,
        response_id: responseId,
        event_type: "rfq_reported",
        event_summary: "Member reported an RFQ item for moderation.",
    });

    revalidatePath("/member/rfqs");
}
