import { createClient } from "../supabase/server";
import { getProfileGateContext } from "./profile-completion";

export type LunarMarketIntelAccess = {
    state:
        | "anonymous"
        | "email_unverified"
        | "profile_incomplete"
        | "explorer"
        | "scout"
        | "command"
        | "staff";
    canReadMemberDetails: boolean;
    canReadScoutDetails: boolean;
    canReadCommandDetails: boolean;
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const rolePriority = [
    "admin",
    "analyst",
    "editor",
    "command_user",
    "scout",
    "member",
];

export async function getLunarMarketIntelAccess({
    supabase,
    nextPath = "/member/procurement",
}: {
    supabase: SupabaseServerClient;
    nextPath?: string;
}): Promise<LunarMarketIntelAccess> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state === "signed_out") {
        return {
            state: "anonymous",
            canReadMemberDetails: false,
            canReadScoutDetails: false,
            canReadCommandDetails: false,
            userId: null,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }
    if (profileGate.state !== "ready") {
        return {
            state: profileGate.state,
            canReadMemberDetails: false,
            canReadScoutDetails: false,
            canReadCommandDetails: false,
            userId: profileGate.userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: profileGate.profileHref,
        };
    }
    const userId = profileGate.userId;

    const { data: roles, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", rolePriority)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const roleIds = ((roles ?? []) as Array<{ role_id: string }>).map(
        (role) => role.role_id
    );
    const roleId = rolePriority.find((role) => roleIds.includes(role)) ?? null;

    if (["admin", "analyst", "editor"].includes(roleId ?? "")) {
        return {
            state: "staff",
            canReadMemberDetails: true,
            canReadScoutDetails: true,
            canReadCommandDetails: true,
            userId,
            roleId,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    if (roleId === "command_user") {
        return {
            state: "command",
            canReadMemberDetails: true,
            canReadScoutDetails: true,
            canReadCommandDetails: true,
            userId,
            roleId,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    if (roleId === "scout") {
        return {
            state: "scout",
            canReadMemberDetails: true,
            canReadScoutDetails: true,
            canReadCommandDetails: false,
            userId,
            roleId,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    if (roleId === "member") {
        return {
            state: "explorer",
            canReadMemberDetails: true,
            canReadScoutDetails: false,
            canReadCommandDetails: false,
            userId,
            roleId,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        state: "anonymous",
        canReadMemberDetails: false,
        canReadScoutDetails: false,
        canReadCommandDetails: false,
        userId,
        roleId: null,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}
