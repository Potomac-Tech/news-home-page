"use server";

import { revalidatePath } from "next/cache";
import { requireEditorialStaff } from "../../../lib/auth/editorial";

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

const accessTiers = ["member", "scout", "command"] as const;

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
    const value = String(formData.get("access_tier_required") ?? "member");

    if (!accessTiers.includes(value as (typeof accessTiers)[number])) {
        throw new Error("Invalid access tier.");
    }

    return value;
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
    const { supabase, userId } = await requireEditorialStaff();
    const bodyMarkdown = getRequiredString(formData, "body_markdown");

    const { data: article, error: articleError } = await supabase
        .from("editorial_articles")
        .insert({
            slug: getRequiredString(formData, "slug"),
            title: getRequiredString(formData, "title"),
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

    await createVersion(
        supabase,
        article as ArticleSnapshot,
        bodyMarkdown,
        userId,
        "Draft created."
    );

    revalidatePath("/admin/editorial");
}

export async function updateArticleDraft(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff();
    const articleId = getRequiredString(formData, "article_id");
    const bodyMarkdown = getRequiredString(formData, "body_markdown");

    const { data: article, error: articleError } = await supabase
        .from("editorial_articles")
        .update({
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
        })
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

    await createVersion(
        supabase,
        article as ArticleSnapshot,
        bodyMarkdown,
        userId,
        "Draft updated."
    );

    revalidatePath("/admin/editorial");
}

export async function publishArticle(formData: FormData) {
    const { supabase, userId } = await requireEditorialStaff();
    const articleId = getRequiredString(formData, "article_id");

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
    revalidatePath("/news");
}
