import { liveExternalChannelUrls } from "./channels";

const publicSiteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.cabeusexplorer.com"
).replace(/\/+$/, "");

export const siteConfig = {
    name: "Cabeus Explorer",
    legalName: "Potomac Database Systems",
    url: publicSiteUrl,
    description:
        "Trusted intelligence, proprietary data, and strategic context for leaders shaping the new space age.",
    logoPath: "/cabeus-moon-editorial-hero.png",
    publisherEmail: "info@potomacdb.com",
    publisherLocation: "Washington, DC, United States",
} as const;

export function absoluteSiteUrl(pathOrUrl: string) {
    try {
        return new URL(pathOrUrl).toString();
    } catch {
        return new URL(pathOrUrl, siteConfig.url).toString();
    }
}

export function jsonLdScript(data: unknown) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.legalName,
        url: siteConfig.url,
        logo: absoluteSiteUrl(siteConfig.logoPath),
        email: siteConfig.publisherEmail,
        address: {
            "@type": "PostalAddress",
            addressLocality: "Washington",
            addressRegion: "DC",
            addressCountry: "US",
        },
        sameAs: liveExternalChannelUrls,
    };
}
