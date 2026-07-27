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
          userId: string;
          sessionId: string | null;
          membership: "explorer" | "scout" | "meridian";
          organizations: readonly Readonly<{
              organization_id: string;
              role: "member" | "org_admin";
          }>[];
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
const organizationRoleIds = new Set(["member", "org_admin"]);
const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveTerminalMembership({
    entitlementTiers,
    roleIds,
}: {
    entitlementTiers: readonly string[];
    roleIds: readonly string[];
}) {
    const normalized = new Set([
        ...roleIds,
        ...entitlementTiers.map((tier) =>
            tier === "command" ? "meridian" : tier
        ),
    ]);
    return membershipPrecedence.find((tier) => normalized.has(tier)) ?? null;
}

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
    const [roleResult, organizationResult] = await Promise.all([
        supabase
            .from("member_role_assignments")
            .select("role_id")
            .eq("user_id", gate.userId)
            .or(`expires_at.is.null,expires_at.gt.${now}`),
        supabase
            .from("organization_members")
            .select("organization_id,role")
            .eq("user_id", gate.userId)
            .eq("status", "active")
            .limit(51),
    ]);

    if (roleResult.error) throw new Error(roleResult.error.message);
    if (organizationResult.error) {
        throw new Error(organizationResult.error.message);
    }

    const organizations = (organizationResult.data ?? []).map((membership) => {
        if (
            !uuidPattern.test(membership.organization_id) ||
            !organizationRoleIds.has(membership.role)
        ) {
            throw new Error("Invalid active organization membership");
        }
        return {
            organization_id: membership.organization_id,
            role: membership.role as "member" | "org_admin",
        };
    });
    if (
        organizations.length > 50 ||
        new Set(organizations.map(({ organization_id }) => organization_id))
            .size !== organizations.length
    ) {
        throw new Error("Invalid Terminal organization context");
    }

    const directEntitlementQuery = supabase
        .from("entitlements")
        .select("tier")
        .eq("user_id", gate.userId)
        .eq("status", "active")
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`);
    const organizationEntitlementQuery =
        organizations.length === 0
            ? null
            : supabase
                  .from("entitlements")
                  .select("tier")
                  .in(
                      "organization_id",
                      organizations.map(
                          ({ organization_id }) => organization_id
                      )
                  )
                  .eq("status", "active")
                  .or(`starts_at.is.null,starts_at.lte.${now}`)
                  .or(`ends_at.is.null,ends_at.gt.${now}`);
    const [directEntitlementResult, organizationEntitlementResult] =
        await Promise.all([
            directEntitlementQuery,
            organizationEntitlementQuery,
        ]);

    if (directEntitlementResult.error) {
        throw new Error(directEntitlementResult.error.message);
    }
    if (organizationEntitlementResult?.error) {
        throw new Error(organizationEntitlementResult.error.message);
    }

    const membership = resolveTerminalMembership({
        roleIds: (roleResult.data ?? []).map(({ role_id }) => role_id),
        entitlementTiers: [
            ...(directEntitlementResult.data ?? []),
            ...(organizationEntitlementResult?.data ?? []),
        ].map(({ tier }) => tier),
    });

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
        userId: gate.userId,
        sessionId: gate.sessionId,
        membership,
        organizations,
        capabilityMode:
            membership === "explorer" ? "public_and_explorer" : "full_mvp",
        actionHref: membership === "explorer" ? "/pricing" : "/account",
    };
}
