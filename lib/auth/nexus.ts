import type { createClient } from "../supabase/server";

export const NEXUS_AUTH_URL = "https://nexus-explore.potomacdb.com/0auth";

export type NexusProfileRole =
    | "base_user"
    | "premium_user"
    | "superior_user"
    | "third_party_user"
    | "admin";

export type NexusAccessStatus = {
    label: string;
    detail: string;
    membershipLabel: string;
    nexusRoleLabel: string;
    entitlementLabel: string;
    canOpenNexus: boolean;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const allowedRoleIds = [
    "admin",
    "analyst",
    "editor",
    "meridian",
    "scout",
    "explorer",
] as const;

function formatIdentifier(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function resolveNexusProfileRole({
    roleIds,
    entitlementTier,
}: {
    roleIds: string[];
    entitlementTier?: string | null;
}): NexusProfileRole | null {
    if (roleIds.includes("admin")) return "admin";
    if (roleIds.includes("meridian") || entitlementTier === "command") {
        return "superior_user";
    }
    if (roleIds.includes("scout") || entitlementTier === "scout") {
        return "premium_user";
    }
    if (roleIds.includes("explorer")) return "base_user";
    return null;
}

export async function loadNexusAccessStatus(
    supabase: SupabaseServerClient,
    userId: string
): Promise<NexusAccessStatus> {
    try {
        const now = new Date().toISOString();
        const [rolesResult, entitlementResult, nexusProfileResult] =
            await Promise.all([
                supabase
                    .from("member_role_assignments")
                    .select("role_id")
                    .eq("user_id", userId)
                    .in("role_id", [...allowedRoleIds])
                    .or(`expires_at.is.null,expires_at.gt.${now}`),
                supabase
                    .from("entitlements")
                    .select("tier,status,ends_at")
                    .eq("user_id", userId)
                    .eq("status", "active")
                    .or(`ends_at.is.null,ends_at.gt.${now}`)
                    .order("starts_at", { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from("profiles")
                    .select("role")
                    .eq("user_id", userId)
                    .maybeSingle(),
            ]);

        if (rolesResult.error) throw new Error(rolesResult.error.message);

        const roleIds = (
            (rolesResult.data ?? []) as Array<{ role_id: string }>
        ).map((role) => role.role_id);
        const entitlement = entitlementResult.error
            ? null
            : (entitlementResult.data as
                  | { tier: string; status: string; ends_at: string | null }
                  | null);
        const expectedRole = resolveNexusProfileRole({
            roleIds,
            entitlementTier: entitlement?.tier,
        });
        const storedRole = nexusProfileResult.error
            ? null
            : (nexusProfileResult.data as { role: NexusProfileRole } | null)?.role;
        const isStaff = roleIds.some((role) =>
            ["admin", "analyst", "editor"].includes(role)
        );
        const isStoredAdmin = storedRole === "admin";
        const canOpenNexus = expectedRole !== null || isStaff || isStoredAdmin;
        const membershipLabel = roleIds.includes("meridian")
            ? "Cabeus Council"
            : roleIds.includes("scout")
              ? "Scout"
              : roleIds.includes("explorer")
                ? "Explorer"
                : isStaff || isStoredAdmin
                  ? "Staff"
                  : "Pending";
        const entitlementLabel = entitlement
            ? `${formatIdentifier(entitlement.tier)} ${entitlement.status}`
            : "No active paid entitlement";

        if (!canOpenNexus) {
            return {
                label: "Access pending",
                detail: "An active approved membership is required to open Nexus.",
                membershipLabel,
                nexusRoleLabel: storedRole
                    ? formatIdentifier(storedRole)
                    : "Not synchronized",
                entitlementLabel,
                canOpenNexus: false,
            };
        }

        const resolvedRole = expectedRole ?? storedRole;
        return {
            label: "Nexus ready",
            detail:
                "Your Cabeus Explorer identity and membership role are recognized by Nexus.",
            membershipLabel,
            nexusRoleLabel: resolvedRole
                ? formatIdentifier(resolvedRole)
                : "Staff access",
            entitlementLabel,
            canOpenNexus: true,
        };
    } catch {
        return {
            label: "Status unavailable",
            detail: "Nexus access status could not be loaded.",
            membershipLabel: "Unknown",
            nexusRoleLabel: "Unknown",
            entitlementLabel: "Unknown",
            canOpenNexus: false,
        };
    }
}
