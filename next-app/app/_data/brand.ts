export const potomacBrand = {
    colors: {
        primary: "#2D3038",
        secondary: "#2E3138",
        gold: "#D4AF37",
        cream: "#EAE5D7",
    },
    fonts: {
        sans: "Source Sans 3",
        serif: "Cinzel",
    },
    assets: {
        logo: "/Potomac Logo.png",
        logoTransparent: "/Potomac Logo Transparent.png",
        newsLogo: "/News_Logo.png",
        nexusScreenshot: "/Nexus Screenshot.png",
        sourceRendering: "/Source Rendering.png",
        pressRelease: "/potomac-lunar-economy-press-release-05182026.pdf",
    },
    surfaces: {
        page: "bg-potomac-secondary text-potomac-cream",
        commandBand: "bg-potomac-primary border-potomac-gold/30",
        glassCard: "glass-card rounded",
        grid: "bg-grid-pattern",
    },
} as const;
