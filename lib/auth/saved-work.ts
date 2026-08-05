import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type SavedWorkAccessContext = {
    canUseSavedWork: boolean;
    canManageOrganizationSavedWork: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const savedWorkMemberRoles = ["scout", "meridian"];
const savedWorkStaffRoles = ["editor", "analyst", "admin"];

export async function getSavedWorkAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<SavedWorkAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canUseSavedWork: false,
            canManageOrganizationSavedWork: false,
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
        .in("role_id", [...savedWorkMemberRoles, ...savedWorkStaffRoles])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (roleError) {
        throw new Error(roleError.message);
    }

    const roles = ((rolesData ?? []) as Array<{ role_id: string }>).map(
        (role) => role.role_id
    );
    const roleId = [...savedWorkStaffRoles, ...savedWorkMemberRoles].find(
        (role) => roles.includes(role)
    );

    if (!roleId) {
        return {
            canUseSavedWork: false,
            canManageOrganizationSavedWork: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canUseSavedWork: true,
        canManageOrganizationSavedWork:
            roleId === "meridian" || savedWorkStaffRoles.includes(roleId),
        state: "authorized",
        userId,
        roleId,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}

export async function requireSavedWorkAccess(nextPath = "/member/saved-work") {
    const supabase = await createClient();
    const access = await getSavedWorkAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Scout or Cabeus Council saved-work access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
        canManageOrganizationSavedWork:
            access.canManageOrganizationSavedWork,
    };
}
