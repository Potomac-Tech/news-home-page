import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type MemberChatAccessContext = {
    canUseMemberChat: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const memberChatRoles = ["member", "scout", "command_user"];
const memberChatStaffRoles = ["editor", "analyst", "admin"];

export async function getMemberChatAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<MemberChatAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canUseMemberChat: false,
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
        .in("role_id", [...memberChatRoles, ...memberChatStaffRoles])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (roleError) {
        throw new Error(roleError.message);
    }

    if (!role) {
        return {
            canUseMemberChat: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canUseMemberChat: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}

export async function requireMemberChatAccess(nextPath = "/member/chat") {
    const supabase = await createClient();
    const access = await getMemberChatAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Approved member chat access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
    };
}
