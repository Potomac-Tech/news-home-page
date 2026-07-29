import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "./_data/site";
import { fallbackArticles } from "./news/_data/articles";
import { allowLocalContentFallbacks } from "./_data/contentFallbacks";
import { createClient } from "../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../lib/supabase/config";

const publicRoutes = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/terminal", changeFrequency: "weekly", priority: 0.9 },
    { path: "/search", changeFrequency: "weekly", priority: 0.9 },
    { path: "/archives", changeFrequency: "daily", priority: 0.9 },
    { path: "/space-industrialist-week", changeFrequency: "weekly", priority: 0.85 },
    { path: "/space-investment-forum", changeFrequency: "monthly", priority: 0.8 },
    { path: "/cabeus-games", changeFrequency: "weekly", priority: 0.85 },
    { path: "/events", changeFrequency: "weekly", priority: 0.8 },
    { path: "/authors", changeFrequency: "weekly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/launches", changeFrequency: "weekly", priority: 0.75 },
    { path: "/datasets", changeFrequency: "weekly", priority: 0.8 },
    { path: "/calculators", changeFrequency: "monthly", priority: 0.7 },
    { path: "/alerts", changeFrequency: "monthly", priority: 0.7 },
    { path: "/account", changeFrequency: "monthly", priority: 0.7 },
    { path: "/account/delete", changeFrequency: "monthly", priority: 0.5 },
    { path: "/apply", changeFrequency: "monthly", priority: 0.7 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
    { path: "/command", changeFrequency: "monthly", priority: 0.7 },
    { path: "/legal/terms", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/privacy", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/cookies", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/accessibility", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/data-safety", changeFrequency: "monthly", priority: 0.5 },
    { path: "/hardware", changeFrequency: "monthly", priority: 0.6 },
    { path: "/nexus", changeFrequency: "monthly", priority: 0.6 },
    { path: "/team", changeFrequency: "monthly", priority: 0.5 },
] as const;

async function loadPublishedArticleEntries(): Promise<MetadataRoute.Sitemap> {
    if (!hasPotomacSupabasePublicConfig()) {
        return allowLocalContentFallbacks()
            ? fallbackArticles.map((article) => ({
                  url: absoluteSiteUrl(`/news/${article.slug}`),
                  lastModified: new Date(article.publishedAt),
                  changeFrequency: "weekly" as const,
                  priority: 0.8,
              }))
            : [];
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("editorial_articles")
            .select("slug,published_at,updated_at")
            .eq("status", "published")
            .not("primary_author_id", "is", null)
            .lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false });

        if (error || !data?.length) {
            return [];
        }

        return data.map((article) => ({
            url: absoluteSiteUrl(`/news/${article.slug}`),
            lastModified: new Date(
                article.updated_at ?? article.published_at ?? Date.now()
            ),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch {
        return [];
    }
}

async function loadAuthorEntries(): Promise<MetadataRoute.Sitemap> {
    if (!hasPotomacSupabasePublicConfig()) return [];

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("editorial_authors")
            .select("slug,updated_at")
            .eq("is_active", true)
            .order("display_name");

        if (error) return [];

        return (data ?? []).map((author) => ({
            url: absoluteSiteUrl(`/authors/${author.slug}`),
            lastModified: new Date(author.updated_at ?? Date.now()),
            changeFrequency: "weekly" as const,
            priority: 0.65,
        }));
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const publicEntries = publicRoutes.map((route) => ({
        url: absoluteSiteUrl(route.path),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    const [articleEntries, authorEntries] = await Promise.all([
        loadPublishedArticleEntries(),
        loadAuthorEntries(),
    ]);

    return [...publicEntries, ...articleEntries, ...authorEntries];
}
