import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getProfileGateContext } from "./profile-completion";

type AdminContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
};

export async function requireAdmin(): Promise<AdminContext> {
    const supabase = await createClient();
    const profileGate = await getProfileGateContext({
        supabase,
        nextPath: "/admin/applications",
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
        .eq("role_id", "admin")
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
