import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type EconomyStaffContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
};

export type EconomySubscriberAccessContext = {
    canReadEconomyDashboard: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const economySubscriberRoles = [
    "scout",
    "command_user",
    "editor",
    "analyst",
    "admin",
];

export async function requireEconomyStaff(): Promise<EconomyStaffContext> {
    const supabase = await createClient();
    const profileGate = await getProfileGateContext({
        supabase,
        nextPath: "/admin/economy",
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
        .in("role_id", ["editor", "analyst", "admin"])
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

export async function getEconomySubscriberAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<EconomySubscriberAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canReadEconomyDashboard: false,
            state: profileGate.state,
            userId: profileGate.userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: profileGate.profileHref,
        };
    }
    const userId = profileGate.userId;

    const { data: role, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", economySubscriberRoles)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (roleError) {
        throw new Error(roleError.message);
    }

    if (!role) {
        return {
            canReadEconomyDashboard: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canReadEconomyDashboard: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}
