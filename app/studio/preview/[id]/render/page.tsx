import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditorialStaff } from "../../../../../lib/auth/editorial";
import { renderArticleHtml } from "../../../../../lib/editorial/rich-text";

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
    const heroAsset = article.hero_image_url
        ? media?.find((asset) => asset.public_url === article.hero_image_url)
        : media?.find((asset) => asset.media_type === "image");
    const hero = article.hero_image_url ?? heroAsset?.public_url;

    return (
        <article className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <header className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr]">
                    <div>
                        <span className="brand-kicker">Cabeus Explorer preview</span>
                        <h1 className="mt-5 font-serif text-4xl font-medium leading-tight text-cabeus-ink md:text-6xl">{article.title}</h1>
                        <p className="mt-5 text-lg leading-8 text-cabeus-muted">{article.dek ?? article.public_summary}</p>
                        <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs font-bold uppercase text-cabeus-muted">
                            {author ? (
                                <Link
                                    href={`/authors/${author.slug}`}
                                    className="text-cabeus-bronze underline decoration-cabeus-gold/60 underline-offset-4 hover:text-cabeus-ink"
                                >
                                    By {author.display_name}
                                </Link>
                            ) : <span>Byline not set</span>}
                            <time>{new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                        </div>
                    </div>
                    {hero ? (
                        <figure>
                            <img
                                src={hero}
                                alt={article.hero_image_alt ?? heroAsset?.alt_text ?? "Story image"}
                                className="max-h-[34rem] w-full border border-cabeus-line bg-cabeus-smoke object-contain object-top"
                            />
                            {heroAsset?.caption ? (
                                <figcaption className="mt-3 text-sm leading-6 text-cabeus-muted">
                                    {heroAsset.caption}
                                </figcaption>
                            ) : null}
                        </figure>
                    ) : null}
                </div>
            </header>
            <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
                <section>
                    <p className="brand-kicker">Member full story</p>
                    <div
                        className="article-rich-text mt-6 text-lg leading-8 text-cabeus-ink/85"
                        dangerouslySetInnerHTML={{
                            __html: renderArticleHtml(bodyHtml),
                        }}
                    />
                </section>
            </div>
        </article>
    );
}
