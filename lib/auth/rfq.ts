import { createClient } from "../supabase/server";

export type RfqAccessContext = {
    canUseRfqs: boolean;
    canModerateRfqs: boolean;
    state: "signed_out" | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const rfqMemberRoles = ["scout", "command_user"];
const rfqStaffRoles = ["moderator", "analyst", "admin"];

export async function getRfqAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<RfqAccessContext> {
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canUseRfqs: false,
            canModerateRfqs: false,
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
            loginHref,
        };
    }

    return {
        canUseRfqs: true,
        canModerateRfqs: rfqStaffRoles.some((role) => roles.includes(role)),
        state: "authorized",
        userId,
        roleId,
        loginHref,
    };
}

export async function requireRfqAccess(nextPath = "/member/rfqs") {
    const supabase = await createClient();
    const access = await getRfqAccessContext({ supabase, nextPath });

    if (access.state !== "authorized" || !access.userId) {
        throw new Error("Scout or Command RFQ access is required.");
    }

    return {
        supabase,
        userId: access.userId,
        roleId: access.roleId,
        canModerateRfqs: access.canModerateRfqs,
    };
}
