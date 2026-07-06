import { createClient } from "../supabase/server";

export type SavedWorkAccessContext = {
    canUseSavedWork: boolean;
    canManageOrganizationSavedWork: boolean;
    state: "signed_out" | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const savedWorkMemberRoles = ["scout", "command_user"];
const savedWorkStaffRoles = ["editor", "analyst", "admin"];

export async function getSavedWorkAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<SavedWorkAccessContext> {
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canUseSavedWork: false,
            canManageOrganizationSavedWork: false,
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
            loginHref,
        };
    }

    return {
        canUseSavedWork: true,
        canManageOrganizationSavedWork:
            roleId === "command_user" || savedWorkStaffRoles.includes(roleId),
        state: "authorized",
        userId,
        roleId,
        loginHref,
    };
}

export async function requireSavedWorkAccess(nextPath = "/member/saved-work") {
    const supabase = await createClient();
    const access = await getSavedWorkAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Scout or Command saved-work access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
        canManageOrganizationSavedWork:
            access.canManageOrganizationSavedWork,
    };
}
