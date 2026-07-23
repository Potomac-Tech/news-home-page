import type { createClient } from "../supabase/server";
import { getProfileGateContext, type ProfileGateState } from "./profile-completion";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
export type WeeklyTrackerTier = "generic" | "explorer" | "scout" | "command" | "staff";
export type WeeklyTrackerAccess = {
    state: Exclude<ProfileGateState, "ready"> | "authorized";
    userId: string | null; tier: WeeklyTrackerTier; canReadBasic: boolean;
    canUsePremiumTools: boolean; loginHref: string; profileHref: string | null;
};

export async function getWeeklyTrackerAccess({ supabase, nextPath = "/tracker/launches" }: { supabase: SupabaseServerClient; nextPath?: string }): Promise<WeeklyTrackerAccess> {
    const gate = await getProfileGateContext({ supabase, nextPath });
    if (gate.state !== "ready") return { state: gate.state, userId: gate.userId, tier: "generic", canReadBasic: false, canUsePremiumTools: false, loginHref: gate.loginHref, profileHref: gate.profileHref };
    const { data, error } = await supabase.from("member_role_assignments").select("role_id").eq("user_id", gate.userId).or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
    if (error) throw new Error(error.message);
    const roles = new Set((data ?? []).map((role) => role.role_id));
    const tier: WeeklyTrackerTier = ["admin","analyst","editor"].some((role) => roles.has(role)) ? "staff" : roles.has("meridian") ? "command" : roles.has("scout") ? "scout" : roles.has("explorer") ? "explorer" : "generic";
    return { state: "authorized", userId: gate.userId, tier, canReadBasic: true, canUsePremiumTools: ["scout","command","staff"].includes(tier), loginHref: gate.loginHref, profileHref: null };
}
