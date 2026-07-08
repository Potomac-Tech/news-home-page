export const potomacBrand = {
    colors: {
        primary: "#0D1114",
        secondary: "#1E2227",
        gold: "#F3A712",
        cream: "#EEF1F3",
        regolith: "#B9A98B",
        oxide: "#A34A32",
        machine: "#6D747D",
    },
    fonts: {
        sans: "Source Sans 3",
        serif: "Oswald",
        mono: "IBM Plex Mono",
    },
    assets: {
        logo: "/cabeus-explorer-logo.png",
        logoTransparent: "/cabeus-explorer-logo.png",
        newsLogo: "/News_Logo.png",
        nexusScreenshot: "/Nexus Screenshot.png",
        sourceRendering: "/Source Rendering.png",
        cabeusHero: "/cabeus-lunar-industrial-hero.png",
        pressRelease: "/potomac-lunar-economy-press-release-05182026.pdf",
    },
    identity: {
        name: "Cabeus Explorer",
        tagline: "INTELLIGENCE FOR THE LUNAR INDUSTRIALIST",
        essence: "Intelligence for the builders of the lunar economy.",
    },
    surfaces: {
        page: "bg-potomac-secondary text-potomac-cream",
        commandBand: "bg-potomac-primary border-potomac-gold/30",
        glassCard: "glass-card rounded",
        grid: "bg-grid-pattern",
    },
} as const;
