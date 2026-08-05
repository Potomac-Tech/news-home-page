import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type MemberAlertsAccessContext = {
    canReadAlerts: boolean;
    canManageAlertRules: boolean;
    state: Exclude<ProfileGateState, "ready"> | "authorized";
    userId: string | null;
    roleId: string | null;
    tier: "explorer" | "scout" | "command" | "staff";
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const alertRoles = [
    "admin",
    "analyst",
    "editor",
    "meridian",
    "scout",
    "explorer",
];

function tierFromRole(roleId: string | null): MemberAlertsAccessContext["tier"] {
    if (roleId === "admin" || roleId === "analyst" || roleId === "editor") {
        return "staff";
    }

    if (roleId === "meridian") return "command";
    if (roleId === "scout") return "scout";

    return "explorer";
}

export async function getMemberAlertsAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<MemberAlertsAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canReadAlerts: false,
            canManageAlertRules: false,
            state: profileGate.state,
            userId: profileGate.userId,
            roleId: null,
            tier: "explorer",
            loginHref: profileGate.loginHref,
            profileHref: profileGate.profileHref,
        };
    }
    const userId = profileGate.userId;

    const { data: rolesData, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", alertRoles)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const roles = ((rolesData ?? []) as Array<{ role_id: string }>).map(
        (role) => role.role_id
    );
    const roleId = alertRoles.find((role) => roles.includes(role)) ?? "explorer";
    const tier = tierFromRole(roleId);

    return {
        canReadAlerts: true,
        canManageAlertRules:
            tier === "scout" || tier === "command" || tier === "staff",
        state: "authorized",
        userId,
        roleId,
        tier,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}

export async function requireMemberAlertsAccess(nextPath = "/alerts") {
    const supabase = await createClient();
    const access = await getMemberAlertsAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Member alert access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
        tier: access.tier,
        canManageAlertRules: access.canManageAlertRules,
    };
}
