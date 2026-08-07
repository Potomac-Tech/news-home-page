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
    authorName: string;
    authorSlug: string | null;
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
        .select("id,slug,title,public_summary,dek,hero_image_url,hero_thumbnail_url,hero_image_alt,published_at,carousel_position,primary_author_id")
        .in("id", articleTags.map((articleTag) => articleTag.article_id))
        .eq("status", "published")
        .not("primary_author_id", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(250);
    if (error) throw new Error(error.message);

    const authorIds = Array.from(new Set(
        (data ?? [])
            .map((article) => article.primary_author_id)
            .filter((id): id is string => Boolean(id))
    ));
    const { data: authors, error: authorsError } = authorIds.length
        ? await supabase
            .from("editorial_authors")
            .select("id,display_name,slug")
            .in("id", authorIds)
            .eq("is_active", true)
        : { data: [], error: null };
    if (authorsError) throw new Error(authorsError.message);
    const authorsById = new Map(
        (authors ?? []).map((author) => [author.id, author])
    );

    return (data ?? []).map((article) => {
        const author = authorsById.get(article.primary_author_id!);
        return {
            id: article.id,
            href: `/news/${article.slug}`,
            title: article.title,
            summary:
                article.public_summary
                ?? article.dek
                ?? "Published Cabeus Explorer intelligence.",
            imageUrl: article.hero_thumbnail_url ?? article.hero_image_url,
            imageAlt: article.hero_image_alt ?? "",
            publishedAt: article.published_at,
            isFeatured: article.carousel_position !== null,
            authorName: author?.display_name ?? "Cabeus Explorer",
            authorSlug: author?.slug ?? null,
        };
    });
}
