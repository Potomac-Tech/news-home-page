import type { Metadata } from "next";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import {
    createCarouselSlide,
    expireCarouselSlide,
    previewCarouselSlide,
    publishCarouselSlide,
    reorderCarouselSlide,
    unpublishCarouselSlide,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Homepage Carousel Admin" };

type Slide = {
    id: string; title: string; slide_type: string; status: string;
    display_rank: number; is_pinned: boolean; is_required: boolean;
    content_visibility: string; minimum_tier: string; scheduled_at: string | null;
    expires_at: string; freshness_at: string; cta_route: string;
};
type Article = { id: string; title: string; slug: string; published_at: string | null };

const inputClass = "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-potomac-gold";
function Label({ children }: { children: string }) { return <span className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">{children}</span>; }
function nice(value: string) { return value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }

export default async function CarouselAdminPage() {
    const { supabase } = await requireEditorialStaff("/admin/carousel");
    const [slideResult, articleResult, assetResult] = await Promise.all([
        supabase.from("homepage_carousel_slides").select("id,title,slide_type,status,display_rank,is_pinned,is_required,content_visibility,minimum_tier,scheduled_at,expires_at,freshness_at,cta_route").order("display_rank"),
        supabase.from("editorial_articles").select("id,title,slug,published_at").eq("status", "published").order("published_at", { ascending: false }),
        supabase.from("content_submissions").select("id,title").in("content_type", ["homepage_slide", "carousel_visual"]).in("status", ["approved", "published"]).not("storage_object_path", "is", null),
    ]);
    if (slideResult.error || articleResult.error || assetResult.error) {
        throw new Error(slideResult.error?.message ?? articleResult.error?.message ?? assetResult.error?.message);
    }
    const slides = (slideResult.data ?? []) as Slide[];
    const articles = (articleResult.data ?? []) as Article[];
    const assets = (assetResult.data ?? []) as Array<{ id: string; title: string }>;
    const active = slides.filter((slide) => slide.status === "published" && new Date(slide.expires_at) > new Date());
    const now = new Date();
    const expires = new Date(now.getTime() + 14 * 86_400_000);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">Editorial inventory</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
                    <h1 className="font-serif text-4xl text-white md:text-6xl">Homepage Carousel</h1>
                    <div className={`border px-4 py-2 text-sm ${active.length >= 3 && active.length <= 5 ? "border-green-400/40 text-green-200" : "border-red-400/40 text-red-200"}`}>{active.length} / 3-5 active</div>
                </div>

                <form action={createCarouselSlide} className="glass-card mt-10 p-6">
                    <h2 className="font-serif text-2xl text-white">New Slide</h2>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <label><Label>Slide type</Label><select name="slide_type" className={inputClass}><option value="anonymous_teaser">Anonymous teaser</option><option value="signed_in_editorial_story">Signed-in editorial story</option><option value="custom_intelligence_card">Custom intelligence card</option><option value="paid_tier_teaser">Paid-tier teaser</option></select></label>
                        <label><Label>Selection</Label><select name="selection_mode" className={inputClass}><option value="manual">Manual</option><option value="auto_latest">Auto latest CMS story</option></select></label>
                        <label><Label>CMS article</Label><select name="article_id" className={inputClass} defaultValue=""><option value="">No article</option>{articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</select></label>
                        <label><Label>Rank</Label><input required name="display_rank" type="number" min="0" defaultValue="100" className={inputClass} /></label>
                        <label><Label>Title</Label><input required name="title" className={inputClass} /></label>
                        <label><Label>CTA label</Label><input required name="cta_label" defaultValue="Read the brief" className={inputClass} /></label>
                        <label className="md:col-span-2"><Label>Summary</Label><textarea required minLength={20} maxLength={600} name="summary" rows={4} className={inputClass} /></label>
                        <label><Label>Visibility</Label><select name="content_visibility" className={inputClass}><option value="public_teaser">Public teaser</option><option value="member_only">Member only</option></select></label>
                        <label><Label>Audience</Label><select name="audience_mode" className={inputClass}><option value="anonymous">Anonymous</option><option value="verified_member">Verified member</option></select></label>
                        <label><Label>Minimum tier</Label><select name="minimum_tier" className={inputClass}><option value="public">Public</option><option value="member">Explorer</option><option value="scout">Scout</option><option value="command">Cabeus Council</option></select></label>
                        <label><Label>Visual asset URL</Label><input required list="carousel-assets" name="visual_asset_url" className={inputClass} /><datalist id="carousel-assets">{assets.map((asset) => <option key={asset.id} value={`/api/content-assets/${asset.id}`}>{asset.title}</option>)}</datalist></label>
                        <label><Label>Visual alt text</Label><input required minLength={12} name="visual_asset_alt" className={inputClass} /></label>
                        <label><Label>CTA route</Label><input required name="cta_route" className={inputClass} /></label>
                        <label><Label>Citation URL</Label><input required type="url" name="citation_url" className={inputClass} /></label>
                        <label><Label>Source note</Label><input required minLength={10} name="source_note" className={inputClass} /></label>
                        <label><Label>Freshness</Label><input required type="datetime-local" name="freshness_at" defaultValue={now.toISOString().slice(0, 16)} className={inputClass} /></label>
                        <label><Label>Schedule</Label><input type="datetime-local" name="scheduled_at" className={inputClass} /></label>
                        <label><Label>Expiration</Label><input required type="datetime-local" name="expires_at" defaultValue={expires.toISOString().slice(0, 16)} className={inputClass} /></label>
                        <label className="flex items-center gap-3 text-sm text-potomac-cream/75"><input type="checkbox" name="is_pinned" className="h-4 w-4 accent-potomac-gold" />Pinned</label>
                        <label className="flex items-center gap-3 text-sm text-potomac-cream/75"><input type="checkbox" name="is_required" className="h-4 w-4 accent-potomac-gold" />Required slide</label>
                    </div>
                    <button className="mt-6 bg-potomac-gold px-6 py-3 text-xs font-bold uppercase text-potomac-primary">Create draft</button>
                </form>

                <div className="mt-10 space-y-4">
                    {slides.map((slide) => (
                        <article key={slide.id} className="glass-card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-potomac-gold">{nice(slide.slide_type)} · {nice(slide.status)}</p><h2 className="mt-2 font-serif text-2xl text-white">{slide.title}</h2></div><p className="text-xs text-potomac-cream/50">Rank {slide.display_rank} · expires {new Date(slide.expires_at).toLocaleString()}</p></div>
                            <div className="mt-5 flex flex-wrap gap-3">
                                {slide.status === "draft" ? <form action={previewCarouselSlide}><input type="hidden" name="slide_id" value={slide.id} /><button className="border border-white/20 px-4 py-2 text-xs uppercase text-white">Preview</button></form> : null}
                                {["draft", "preview", "unpublished"].includes(slide.status) ? <form action={publishCarouselSlide}><input type="hidden" name="slide_id" value={slide.id} /><button className="bg-potomac-gold px-4 py-2 text-xs font-bold uppercase text-potomac-primary">Publish</button></form> : null}
                                {slide.status === "published" ? <form action={unpublishCarouselSlide}><input type="hidden" name="slide_id" value={slide.id} /><button className="border border-white/20 px-4 py-2 text-xs uppercase text-white">Unpublish</button></form> : null}
                                {!['expired'].includes(slide.status) ? <form action={expireCarouselSlide}><input type="hidden" name="slide_id" value={slide.id} /><button className="border border-red-400/40 px-4 py-2 text-xs uppercase text-red-200">Expire</button></form> : null}
                                <form action={reorderCarouselSlide} className="flex gap-2"><input type="hidden" name="slide_id" value={slide.id} /><input aria-label={`${slide.title} rank`} name="display_rank" type="number" min="0" defaultValue={slide.display_rank} className="w-24 border border-white/15 bg-black/30 px-3 text-white" /><button className="border border-potomac-gold/50 px-4 py-2 text-xs uppercase text-potomac-gold">Set rank</button></form>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
