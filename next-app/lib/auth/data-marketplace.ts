import { createClient } from "../supabase/server";

export type DataMarketplaceAccessContext = {
    canReadDataMarketplace: boolean;
    state: "signed_out" | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const dataMarketplaceRoles = [
    "scout",
    "command_user",
    "editor",
    "analyst",
    "admin",
];

export async function getDataMarketplaceAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<DataMarketplaceAccessContext> {
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canReadDataMarketplace: false,
            state: "signed_out",
            userId: null,
            roleId: null,
            loginHref,
        };
    }

    const { data: role, error: roleError } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", dataMarketplaceRoles)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (roleError) {
        throw new Error(roleError.message);
    }

    if (!role) {
        return {
            canReadDataMarketplace: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref,
        };
    }

    return {
        canReadDataMarketplace: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref,
    };
}
