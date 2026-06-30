import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "./_data/site";
import { fallbackArticles } from "./news/_data/articles";

const publicRoutes = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/terminal", changeFrequency: "weekly", priority: 0.9 },
    { path: "/news", changeFrequency: "daily", priority: 0.9 },
    { path: "/launches", changeFrequency: "weekly", priority: 0.75 },
    { path: "/spacecraft", changeFrequency: "weekly", priority: 0.75 },
    { path: "/procurement", changeFrequency: "weekly", priority: 0.75 },
    { path: "/regulatory", changeFrequency: "weekly", priority: 0.75 },
    { path: "/companies", changeFrequency: "weekly", priority: 0.75 },
    { path: "/datasets", changeFrequency: "weekly", priority: 0.8 },
    { path: "/events", changeFrequency: "weekly", priority: 0.8 },
    { path: "/calculators", changeFrequency: "monthly", priority: 0.7 },
    { path: "/alerts", changeFrequency: "monthly", priority: 0.7 },
    { path: "/account", changeFrequency: "monthly", priority: 0.7 },
    { path: "/apply", changeFrequency: "monthly", priority: 0.7 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
    { path: "/command", changeFrequency: "monthly", priority: 0.7 },
    { path: "/hardware", changeFrequency: "monthly", priority: 0.6 },
    { path: "/nexus", changeFrequency: "monthly", priority: 0.6 },
    { path: "/team", changeFrequency: "monthly", priority: 0.5 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
    const publicEntries = publicRoutes.map((route) => ({
        url: absoluteSiteUrl(route.path),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    const articleEntries = fallbackArticles.map((article) => ({
        url: absoluteSiteUrl(`/news/${article.slug}`),
        lastModified: new Date(article.publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [...publicEntries, ...articleEntries];
}
