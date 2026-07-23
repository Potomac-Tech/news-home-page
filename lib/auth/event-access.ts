import { createClient } from "../supabase/server";
import type { EventAccessTier } from "../../app/_data/events";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

export type EventAccessContext = {
    canReadEventDetails: boolean;
    state: Exclude<ProfileGateState, "ready"> | "signed_in_locked" | "authorized";
    userId: string | null;
    roleId: string | null;
    loginHref: string;
    profileHref: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const rolesByTier: Record<EventAccessTier, string[]> = {
    explorer: ["explorer", "scout", "meridian", "editor", "analyst", "admin"],
    scout: ["scout", "meridian", "editor", "analyst", "admin"],
    meridian: ["meridian", "editor", "analyst", "admin"],
};

export async function getEventAccessContext({
    supabase,
    tier,
    nextPath,
}: {
    supabase: SupabaseServerClient;
    tier: EventAccessTier;
    nextPath: string;
}): Promise<EventAccessContext> {
    const profileGate = await getProfileGateContext({ supabase, nextPath });
    if (profileGate.state !== "ready") {
        return {
            canReadEventDetails: false,
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
            canReadEventDetails: false,
            state: "signed_in_locked",
            userId,
            roleId: null,
            loginHref: profileGate.loginHref,
            profileHref: null,
        };
    }

    return {
        canReadEventDetails: true,
        state: "authorized",
        userId,
        roleId: role.role_id as string,
        loginHref: profileGate.loginHref,
        profileHref: null,
    };
}
