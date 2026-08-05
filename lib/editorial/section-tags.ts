import type { requireEditorialStaff } from "../auth/editorial";

type EditorialSupabaseClient = Awaited<
    ReturnType<typeof requireEditorialStaff>
>["supabase"];

export const editorialSections = [
    { slug: "news", label: "News" },
    { slug: "space-investment-forum", label: "Space Investment Forum" },
    { slug: "space-industrialist-week", label: "Space Industrialist Week" },
    { slug: "cabeus-games", label: "Cabeus Games" },
] as const;

export type EditorialSectionSlug = (typeof editorialSections)[number]["slug"];

const allowedSlugs = new Set<string>(
    editorialSections.map((section) => section.slug)
);

export function sectionTagsFrom(formData: FormData): EditorialSectionSlug[] {
    const values = Array.from(
        new Set(
            formData
                .getAll("section_tags")
                .map((value) => String(value).trim())
                .filter(Boolean)
        )
    );
    const tags = values.length ? values : ["news"];

    if (tags.some((tag) => !allowedSlugs.has(tag))) {
        throw new Error("Invalid article section.");
    }

    return tags as EditorialSectionSlug[];
}

export async function syncArticleSectionTags({
    supabase,
    articleId,
    sectionSlugs,
}: {
    supabase: EditorialSupabaseClient;
    articleId: string;
    sectionSlugs: EditorialSectionSlug[];
}) {
    const { data: tagRows, error: tagError } = await supabase
        .from("editorial_tags")
        .select("id,slug")
        .in(
            "slug",
            editorialSections.map((section) => section.slug)
        );
    if (tagError) throw new Error(tagError.message);

    const tagBySlug = new Map(
        (tagRows ?? []).map((tag) => [tag.slug, tag.id])
    );
    if (
        editorialSections.some((section) => !tagBySlug.has(section.slug))
    ) {
        throw new Error("Editorial section tags are not configured.");
    }

    const canonicalTagIds = editorialSections.map(
        (section) => tagBySlug.get(section.slug)!
    );
    const { error: deleteError } = await supabase
        .from("editorial_article_tags")
        .delete()
        .eq("article_id", articleId)
        .in("tag_id", canonicalTagIds);
    if (deleteError) throw new Error(deleteError.message);

    const { error: insertError } = await supabase
        .from("editorial_article_tags")
        .insert(
            sectionSlugs.map((slug) => ({
                article_id: articleId,
                tag_id: tagBySlug.get(slug)!,
            }))
        );
    if (insertError) throw new Error(insertError.message);
}
