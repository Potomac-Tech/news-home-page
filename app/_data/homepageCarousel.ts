import { potomacBrand } from "./brand";
import type { createClient } from "../../lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type HomepageCarouselSlide = {
    id: string;
    articleId: string | null;
    slideType: string;
    title: string;
    summary: string;
    visualAssetUrl: string;
    visualAssetAlt: string;
    ctaLabel: string;
    ctaRoute: string;
    minimumTier: string;
    isRequired: boolean;
    isPinned: boolean;
    displayRank: number;
    sourceNote: string;
    freshnessAt: string;
    expiresAt: string;
};

function mapSlide(row: Record<string, unknown>): HomepageCarouselSlide {
    return {
        id: String(row.id),
        articleId: typeof row.article_id === "string" ? row.article_id : null,
        slideType: String(row.slide_type),
        title: String(row.title),
        summary: String(row.summary),
        visualAssetUrl: String(row.visual_asset_url),
        visualAssetAlt: String(row.visual_asset_alt),
        ctaLabel: String(row.cta_label),
        ctaRoute: String(row.cta_route),
        minimumTier: String(row.minimum_tier),
        isRequired: Boolean(row.is_required),
        isPinned: Boolean(row.is_pinned),
        displayRank: Number(row.display_rank),
        sourceNote: String(row.source_note),
        freshnessAt: String(row.freshness_at),
        expiresAt: String(row.expires_at),
    };
}

export async function loadHomepageCarousel(
    supabase: SupabaseServerClient,
    viewer: { emailVerified: boolean; profileComplete: boolean }
) {
    const now = new Date().toISOString();
    const query = supabase
        .from("homepage_carousel_slides")
        .select("*")
        .eq("status", "published")
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .gt("expires_at", now)
        .order("is_required", { ascending: false })
        .order("is_pinned", { ascending: false })
        .order("display_rank", { ascending: true })
        .limit(5);
    const result = viewer.emailVerified && viewer.profileComplete
        ? await query
        : await query.eq("content_visibility", "public_teaser");
    if (result.error) throw new Error(result.error.message);
    const manual = ((result.data ?? []) as Record<string, unknown>[]).map(mapSlide);
    if (manual.length >= 5) return manual.slice(0, 5);

    const articleIds = new Set(manual.flatMap((slide) => slide.articleId ?? []));
    const { data: articles, error: articleError } = await supabase
        .from("editorial_articles")
        .select("id,slug,title,public_summary,hero_image_url,hero_image_alt,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
    if (articleError) throw new Error(articleError.message);

    const auto = ((articles ?? []) as Array<Record<string, unknown>>)
        .filter((article) => !articleIds.has(String(article.id)))
        .slice(0, 5 - manual.length)
        .map((article, index): HomepageCarouselSlide => ({
            id: `auto:${String(article.id)}`,
            articleId: String(article.id),
            slideType: "anonymous_teaser",
            title: String(article.title),
            summary: String(article.public_summary),
            visualAssetUrl: typeof article.hero_image_url === "string"
                ? article.hero_image_url
                : potomacBrand.assets.cabeusHero,
            visualAssetAlt: typeof article.hero_image_alt === "string"
                ? article.hero_image_alt
                : "Cabeus Explorer lunar intelligence briefing",
            ctaLabel: "Read the brief",
            ctaRoute: `/news/${String(article.slug)}`,
            minimumTier: "public",
            isRequired: false,
            isPinned: false,
            displayRank: 900 + index,
            sourceNote: "Latest published CMS story auto-selection.",
            freshnessAt: String(article.published_at),
            expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        }));
    return [...manual, ...auto].slice(0, 5);
}
