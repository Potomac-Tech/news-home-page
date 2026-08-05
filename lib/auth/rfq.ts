import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type RfqAccessContext = {
    canUseRfqs: boolean;
    canModerateRfqs: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const rfqMemberRoles = ["scout", "meridian"];
const rfqStaffRoles = ["moderator", "analyst", "admin"];

export async function getRfqAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<RfqAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canUseRfqs: false,
            canModerateRfqs: false,
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
        .in("role_id", [...rfqMemberRoles, ...rfqStaffRoles])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const roles = ((rolesData ?? []) as Array<{ role_id: string }>).map(
        (role) => role.role_id
    );
    const roleId = [...rfqStaffRoles, ...rfqMemberRoles].find((role) =>
        roles.includes(role)
    );

    if (!roleId) {
        return {
            canUseRfqs: false,
            canModerateRfqs: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canUseRfqs: true,
        canModerateRfqs: rfqStaffRoles.some((role) => roles.includes(role)),
        state: "authorized",
        userId,
        roleId,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}

export async function requireRfqAccess(nextPath = "/member/rfqs") {
    const supabase = await createClient();
    const access = await getRfqAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Scout or Cabeus Council RFQ access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
        canModerateRfqs: access.canModerateRfqs,
    };
}
