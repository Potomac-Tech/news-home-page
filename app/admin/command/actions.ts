"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth/admin";

type CommandInterestRequest = {
    id: string;
    contact_email: string;
    organization_name: string;
    estimated_seats: number | null;
};

const commandRequestStatuses = [
    "new",
    "contacted",
    "qualified",
    "approved",
    "rejected",
    "archived",
] as const;
const commandPerkTypes = [
    "analyst_support",
    "proposal_support",
    "mission_brief",
    "custom_alert",
    "executive_perk",
    "free_sponsorship",
] as const;
const commandPerkStatuses = [
    "promised",
    "requested",
    "in_progress",
    "fulfilled",
    "blocked",
    "canceled",
] as const;
const commandPerkPriorities = ["low", "normal", "high", "urgent"] as const;

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

function getOptionalTimestamp(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ${key}.`);
    }

    return date.toISOString();
}

function getCommandRequestStatus(formData: FormData) {
    const value = getRequiredString(formData, "status");

    if (
        !commandRequestStatuses.includes(
            value as (typeof commandRequestStatuses)[number]
        )
    ) {
        throw new Error("Invalid Command request status.");
    }

    return value;
}

function getCommandPerkType(formData: FormData) {
    const value = getRequiredString(formData, "perk_type");

    if (!commandPerkTypes.includes(value as (typeof commandPerkTypes)[number])) {
        throw new Error("Invalid Command perk type.");
    }

    return value;
}

function getCommandPerkStatus(formData: FormData) {
    const value = getRequiredString(formData, "status");

    if (
        !commandPerkStatuses.includes(
            value as (typeof commandPerkStatuses)[number]
        )
    ) {
        throw new Error("Invalid Command perk status.");
    }

    return value;
}

function getCommandPerkPriority(formData: FormData) {
    const value = getRequiredString(formData, "priority");

    if (
        !commandPerkPriorities.includes(
            value as (typeof commandPerkPriorities)[number]
        )
    ) {
        throw new Error("Invalid Command perk priority.");
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
    const status = getCommandRequestStatus(formData);
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

export async function createCommandPerk(formData: FormData) {
    const { supabase, userId } = await requireAdmin();
    const organizationId = getRequiredString(formData, "organization_id");
    const status = getCommandPerkStatus(formData);
    const dueAt = getOptionalTimestamp(formData, "due_at");
    const now = new Date().toISOString();

    const { data: entitlement } = await supabase
        .from("entitlements")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("tier", "command")
        .eq("status", "active")
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: perk, error } = await supabase
        .from("command_perk_commitments")
        .insert({
            organization_id: organizationId,
            entitlement_id: entitlement?.id ?? null,
            perk_type: getCommandPerkType(formData),
            status,
            priority: getCommandPerkPriority(formData),
            title: getRequiredString(formData, "title"),
            request_summary: getOptionalString(formData, "request_summary"),
            next_step: getOptionalString(formData, "next_step"),
            internal_note: getOptionalString(formData, "internal_note"),
            due_at: dueAt,
            fulfilled_at: status === "fulfilled" ? now : null,
            blocked_reason:
                status === "blocked"
                    ? getRequiredString(formData, "blocked_reason")
                    : getOptionalString(formData, "blocked_reason"),
            sponsorship_inventory_note: getOptionalString(
                formData,
                "sponsorship_inventory_note"
            ),
            created_by: userId,
            updated_by: userId,
        })
        .select("id")
        .single();

    if (error || !perk) {
        throw new Error(error?.message ?? "Command perk not created.");
    }

    await supabase.from("access_audit_events").insert({
        actor_user_id: userId,
        organization_id: organizationId,
        event_type: "command_perk.created",
        event_summary: "Created a Command perk commitment.",
        metadata: {
            perk_id: perk.id,
            status,
            due_at: dueAt,
        },
    });

    revalidatePath("/admin/command");
}

export async function updateCommandPerk(formData: FormData) {
    const { supabase, userId } = await requireAdmin();
    const perkId = getRequiredString(formData, "perk_id");
    const organizationId = getRequiredString(formData, "organization_id");
    const status = getCommandPerkStatus(formData);
    const dueAt = getOptionalTimestamp(formData, "due_at");
    const now = new Date().toISOString();

    const { error } = await supabase
        .from("command_perk_commitments")
        .update({
            status,
            priority: getCommandPerkPriority(formData),
            title: getRequiredString(formData, "title"),
            request_summary: getOptionalString(formData, "request_summary"),
            fulfillment_summary: getOptionalString(
                formData,
                "fulfillment_summary"
            ),
            next_step: getOptionalString(formData, "next_step"),
            internal_note: getOptionalString(formData, "internal_note"),
            due_at: dueAt,
            fulfilled_at:
                status === "fulfilled"
                    ? getOptionalTimestamp(formData, "fulfilled_at") ?? now
                    : null,
            blocked_reason:
                status === "blocked"
                    ? getRequiredString(formData, "blocked_reason")
                    : getOptionalString(formData, "blocked_reason"),
            sponsorship_inventory_note: getOptionalString(
                formData,
                "sponsorship_inventory_note"
            ),
            updated_by: userId,
        })
        .eq("id", perkId);

    if (error) {
        throw new Error(error.message);
    }

    await supabase.from("access_audit_events").insert({
        actor_user_id: userId,
        organization_id: organizationId,
        event_type: "command_perk.updated",
        event_summary: `Updated Command perk status to ${status}.`,
        metadata: {
            perk_id: perkId,
            status,
            due_at: dueAt,
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
