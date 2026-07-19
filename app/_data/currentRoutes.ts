export const currentRoutes = [
    {
        href: "/",
        source: "app/page.tsx",
        note: "Public news-first homepage with headlines, snippets, events, market modules, sponsor slots, and membership CTAs.",
    },
    {
        href: "/hardware",
        source: "app/hardware/page.tsx",
        note: "Hardware positioning route in the production Next.js app.",
    },
    {
        href: "/source",
        source: "app/source/page.tsx",
        note: "Redirects to /hardware from the production Next.js route.",
    },
    {
        href: "/nexus",
        source: "app/nexus/page.tsx",
        note: "Nexus route for dashboard connection.",
    },
    {
        href: "/team",
        source: "app/team/page.tsx",
        note: "Public team route preserved.",
    },
    {
        href: "/news",
        source: "app/news/page.tsx",
        note: "CMS-backed feed route.",
    },
    {
        href: "/events",
        source: "app/events/page.tsx",
        note: "Public event calendar with teaser fields and member-gated event details.",
    },
    {
        href: "/datasets",
        source: "app/datasets/page.tsx",
        note: "Public dataset catalog with NASA/science archives, Cabeus Explorer proprietary entries, source metadata, availability, tier, sample, and demo indicators.",
    },
    {
        href: "/tracker/launches",
        source: "app/tracker/launches/page.tsx",
        note: "Verified-profile Launches & Missions weekly tracker with Scout/Meridian tools and RLS-gated values.",
    },
    {
        href: "/tracker/contracts",
        source: "app/tracker/contracts/page.tsx",
        note: "Public-safe and verified-profile New Contract Awards tracker with RLS-gated values, citations, and review metadata.",
    },
    {
        href: "/member/summits",
        source: "app/member/summits/page.tsx",
        note: "Member-gated internal summit tracker with upcoming summit and past-event summary views.",
    },
    {
        href: "/admin/sponsors",
        source: "app/admin/sponsors/page.tsx",
        note: "Staff-only sponsor, placement, campaign, discount, and reporting workflow.",
    },
    {
        href: "/admin/content",
        source: "app/admin/content/page.tsx",
        note: "Staff-only production content submission, approval, asset, and deployment-readiness workflow.",
    },
    {
        href: "/admin/carousel",
        source: "app/admin/carousel/page.tsx",
        note: "Staff-only homepage carousel inventory, ranking, preview, publication, and expiration workflow.",
    },
    {
        href: "/news/nasa-lunar-delivery-awards-2028",
        source: "app/news/[slug]/page.tsx",
        note: "Market and strategic analysis of NASA's 2028 commercial lunar delivery awards.",
    },
    {
        href: "/news/artemis-iii-starlink-optical-relay",
        source: "app/news/[slug]/page.tsx",
        note: "Strategic analysis of commercial optical communications in the Artemis architecture.",
    },
    {
        href: "/news/artemis-iii-hardware-stacking",
        source: "app/news/[slug]/page.tsx",
        note: "Program and supply-chain analysis of Artemis III hardware stacking.",
    },
] as const;
