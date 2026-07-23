export const enterprisePublicNames = ["Meridian", "Command"] as const;
export type EnterprisePublicName = (typeof enterprisePublicNames)[number];

// This is the only public enterprise-label switch. Internal access controls
// remain pinned to the `command` role and entitlement identifiers.
export const enterprisePublicName: EnterprisePublicName = "Meridian";

export const tierConfig = {
    explorer: {
        publicName: "Explorer",
        price: "Free",
        description: "Free default membership after email verification and profile completion.",
    },
    scout: {
        publicName: "Scout",
        price: "$25,000",
        cadence: "per user / year",
        description: "Professional paid intelligence access for lunar market operators.",
    },
    enterprise: {
        publicName: enterprisePublicName,
        internalName: "Command",
        price: "Contract discussion",
        description:
            "Organization-level lunar intelligence handled through manual review and contract discussion.",
    },
} as const;

export function publicTierName(tier: string | null | undefined) {
    if (tier === "command" || tier === "meridian") {
        return tierConfig.enterprise.publicName;
    }

    if (tier === "scout") {
        return tierConfig.scout.publicName;
    }

    if (tier === "member" || tier === "explorer") {
        return tierConfig.explorer.publicName;
    }

    return tier ?? "Unknown";
}
