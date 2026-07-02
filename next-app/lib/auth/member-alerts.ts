import { createClient } from "../supabase/server";

export type MemberAlertsAccessContext = {
    canReadAlerts: boolean;
    canManageAlertRules: boolean;
    state: "signed_out" | "authorized";
    userId: string | null;
    roleId: string | null;
    tier: "explorer" | "scout" | "command" | "staff";
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const alertRoles = [
    "admin",
    "analyst",
    "editor",
    "command_user",
    "scout",
    "member",
];

function tierFromRole(roleId: string | null): MemberAlertsAccessContext["tier"] {
    if (roleId === "admin" || roleId === "analyst" || roleId === "editor") {
        return "staff";
    }

    if (roleId === "command_user") return "command";
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
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canReadAlerts: false,
            canManageAlertRules: false,
            state: "signed_out",
            userId: null,
            roleId: null,
            tier: "explorer",
            loginHref,
        };
    }

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
    const roleId = alertRoles.find((role) => roles.includes(role)) ?? "member";
    const tier = tierFromRole(roleId);

    return {
        canReadAlerts: true,
        canManageAlertRules:
            tier === "scout" || tier === "command" || tier === "staff",
        state: "authorized",
        userId,
        roleId,
        tier,
        loginHref,
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
