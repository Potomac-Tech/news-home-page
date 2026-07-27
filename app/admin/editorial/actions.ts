"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import {
    sourceDocumentFrom,
    storeSourceDocument,
} from "../../../lib/editorial/source-documents";
import {
    mediaFilesFrom,
    storeMediaAssets,
} from "../../../lib/editorial/media-assets";

type EditorialSupabaseClient = Awaited<
    ReturnType<typeof requireEditorialStaff>
>["supabase"];

type ArticleSnapshot = {
    id: string;
    status: string;
    slug: string;
    title: string;
    public_summary: string;
    public_teaser_markdown: string;
    seo_title: string | null;
    seo_description: string | null;
    aeo_summary: string | null;
};

const accessTiers = ["explorer", "scout", "meridian"] as const;

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function getOptionalString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    return value || null;
}

function getAccessTier(formData: FormData) {
    const value = String(formData.get("access_tier_required") ?? "explorer");

    if (!accessTiers.includes(value as (typeof accessTiers)[number])) {
        throw new Error("Invalid access tier.");
    }

    return value;
}

function authorSlug(value: string) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

async function resolvePrimaryAuthorId(
    supabase: EditorialSupabaseClient,
    formData: FormData
) {
    if (!formData.has("author_name")) {
        return undefined;
    }

    const displayName = String(formData.get("author_name") ?? "").trim();
    if (!displayName) {
        return null;
    }

    const slug = authorSlug(displayName);
    if (!slug) {
        throw new Error("Author name must contain letters or numbers.");
    }

    const { data: existing, error: existingError } = await supabase
        .from("editorial_authors")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }
    if (existing?.id) {
        return existing.id as string;
    }

    const { data: author, error: authorError } = await supabase
        .from("editorial_authors")
        .insert({ display_name: displayName, slug })
        .select("id")
        .single();

    if (authorError || !author?.id) {
        throw new Error(authorError?.message ?? "Author not created.");
    }

    return author.id as string;
}

function editorialNextPath(formData: FormData) {
    return formData.get("studio_context") === "studio"
        ? "/studio"
        : "/admin/editorial";
}

async function createVersion(
    supabase: EditorialSupabaseClient,
    article: ArticleSnapshot,
    gatedBodyMarkdown: string | null,
    userId: string,
    changeNote: string
) {
    const { data: latestVersion, error: latestVersionError } = await supabase
        .from("editorial_article_versions")
        .select("version_number")
        .eq("article_id", article.id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestVersionError) {
        throw new Error(latestVersionError.message);
    }

    const versionNumber =
        Number(latestVersion?.version_number ?? 0) + 1;

    const { error: versionError } = await supabase
        .from("editorial_article_versions")
        .insert({
            article_id: article.id,
            version_number: versionNumber,
            status: article.status,
            slug: article.slug,
            title: article.title,
            public_summary: article.public_summary,
            public_teaser_markdown: article.public_teaser_markdown,
            gated_body_markdown: gatedBodyMarkdown,
            seo_metadata: {
                title: article.seo_title,
                description: article.seo_description,
            },
            aeo_metadata: {
                summary: article.aeo_summary,
            },
            created_by: userId,
            change_note: changeNote,
        });

    if (versionError) {
        throw new Error(versionError.message);
    }
}

