import type { Metadata } from "next";
import { requireEditorialStaff } from "../../lib/auth/editorial";
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
    public_summary: string;
    public_teaser_markdown: string;
    intro_markdown: string | null;
    seo_title: string | null;
    seo_description: string | null;
    aeo_summary: string | null;
    updated_at: string;
};

export default async function StudioPage() {
    const { supabase } = await requireEditorialStaff("/studio");
    const { data: articleRows, error: articleError } = await supabase
        .from("editorial_articles")
        .select("id,slug,status,access_tier_required,title,public_summary,public_teaser_markdown,intro_markdown,seo_title,seo_description,aeo_summary,updated_at")
        .order("updated_at", { ascending: false });

    if (articleError) throw new Error(articleError.message);

    const rows = (articleRows ?? []) as ArticleRow[];
    const ids = rows.map((row) => row.id);
    const [bodiesResult, documentsResult] = ids.length
        ? await Promise.all([
            supabase.from("editorial_article_bodies").select("article_id,body_markdown,body_excerpt").in("article_id", ids),
            supabase.from("editorial_source_documents").select("id,article_id,original_file_name,size_bytes,created_at").in("article_id", ids).order("created_at", { ascending: false }),
        ])
        : [{ data: [], error: null }, { data: [], error: null }];

    if (bodiesResult.error) throw new Error(bodiesResult.error.message);
    if (documentsResult.error) throw new Error(documentsResult.error.message);

    const bodyByArticle = new Map(
        (bodiesResult.data ?? []).map((body) => [body.article_id, body])
    );
    const documentsByArticle = new Map<string, StudioArticle["sourceDocuments"]>();
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

    const articles: StudioArticle[] = rows.map((row) => {
        const body = bodyByArticle.get(row.id);
        return {
            id: row.id,
            slug: row.slug,
            status: row.status,
            accessTier: row.access_tier_required,
            title: row.title,
            publicSummary: row.public_summary,
            publicTeaser: row.public_teaser_markdown,
            intro: row.intro_markdown ?? "",
            body: body?.body_markdown ?? "",
            bodyExcerpt: body?.body_excerpt ?? "",
            seoTitle: row.seo_title ?? "",
            seoDescription: row.seo_description ?? "",
            aeoSummary: row.aeo_summary ?? "",
            updatedAt: row.updated_at,
            sourceDocuments: documentsByArticle.get(row.id) ?? [],
        };
    });

    return <EditorialStudio articles={articles} />;
}
