import { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type ArticleAccessTier = "explorer" | "scout" | "meridian";

export type ArticleAccessContext = {
    canReadFullStory: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const rolesByTier: Record<ArticleAccessTier, string[]> = {
    explorer: ["explorer", "scout", "meridian", "editor", "analyst", "admin"],
    scout: ["scout", "meridian", "editor", "analyst", "admin"],
    meridian: ["meridian", "editor", "analyst", "admin"],
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
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canReadFullStory: false,
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
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canReadFullStory: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}