export async function createArticleDraft(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff(
        editorialNextPath(formData)
    );
    const bodyMarkdown = getRequiredString(formData, "body_markdown");
    const sourceDocument = sourceDocumentFrom(formData);
    const mediaFiles = mediaFilesFrom(formData);
    const primaryAuthorId = await resolvePrimaryAuthorId(supabase, formData);

    const { data: article, error: articleError } = await supabase
        .from("editorial_articles")
        .insert({
            slug: getRequiredString(formData, "slug"),
            title: getRequiredString(formData, "title"),
            primary_author_id: primaryAuthorId ?? null,
            status: "draft",
            access_tier_required: getAccessTier(formData),
            public_summary: getRequiredString(formData, "public_summary"),
            public_teaser_markdown: getRequiredString(
                formData,
                "public_teaser_markdown"
            ),
            intro_markdown: getOptionalString(formData, "intro_markdown"),
            seo_title: getOptionalString(formData, "seo_title"),
            seo_description: getOptionalString(formData, "seo_description"),
            aeo_summary: getOptionalString(formData, "aeo_summary"),
            created_by: userId,
            updated_by: userId,
        })
        .select(
            "id,status,slug,title,public_summary,public_teaser_markdown,seo_title,seo_description,aeo_summary"
        )
        .single();

    if (articleError || !article) {
        throw new Error(articleError?.message ?? "Article not created.");
    }

    const { error: bodyError } = await supabase
        .from("editorial_article_bodies")
        .insert({
            article_id: article.id,
            body_markdown: bodyMarkdown,
            body_excerpt: getOptionalString(formData, "body_excerpt"),
            updated_by: userId,
        });

    if (bodyError) {
        throw new Error(bodyError.message);
    }

    if (sourceDocument) {
        await storeSourceDocument({
            supabase,
            userId,
            articleId: article.id,
            file: sourceDocument,
        });
    }

    if (mediaFiles.length) {
        await storeMediaAssets({
            supabase,
            userId,
            articleId: article.id,
            files: mediaFiles,
            altText: getOptionalString(formData, "media_alt_text"),
            caption: getOptionalString(formData, "media_caption"),
        });
    }

    await createVersion(
        supabase,
        article as ArticleSnapshot,
        bodyMarkdown,
        userId,
        "Draft created."
    );

    revalidatePath("/admin/editorial");
    revalidatePath("/studio");
    return article.id;
}

export async function updateArticleDraft(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff(
        editorialNextPath(formData)
    );
    const articleId = getRequiredString(formData, "article_id");
    const bodyMarkdown = getRequiredString(formData, "body_markdown");
    const sourceDocument = sourceDocumentFrom(formData);
    const mediaFiles = mediaFilesFrom(formData);
    const primaryAuthorId = await resolvePrimaryAuthorId(supabase, formData);
    const articleUpdates: Record<string, string | null> = {
        slug: getRequiredString(formData, "slug"),
        title: getRequiredString(formData, "title"),
        access_tier_required: getAccessTier(formData),
        public_summary: getRequiredString(formData, "public_summary"),
        public_teaser_markdown: getRequiredString(
            formData,
            "public_teaser_markdown"
        ),
        intro_markdown: getOptionalString(formData, "intro_markdown"),
        seo_title: getOptionalString(formData, "seo_title"),
        seo_description: getOptionalString(formData, "seo_description"),
        aeo_summary: getOptionalString(formData, "aeo_summary"),
        updated_by: userId,
    };

    if (primaryAuthorId !== undefined) {
        articleUpdates.primary_author_id = primaryAuthorId;
    }

    const { data: article, error: articleError } = await supabase
        .from("editorial_articles")
        .update(articleUpdates)
        .eq("id", articleId)
        .select(
            "id,status,slug,title,public_summary,public_teaser_markdown,seo_title,seo_description,aeo_summary"
        )
        .single();

    if (articleError || !article) {
        throw new Error(articleError?.message ?? "Article not updated.");
    }

    const { error: bodyError } = await supabase
        .from("editorial_article_bodies")
        .upsert(
            {
                article_id: article.id,
                body_markdown: bodyMarkdown,
                body_excerpt: getOptionalString(formData, "body_excerpt"),
                updated_by: userId,
            },
            { onConflict: "article_id" }
        );

    if (bodyError) {
        throw new Error(bodyError.message);
    }

    if (sourceDocument) {
        await storeSourceDocument({
            supabase,
            userId,
            articleId: article.id,
            file: sourceDocument,
        });
    }

    if (mediaFiles.length) {
        await storeMediaAssets({
            supabase,
            userId,
            articleId: article.id,
            files: mediaFiles,
            altText: getOptionalString(formData, "media_alt_text"),
            caption: getOptionalString(formData, "media_caption"),
        });
    }

    const { error: previewResetError } = await supabase
        .from("editorial_preview_approvals")
        .delete()
        .eq("article_id", article.id);
    if (previewResetError) {
        throw new Error(previewResetError.message);
    }

    await createVersion(
        supabase,
        article as ArticleSnapshot,
        bodyMarkdown,
        userId,
        "Draft updated."
    );

    revalidatePath("/admin/editorial");
    revalidatePath("/studio");
    return article.id;
}

