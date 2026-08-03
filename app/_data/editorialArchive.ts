import "server-only";

import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import type { EditorialSectionSlug } from "../../lib/editorial/section-tags";

export type ArchiveArticle = {
    id: string;
    href: string;
    title: string;
    summary: string;
    imageUrl: string | null;
    imageAlt: string;
    publishedAt: string;
    isFeatured: boolean;
};

export async function loadEditorialArchive(
    sectionSlug: EditorialSectionSlug
): Promise<ArchiveArticle[]> {
    if (!hasPotomacSupabasePublicConfig()) return [];

    const supabase = await createClient();
    const { data: tag, error: tagError } = await supabase
        .from("editorial_tags")
        .select("id")
        .eq("slug", sectionSlug)
        .maybeSingle();
    if (tagError || !tag) return [];

    const { data: articleTags, error: articleTagError } = await supabase
        .from("editorial_article_tags")
        .select("article_id")
        .eq("tag_id", tag.id);
    if (articleTagError || !articleTags?.length) return [];

    const { data, error } = await supabase
        .from("editorial_articles")
        .select("id,slug,title,public_summary,dek,hero_image_url,hero_image_alt,published_at,carousel_position")
        .in("id", articleTags.map((articleTag) => articleTag.article_id))
        .eq("status", "published")
        .not("primary_author_id", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(250);
    if (error) throw new Error(error.message);

    return (data ?? []).map((article) => ({
        id: article.id,
        href: `/news/${article.slug}`,
        title: article.title,
        summary:
            article.public_summary
            ?? article.dek
            ?? "Published Cabeus Explorer intelligence.",
        imageUrl: article.hero_image_url,
        imageAlt: article.hero_image_alt ?? "",
        publishedAt: article.published_at,
        isFeatured: article.carousel_position !== null,
    }));
}
