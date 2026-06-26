import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";

export type EconomyStaffContext = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
};

export type EconomySubscriberAccessContext = {
    canReadEconomyDashboard: boolean;
    state: "signed_out" | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const economySubscriberRoles = [
    "scout",
    "command_user",
    "editor",
    "analyst",
    "admin",
];

export async function requireEconomyStaff(): Promise<EconomyStaffContext> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        redirect("/auth/login?next=/admin/economy");
    }

    const { data: role } = await supabase
        .from("member_role_assignments")
        .select("id")
        .eq("user_id", userId)
        .in("role_id", ["editor", "analyst", "admin"])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (!role) {
        redirect("/member");
    }

    return {
        supabase,
        userId,
    };
}

export async function getEconomySubscriberAccessContext({
    supabase,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    nextPath: string;
}): Promise<EconomySubscriberAccessContext> {
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canReadEconomyDashboard: false,
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
        .in("role_id", economySubscriberRoles)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (roleError) {
        throw new Error(roleError.message);
    }

    if (!role) {
        return {
            canReadEconomyDashboard: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref,
        };
    }

    return {
        canReadEconomyDashboard: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref,
    };
}
