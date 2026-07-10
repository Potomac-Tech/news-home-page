import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type MemberForumAccessContext = {
    canUseMemberForums: boolean;
    canModerateMemberForums: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
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
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canUseMemberForums: false,
            canModerateMemberForums: false,
            state: profileGate.state,
            userId: profileGate.userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: profileGate.profileHref,
        };
    }
    const userId = profileGate.userId;

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
            loginHref: profileGate.loginHref,
            profileHref: null,
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
        loginHref: profileGate.loginHref,
        profileHref: null,
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
