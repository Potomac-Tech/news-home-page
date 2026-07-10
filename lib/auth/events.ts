import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getProfileGateContext } from "./profile-completion";

export type EventStaffContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
};

export async function requireEventStaff(): Promise<EventStaffContext> {
    const supabase = await createClient();
    const profileGate = await getProfileGateContext({
        supabase,
        nextPath: "/admin/events",
    });
    if (profileGate.state === "signed_out" || profileGate.state === "email_unverified") {
        redirect(profileGate.loginHref);
    }
    if (profileGate.state === "profile_incomplete" && profileGate.profileHref) {
        redirect(profileGate.profileHref);
    }
    const userId = profileGate.userId;

    const { data: role } = await supabase
        .from("member_role_assignments")
        .select("id")
        .eq("user_id", userId)
        .in("role_id", ["editor", "admin"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (!role) {
        redirect("/member");
    }

    return {
        supabase,
        userId,
    };
}
