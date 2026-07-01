import { createClient } from "../supabase/server";

export type MemberForumAccessContext = {
    canUseMemberForums: boolean;
    canModerateMemberForums: boolean;
    state: "signed_out" | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const forumMemberRoles = ["member", "scout", "command_user"];
const forumModeratorRoles = ["moderator", "editor", "analyst", "admin"];

export async function getMemberForumAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<MemberForumAccessContext> {
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canUseMemberForums: false,
            canModerateMemberForums: false,
            state: "signed_out",
            userId: null,
            roleId: null,
            loginHref,
        };
    }

    const { data: rolesData, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", [...forumMemberRoles, ...forumModeratorRoles])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const roles = ((rolesData ?? []) as Array<{ role_id: string }>).map(
        (role) => role.role_id
    );
    const roleId = [...forumModeratorRoles, ...forumMemberRoles].find((role) =>
        roles.includes(role)
    );

    if (!roleId) {
        return {
            canUseMemberForums: false,
            canModerateMemberForums: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref,
        };
    }

    return {
        canUseMemberForums: true,
        canModerateMemberForums: forumModeratorRoles.some((role) =>
            roles.includes(role)
        ),
        state: "authorized",
        userId,
        roleId,
        loginHref,
    };
}

export async function requireMemberForumAccess(nextPath = "/member/forums") {
    const supabase = await createClient();
    const access = await getMemberForumAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Approved member forum access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
        canModerateMemberForums: access.canModerateMemberForums,
    };
}
