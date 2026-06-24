"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth/admin";

type CommandInterestRequest = {
    id: string;
    contact_email: string;
    organization_name: string;
    estimated_seats: number | null;
};

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function loadCommandRequest(id: string) {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
        .from("command_interest_requests")
        .select("id,contact_email,organization_name,estimated_seats")
        .eq("id", id)
        .single();

    if (error || !data) {
        throw new Error(error?.message ?? "Command request not found.");
    }

    return data as CommandInterestRequest;
}

export async function updateCommandRequestStatus(formData: FormData) {
    const requestId = getRequiredString(formData, "request_id");
    const status = getRequiredString(formData, "status");
    const decisionNote = String(formData.get("decision_note") ?? "").trim();
    const { supabase, userId } = await requireAdmin();

    const { error } = await supabase
        .from("command_interest_requests")
        .update({
            status,
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
            decision_note: decisionNote || null,
        })
        .eq("id", requestId);

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("access_audit_events").insert({
        actor_user_id: userId,
        event_type: "command_interest.status_updated",
        event_summary: `Updated Command interest request to ${status}.`,
        metadata: {
            request_id: requestId,
            status,
            decision_note: decisionNote || null,
        },
    });

    revalidatePath("/admin/command");
}

export async function grantCommandEntitlement(formData: FormData) {
    const requestId = getRequiredString(formData, "request_id");
    const decisionNote = String(formData.get("decision_note") ?? "").trim();
    const request = await loadCommandRequest(requestId);
    const { supabase, userId } = await requireAdmin();
    const now = new Date().toISOString();

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .insert({
            name: request.organization_name,
            slug: slugify(request.organization_name),
            status: "active",
            primary_billing_email: request.contact_email,
            seat_limit: request.estimated_seats,
        })
        .select("id")
        .single();

    if (organizationError || !organization) {
        throw new Error(organizationError?.message ?? "Organization not created.");
    }

    const { data: entitlement, error: entitlementError } = await supabase
        .from("entitlements")
        .insert({
            organization_id: organization.id,
            tier: "command",
            status: "active",
            source: "manual_sales",
            starts_at: now,
            granted_by: userId,
            external_reference: request.id,
            metadata: {
                command_interest_request_id: request.id,
                decision_note: decisionNote || null,
            },
        })
        .select("id")
        .single();

    if (entitlementError || !entitlement) {
        throw new Error(entitlementError?.message ?? "Entitlement not created.");
    }

    const { error: requestError } = await supabase
        .from("command_interest_requests")
        .update({
            status: "approved",
            reviewed_at: now,
            reviewed_by: userId,
            decision_note: decisionNote || null,
            created_organization_id: organization.id,
            created_entitlement_id: entitlement.id,
        })
        .eq("id", request.id);

    if (requestError) {
        throw new Error(requestError.message);
    }

    await supabase.from("access_audit_events").insert({
        actor_user_id: userId,
        organization_id: organization.id,
        event_type: "command_entitlement.granted",
        event_summary: `Granted Command entitlement to ${request.organization_name}.`,
        metadata: {
            request_id: request.id,
            entitlement_id: entitlement.id,
            decision_note: decisionNote || null,
        },
    });

    revalidatePath("/admin/command");
}
