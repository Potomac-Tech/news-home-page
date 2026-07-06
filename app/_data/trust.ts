export const supportEmail = "support@potomacdb.com";

export const trustRoutes = [
    {
        href: "/legal/terms",
        label: "Terms",
        summary: "Membership, paid access, acceptable use, and platform terms.",
    },
    {
        href: "/legal/privacy",
        label: "Privacy",
        summary: "How account, usage, billing, and intelligence workflow data is handled.",
    },
    {
        href: "/legal/cookies",
        label: "Cookies",
        summary: "Cookie categories, session use, analytics choices, and preferences.",
    },
    {
        href: "/legal/accessibility",
        label: "Accessibility",
        summary: "Accessibility commitments, testing baseline, and support path.",
    },
    {
        href: "/legal/data-safety",
        label: "Data Safety",
        summary: "Security, data handling, uploads, exports, and incident contact paths.",
    },
    {
        href: "/account/delete",
        label: "Account deletion",
        summary: "Request account deletion, export review, and membership cancellation help.",
    },
] as const;

export const cookieCategories = [
    {
        id: "essential",
        label: "Essential",
        detail: "Required for Supabase session handling, security, and core site behavior.",
        required: true,
    },
    {
        id: "preferences",
        label: "Preferences",
        detail: "Stores local choices such as cookie settings and interface preferences.",
        required: false,
    },
    {
        id: "analytics",
        label: "Analytics",
        detail: "Reserved for privacy-conscious product analytics after consent.",
        required: false,
    },
] as const;
