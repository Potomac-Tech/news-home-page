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
        publicName: "Meridian",
        internalName: "Command",
        price: "Contract discussion",
        description:
            "Organization-level lunar intelligence handled through manual review and contract discussion.",
    },
} as const;
