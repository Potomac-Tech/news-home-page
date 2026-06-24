export const currentRoutes = [
    {
        href: "/",
        source: "src/pages/Home.tsx",
        note: "Public news-first homepage with headlines, snippets, events, market modules, sponsor slots, and membership CTAs.",
    },
    {
        href: "/hardware",
        source: "src/pages/Hardware.tsx",
        note: "Existing hardware positioning route preserved in the scaffold.",
    },
    {
        href: "/source",
        source: "src/App.tsx redirect",
        note: "Redirects to /hardware to match current Vite behavior.",
    },
    {
        href: "/nexus",
        source: "src/pages/Nexus.tsx",
        note: "Nexus route preserved for future dashboard connection.",
    },
    {
        href: "/team",
        source: "src/pages/Team.tsx",
        note: "Public team route preserved.",
    },
    {
        href: "/news",
        source: "src/pages/News.tsx",
        note: "Future CMS-backed feed route.",
    },
    {
        href: "/events",
        source: "next-app/app/events/page.tsx",
        note: "Public event calendar with teaser fields and member-gated event details.",
    },
    {
        href: "/member/summits",
        source: "next-app/app/member/summits/page.tsx",
        note: "Member-gated internal summit tracker with upcoming summit and past-event summary views.",
    },
    {
        href: "/admin/sponsors",
        source: "next-app/app/admin/sponsors/page.tsx",
        note: "Staff-only sponsor, placement, campaign, discount, and reporting workflow.",
    },
    {
        href: "/news/vipc-grant-winner",
        source: "src/pages/VipcGrantWinner.tsx",
        note: "Existing story route reserved for article migration.",
    },
] as const;
