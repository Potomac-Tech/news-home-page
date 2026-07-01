import { liveExternalChannelUrls } from "./channels";

export const siteConfig = {
    name: "Potomac News & Intelligence",
    legalName: "Potomac Database Systems",
    url: "https://potomacdb.com",
    description:
        "Potomac public lunar news, market signals, event previews, and member-gated intelligence.",
    logoPath: "/Potomac Logo.png",
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
        sameAs: liveExternalChannelUrls,
    };
}
