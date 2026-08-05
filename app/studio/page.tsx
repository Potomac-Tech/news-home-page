import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireEditorialStaff } from "../../lib/auth/editorial";
import {
    type EditorialSectionSlug,
    editorialSections,
} from "../../lib/editorial/section-tags";
import { EditorialStudio, type StudioArticle } from "./EditorialStudio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Editorial Studio",
    robots: { index: false, follow: false },
};

type ArticleRow = {
    id: string;
    slug: string;
    status: string;
    access_tier_required: string;
    title: string;
    primary_author_id: string | null;
    public_summary: string;
    public_teaser_markdown: string;
    intro_markdown: string | null;
    seo_title: string | null;
    seo_description: string | null;
    aeo_summary: string | null;
    hero_image_url: string | null;
    scheduled_for: string | null;
    published_at: string | null;
    updated_at: string;
};

function localDateTime(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function StudioPage({
    searchParams,
}: {
    searchParams: Promise<{ article?: string; new?: string }>;
}) {
    const {
        article: selectedArticleId,
        new: newStory,
    } = await searchParams;

    if (!selectedArticleId && newStory !== "1") {
        redirect("/studio/dashboard");
    }

    const { supabase } = await requireEditorialStaff("/studio");
    const { data: articleRows, error: articleError } = await supabase
        .from("editorial_articles")
        .select("id,slug,status,access_tier_required,title,primary_author_id,public_summary,public_teaser_markdown,intro_markdown,seo_title,seo_description,aeo_summary,hero_image_url,scheduled_for,published_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);

    if (articleError) throw new Error(articleError.message);

    const rows = (articleRows ?? []) as ArticleRow[];
    const ids = rows.map((row) => row.id);
    const authorIds = Array.from(
        new Set(rows.map((row) => row.primary_author_id).filter((id): id is string => Boolean(id)))
    );
    const [
        bodiesResult,
        documentsResult,
        authorsResult,
        mediaResult,
        articleTagsResult,
        sectionTagsResult,
    ] = ids.length
        ? await Promise.all([
            supabase.from("editorial_article_bodies").select("article_id,body_markdown,body_excerpt").in("article_id", ids),
            supabase.from("editorial_source_documents").select("id,article_id,original_file_name,size_bytes,created_at").in("article_id", ids).order("created_at", { ascending: false }),
            authorIds.length
                ? supabase.from("editorial_authors").select("id,display_name").in("id", authorIds)
                : Promise.resolve({ data: [], error: null }),
            supabase.from("editorial_media_assets").select("id,article_id,public_url,media_type,hosting_provider,source_url,alt_text,caption").in("article_id", ids).order("sort_order"),
            supabase.from("editorial_article_tags").select("article_id,tag_id").in("article_id", ids),
            supabase.from("editorial_tags").select("id,slug").in(
                "slug",
                editorialSections.map((section) => section.slug)
            ),
        ])
        : [
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
        ];

    if (bodiesResult.error) throw new Error(bodiesResult.error.message);
    if (documentsResult.error) throw new Error(documentsResult.error.message);
    if (authorsResult.error) throw new Error(authorsResult.error.message);
    if (mediaResult.error) throw new Error(mediaResult.error.message);
    if (articleTagsResult.error) throw new Error(articleTagsResult.error.message);
    if (sectionTagsResult.error) throw new Error(sectionTagsResult.error.message);

    const bodyByArticle = new Map(
        (bodiesResult.data ?? []).map((body) => [body.article_id, body])
    );
    const authorById = new Map(
        (authorsResult.data ?? []).map((author) => [author.id, author.display_name])
    );
    const documentsByArticle = new Map<string, StudioArticle["sourceDocuments"]>();
    const mediaByArticle = new Map<string, StudioArticle["mediaAssets"]>();
    const sectionSlugById = new Map(
        (sectionTagsResult.data ?? []).map((tag) => [tag.id, tag.slug])
    );
    const sectionsByArticle = new Map<string, EditorialSectionSlug[]>();
    for (const articleTag of articleTagsResult.data ?? []) {
        const slug = sectionSlugById.get(articleTag.tag_id);
        if (
            !slug
            || !editorialSections.some((section) => section.slug === slug)
        ) continue;
        const sections = sectionsByArticle.get(articleTag.article_id) ?? [];
        sections.push(slug as EditorialSectionSlug);
        sectionsByArticle.set(articleTag.article_id, sections);
    }
    for (const document of documentsResult.data ?? []) {
        const list = documentsByArticle.get(document.article_id) ?? [];
        list.push({
            id: document.id,
            fileName: document.original_file_name,
            sizeBytes: Number(document.size_bytes),
            createdAt: document.created_at,
        });
        documentsByArticle.set(document.article_id, list);
    }
    for (const asset of mediaResult.data ?? []) {
        const list = mediaByArticle.get(asset.article_id) ?? [];
        list.push({
            id: asset.id,
            publicUrl: asset.public_url,
            mediaType: asset.media_type,
            hostingProvider: asset.hosting_provider,
            sourceUrl: asset.source_url ?? asset.public_url,
            altText: asset.alt_text ?? "",
            caption: asset.caption ?? "",
        });
        mediaByArticle.set(asset.article_id, list);
    }

    const articles: StudioArticle[] = rows.map((row) => {
        const body = bodyByArticle.get(row.id);
        return {
            id: row.id,
            slug: row.slug,
            status: row.status,
            accessTier: row.access_tier_required,
            title: row.title,
            authorName: row.primary_author_id
                ? authorById.get(row.primary_author_id) ?? ""
                : "",
            publicSummary: row.public_summary,
            publicTeaser: row.public_teaser_markdown,
            intro: row.intro_markdown ?? "",
            body: body?.body_markdown ?? "",
            bodyExcerpt: body?.body_excerpt ?? "",
            seoTitle: row.seo_title ?? "",
            seoDescription: row.seo_description ?? "",
            aeoSummary: row.aeo_summary ?? "",
            heroImageUrl: row.hero_image_url ?? "",
            publishAt: localDateTime(row.scheduled_for ?? row.published_at),
            updatedAt: row.updated_at,
            sectionTags: sectionsByArticle.get(row.id) ?? ["news"],
            sourceDocuments: documentsByArticle.get(row.id) ?? [],
            mediaAssets: mediaByArticle.get(row.id) ?? [],
        };
    });

    if (selectedArticleId) {
        articles.sort((left, right) =>
            left.id === selectedArticleId ? -1 : right.id === selectedArticleId ? 1 : 0
        );
    }

    return <EditorialStudio articles={articles} startNew={newStory === "1"} />;
}
