import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditorialStaff } from "../../../../../lib/auth/editorial";

function paragraphs(value: string | null) {
    return (value ?? "").split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

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
        supabase.from("editorial_media_assets").select("id,public_url,media_type,alt_text,caption").eq("article_id", id).order("sort_order"),
    ]);
    const date = article.scheduled_for ?? article.published_at ?? new Date().toISOString();
    const hero = article.hero_image_url ?? media?.find((asset) => asset.media_type === "image")?.public_url;

    return (
        <article className="min-h-screen bg-potomac-primary text-potomac-cream">
            <header className="border-b border-white/10">
                <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr]">
                    <div>
                        <span className="text-xs font-bold uppercase text-potomac-gold">Cabeus Explorer preview</span>
                        <h1 className="mt-5 font-serif text-4xl leading-tight text-white md:text-6xl">{article.title}</h1>
                        <p className="mt-5 text-lg leading-8 text-potomac-cream/80">{article.dek ?? article.public_summary}</p>
                        <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold uppercase text-potomac-cream/50">
                            {author ? <Link href={`/authors/${author.slug}`}>By {author.display_name}</Link> : <span>By Cabeus Explorer Editorial Desk</span>}
                            <time>{new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
                        </div>
                    </div>
                    {hero ? <img src={hero} alt={article.hero_image_alt ?? "Story image"} className="h-72 w-full border border-white/10 object-cover" /> : null}
                </div>
            </header>
            <div className="mx-auto w-full max-w-4xl space-y-7 px-4 py-10 md:px-8">
                <section className="border border-white/10 p-6">
                    <p className="text-xs font-bold uppercase text-potomac-gold">Public summary</p>
                    <p className="mt-4 text-xl leading-8 text-white">{article.public_summary}</p>
                </section>
                <section className="border border-white/10 p-6">
                    {paragraphs(article.intro_markdown ?? article.public_teaser_markdown).map((item) => <p key={item} className="mb-4 leading-7 text-potomac-cream/75">{item}</p>)}
                </section>
                {(media ?? []).map((asset) => (
                    <figure key={asset.id} className="border border-white/10 p-3">
                        {asset.media_type === "video" ? <video src={asset.public_url} controls className="w-full" /> : <img src={asset.public_url} alt={asset.alt_text ?? ""} className="w-full" />}
                        {asset.caption ? <figcaption className="mt-3 text-sm text-potomac-regolith">{asset.caption}</figcaption> : null}
                    </figure>
                ))}
                <section className="border border-white/10 p-6">
                    <p className="text-xs font-bold uppercase text-potomac-gold">Member full story</p>
                    {paragraphs(body?.body_markdown ?? null).map((item) => <p key={item} className="mt-5 leading-8 text-potomac-cream/80">{item}</p>)}
                </section>
            </div>
        </article>
    );
}
