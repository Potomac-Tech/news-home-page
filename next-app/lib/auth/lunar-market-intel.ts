import { createClient } from "../supabase/server";

export type LunarMarketIntelAccess = {
    state: "anonymous" | "explorer" | "scout" | "command" | "staff";
    canReadMemberDetails: boolean;
    canReadScoutDetails: boolean;
    canReadCommandDetails: boolean;
    userId: string | null;
    roleId: string | null;
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
}: {
    supabase: SupabaseServerClient;
}): Promise<LunarMarketIntelAccess> {
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            state: "anonymous",
            canReadMemberDetails: false,
            canReadScoutDetails: false,
            canReadCommandDetails: false,
            userId: null,
            roleId: null,
        };
    }

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
        };
    }

    return {
        state: "anonymous",
        canReadMemberDetails: false,
        canReadScoutDetails: false,
        canReadCommandDetails: false,
        userId,
        roleId: null,
    };
}
