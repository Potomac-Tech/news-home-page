import type { MetadataRoute } from "next";
import { absoluteSiteUrl, siteConfig } from "./_data/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/admin/",
                "/api/",
                "/auth/",
                "/member",
                "/organization",
            ],
        },
        sitemap: absoluteSiteUrl("/sitemap.xml"),
        host: siteConfig.url,
    };
}