export async function publishArticle(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff(
        editorialNextPath(formData)
    );
    const articleId = getRequiredString(formData, "article_id");

    const { data: currentArticle, error: currentArticleError } = await supabase
        .from("editorial_articles")
        .select("updated_at")
        .eq("id", articleId)
        .single();
    if (currentArticleError || !currentArticle) {
        throw new Error(currentArticleError?.message ?? "Article not found.");
    }

    const { data: approval, error: approvalError } = await supabase
        .from("editorial_preview_approvals")
        .select("article_updated_at")
        .eq("article_id", articleId)
        .maybeSingle();
    if (approvalError) throw new Error(approvalError.message);
    if (!approval || approval.article_updated_at !== currentArticle.updated_at) {
        throw new Error("Open the device preview and approve this saved revision before publishing.");
    }

    const { data: body, error: bodyError } = await supabase
        .from("editorial_article_bodies")
        .select("body_markdown")
        .eq("article_id", articleId)
        .single();

    if (bodyError || !body?.body_markdown) {
        throw new Error(bodyError?.message ?? "Article body is required.");
    }

    const now = new Date().toISOString();
    const { data: article, error: articleError } = await supabase
        .from("editorial_articles")
        .update({
            status: "published",
            published_at: now,
            scheduled_for: null,
            updated_by: userId,
        })
        .eq("id", articleId)
        .select(
            "id,status,slug,title,public_summary,public_teaser_markdown,seo_title,seo_description,aeo_summary"
        )
        .single();

    if (articleError || !article) {
        throw new Error(articleError?.message ?? "Article not published.");
    }

    await createVersion(
        supabase,
        article as ArticleSnapshot,
        body.body_markdown,
        userId,
        "Article published."
    );

    revalidatePath("/admin/editorial");
    revalidatePath("/studio");
    revalidatePath("/news");
    return article.id;
}

export async function approveArticlePreview(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff("/studio");
    const articleId = getRequiredString(formData, "article_id");
    const { data: article, error } = await supabase
        .from("editorial_articles")
        .select("updated_at")
        .eq("id", articleId)
        .single();
    if (error || !article) throw new Error(error?.message ?? "Article not found.");

    const { error: approvalError } = await supabase
        .from("editorial_preview_approvals")
        .upsert({
            article_id: articleId,
            article_updated_at: article.updated_at,
            previewed_by: userId,
            previewed_at: new Date().toISOString(),
        });
    if (approvalError) throw new Error(approvalError.message);

    revalidatePath(`/studio/preview/${articleId}`);
    return articleId;
}

export async function scheduleArticle(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff("/studio");
    const articleId = getRequiredString(formData, "article_id");
    const scheduledFor = getRequiredString(formData, "scheduled_for");
    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        throw new Error("Publishing time must be in the future.");
    }

    const { data: article, error: articleError } = await supabase
        .from("editorial_articles")
        .select("updated_at")
        .eq("id", articleId)
        .single();
    if (articleError || !article) {
        throw new Error(articleError?.message ?? "Article not found.");
    }
    const { data: approval, error: approvalError } = await supabase
        .from("editorial_preview_approvals")
        .select("article_updated_at")
        .eq("article_id", articleId)
        .maybeSingle();
    if (approvalError) throw new Error(approvalError.message);
    if (!approval || approval.article_updated_at !== article.updated_at) {
        throw new Error("Approve the current saved revision in preview before scheduling.");
    }

    const { error: updateError } = await supabase
        .from("editorial_articles")
        .update({
            status: "scheduled",
            scheduled_for: scheduledDate.toISOString(),
            published_at: null,
            updated_by: userId,
        })
        .eq("id", articleId);
    if (updateError) throw new Error(updateError.message);

    revalidatePath("/studio");
    revalidatePath("/studio/dashboard");
    revalidatePath(`/studio/preview/${articleId}`);
    return articleId;
}
