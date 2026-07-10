import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type DeveloperPlatformAccessContext = {
    canUseDeveloperPlatform: boolean;
    canUseWebhooks: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    tier: "scout" | "command" | "staff";
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const developerRoles = ["admin", "analyst", "editor", "command_user", "scout"];

function tierFromRole(roleId: string | null): DeveloperPlatformAccessContext["tier"] {
    if (roleId === "admin" || roleId === "analyst" || roleId === "editor") {
        return "staff";
    }

    if (roleId === "command_user") {
        return "command";
    }

    return "scout";
}

export async function getDeveloperPlatformAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<DeveloperPlatformAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canUseDeveloperPlatform: false,
            canUseWebhooks: false,
            state: profileGate.state,
            userId: profileGate.userId,
            roleId: null,
            tier: "scout",
            loginHref: profileGate.loginHref,
            profileHref: profileGate.profileHref,
        };
    }
    const userId = profileGate.userId;

    const { data: rolesData, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", developerRoles)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const roles = ((rolesData ?? []) as Array<{ role_id: string }>).map(
        (role) => role.role_id
    );
    const roleId = developerRoles.find((role) => roles.includes(role)) ?? null;

    if (!roleId) {
        return {
            canUseDeveloperPlatform: false,
            canUseWebhooks: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            tier: "scout",
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    const tier = tierFromRole(roleId);

    return {
        canUseDeveloperPlatform: true,
        canUseWebhooks: tier === "command" || tier === "staff",
        state: "authorized",
        userId,
        roleId,
        tier,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}
