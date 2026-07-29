import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditorialStaff } from "../../../../../lib/auth/editorial";
import { renderArticleHtml } from "../../../../../lib/editorial/rich-text";
import { EditorialVideo } from "../../../../_components/EditorialVideo";

export default async function PreviewRenderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase } = await requireEditorialStaff(`/studio/preview/${id}`);
    const { data: article } = await supabase
        .from("editorial_articles")
        .select("id,title,slug,dek,public_summary,public_teaser_markdown,intro_markdown,primary_author_id,hero_image_url,hero_image_alt,scheduled_for,published_at")
        .eq("id", id)
        .maybeSingle();
    if (!article) notFound();
    const [{ data: body }, { data: author }, { data: media }] = await Promise.all([
        supabase.from("editorial_article_bodies").select("body_markdown").eq("article_id", id).maybeSingle(),
        article.primary_author_id
            ? supabase.from("editorial_authors").select("display_name,slug").eq("id", article.primary_author_id).maybeSingle()
            : Promise.resolve({ data: null }),
        supabase.from("editorial_media_assets").select("id,public_url,media_type,hosting_provider,source_url,alt_text,caption").eq("article_id", id).order("sort_order"),
    ]);
    const date = article.scheduled_for ?? article.published_at ?? new Date().toISOString();
    const bodyHtml = String(body?.body_markdown ?? "");
    const inlineMediaIds = new Set(
        Array.from(bodyHtml.matchAll(/data-media-id="([^"]+)"/g))
            .map((match) => match[1])
    );
    const heroAsset = article.hero_image_url
        ? media?.find((asset) => asset.public_url === article.hero_image_url)
        : media?.find((asset) => asset.media_type === "image");
    const hero = article.hero_image_url ?? heroAsset?.public_url;

    return (
        <article className="min-h-screen bg-potomac-primary text-potomac-cream">
            <header className="border-b border-white/10">
                <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr]">
                    <div>
                        <span className="text-xs font-bold uppercase text-potomac-gold">Cabeus Explorer preview</span>
                        <h1 className="mt-5 font-serif text-4xl leading-tight text-white md:text-6xl">{article.title}</h1>
                        <p className="mt-5 text-lg leading-8 text-potomac-cream/80">{article.dek ?? article.public_summary}</p>
                        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold uppercase text-potomac-cream/50">
                            {author ? <Link href={`/authors/${author.slug}`}>By {author.display_name}</Link> : <span>Byline not set</span>}
                            <time>{new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                        </div>
                    </div>
                    {hero ? (
                        <figure>
                            <img
                                src={hero}
                                alt={article.hero_image_alt ?? heroAsset?.alt_text ?? "Story image"}
                                className="max-h-[34rem] w-full border border-white/10 bg-black object-contain object-top"
                            />
                            {heroAsset?.caption ? (
                                <figcaption className="mt-3 text-sm leading-6 text-potomac-cream/60">
                                    {heroAsset.caption}
                                </figcaption>
                            ) : null}
                        </figure>
                    ) : null}
                </div>
            </header>
            <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
                <section>
                    <p className="text-xs font-bold uppercase text-potomac-gold">Member full story</p>
                    <div
                        className="article-rich-text mt-6 text-lg leading-8 text-potomac-cream/85"
                        dangerouslySetInnerHTML={{
                            __html: renderArticleHtml(bodyHtml),
                        }}
                    />
                </section>
                {(media ?? []).filter((asset) =>
                    asset.media_type === "video" && !inlineMediaIds.has(asset.id)
                ).map((asset) => (
                    <figure key={asset.id} className="border border-white/10 p-3">
                        <EditorialVideo
                            publicUrl={asset.public_url}
                            hostingProvider={asset.hosting_provider as "supabase" | "youtube"}
                            title={asset.alt_text ?? "Article video"}
                        />
                        {asset.caption ? <figcaption className="mt-3 text-sm text-potomac-regolith">{asset.caption}</figcaption> : null}
                    </figure>
                ))}
            </div>
        </article>
    );
}
