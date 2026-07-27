import { getProfileGateContext } from "./profile-completion";
import { createClient } from "../supabase/server";

export type TerminalViewerContext =
    | Readonly<{
          state: "anonymous" | "email_unverified" | "profile_incomplete";
          membership: null;
          capabilityMode: "public_preview";
          actionHref: string;
      }>
    | Readonly<{
          state: "ready";
          membership: "explorer" | "scout" | "meridian";
          capabilityMode: "public_and_explorer" | "full_mvp";
          actionHref: "/pricing" | "/account";
      }>
    | Readonly<{
          state: "membership_required";
          membership: null;
          capabilityMode: "public_preview";
          actionHref: "/pricing";
      }>;

const membershipPrecedence = ["meridian", "scout", "explorer"] as const;

export async function getTerminalViewerContext(
    nextPath: string
): Promise<TerminalViewerContext> {
    const supabase = await createClient();
    const gate = await getProfileGateContext({ supabase, nextPath });

    if (gate.state !== "ready") {
        return {
            state:
                gate.state === "signed_out"
                    ? "anonymous"
                    : gate.state,
            membership: null,
            capabilityMode: "public_preview",
            actionHref: gate.profileHref ?? gate.loginHref,
        };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("member_role_assignments")
        .select("role_id")
        .eq("user_id", gate.userId)
        .in("role_id", [...membershipPrecedence])
        .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error) throw new Error(error.message);

    const roleIds = new Set((data ?? []).map((role) => role.role_id));
    const membership = membershipPrecedence.find((tier) => roleIds.has(tier));

    if (!membership) {
        return {
            state: "membership_required",
            membership: null,
            capabilityMode: "public_preview",
            actionHref: "/pricing",
        };
    }

    return {
        state: "ready",
        membership,
        capabilityMode:
            membership === "explorer" ? "public_and_explorer" : "full_mvp",
        actionHref: membership === "explorer" ? "/pricing" : "/account",
    };
}
