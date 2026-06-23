export const currentRoutes = [
    {
        href: "/",
        source: "src/pages/Home.tsx",
        note: "Public front door, ready to evolve into the news-first homepage.",
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
        href: "/news/vipc-grant-winner",
        source: "src/pages/VipcGrantWinner.tsx",
        note: "Existing story route reserved for article migration.",
    },
] as const;
