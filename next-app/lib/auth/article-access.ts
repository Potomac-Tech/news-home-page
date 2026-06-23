import { createClient } from "../supabase/server";

export type ArticleAccessTier = "member" | "scout" | "command";

export type ArticleAccessContext = {
    canReadFullStory: boolean;
    state: "signed_out" | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const rolesByTier: Record<ArticleAccessTier, string[]> = {
    member: ["member", "scout", "command_user", "editor", "analyst", "admin"],
    scout: ["scout", "command_user", "editor", "analyst", "admin"],
    command: ["command_user", "editor", "analyst", "admin"],
};

export async function getArticleAccessContext({
    supabase,
    tier,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    tier: ArticleAccessTier;
    nextPath: string;
}): Promise<ArticleAccessContext> {
    const loginHref = `/auth/login?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        return {
            canReadFullStory: false,
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
        .in("role_id", rolesByTier[tier])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1)
        .maybeSingle();

    if (roleError) {
        throw new Error(roleError.message);
    }

    if (!role) {
        return {
            canReadFullStory: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref,
        };
    }

    return {
        canReadFullStory: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref,
    };
}
