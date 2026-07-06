"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/auth/admin";

type MembershipApplication = {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string;
    company: string | null;
    title: string | null;
    intended_use: string | null;
};

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

async function loadApplication(id: string) {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
        .from("membership_applications")
        .select("id,user_id,email,full_name,company,title,intended_use")
        .eq("id", id)
        .single();

    if (error || !data) {
        throw new Error(error?.message ?? "Application not found.");
    }

    return data as MembershipApplication;
}

export async function approveApplication(formData: FormData) {
    const applicationId = getRequiredString(formData, "application_id");
    const decisionNote = String(formData.get("decision_note") ?? "").trim();
    const application = await loadApplication(applicationId);
    const { supabase, userId } = await requireAdmin();
    const now = new Date().toISOString();

    const { error: applicationError } = await supabase
        .from("membership_applications")
        .update({
            status: "approved",
            reviewed_at: now,
            reviewed_by: userId,
            decision_note: decisionNote || null,
        })
        .eq("id", application.id);

    if (applicationError) {
        throw new Error(applicationError.message);
    }

    if (application.user_id) {
        const { error: profileError } = await supabase
            .from("member_profiles")
            .upsert(
                {
                    user_id: application.user_id,
                    email: application.email,
                    full_name: application.full_name,
                    company: application.company,
                    title: application.title,
                    status: "approved",
                    base_tier: "member",
                    approved_at: now,
                    approved_by: userId,
                    decision_note: decisionNote || null,
                },
                { onConflict: "user_id" }
            );

        if (profileError) {
            throw new Error(profileError.message);
        }

        const { error: roleError } = await supabase
            .from("member_role_assignments")
            .insert({
                user_id: application.user_id,
                role_id: "member",
                granted_by: userId,
                granted_at: now,
                metadata: {
                    source: "membership_application",
                    application_id: application.id,
                },
            });

        if (roleError && roleError.code !== "23505") {
            throw new Error(roleError.message);
        }
    }

    await supabase.from("access_audit_events").insert({
        actor_user_id: userId,
        target_user_id: application.user_id,
        event_type: "membership_application.approved",
        event_summary: `Approved free Member application for ${application.email}.`,
        metadata: {
            application_id: application.id,
            decision_note: decisionNote || null,
            linked_user: Boolean(application.user_id),
        },
    });

    revalidatePath("/admin/applications");
}

export async function rejectApplication(formData: FormData) {
    const applicationId = getRequiredString(formData, "application_id");
    const decisionNote = getRequiredString(formData, "decision_note");
    const application = await loadApplication(applicationId);
    const { supabase, userId } = await requireAdmin();
    const now = new Date().toISOString();

    const { error: applicationError } = await supabase
        .from("membership_applications")
        .update({
            status: "rejected",
            reviewed_at: now,
            reviewed_by: userId,
            decision_note: decisionNote,
        })
        .eq("id", application.id);

    if (applicationError) {
        throw new Error(applicationError.message);
    }

    if (application.user_id) {
        const { error: profileError } = await supabase
            .from("member_profiles")
            .update({
                status: "rejected",
                rejected_at: now,
                rejected_by: userId,
                decision_note: decisionNote,
            })
            .eq("user_id", application.user_id);

        if (profileError) {
            throw new Error(profileError.message);
        }
    }

    await supabase.from("access_audit_events").insert({
        actor_user_id: userId,
        target_user_id: application.user_id,
        event_type: "membership_application.rejected",
        event_summary: `Rejected free Member application for ${application.email}.`,
        metadata: {
            application_id: application.id,
            decision_note: decisionNote,
            linked_user: Boolean(application.user_id),
        },
    });

    revalidatePath("/admin/applications");
}
