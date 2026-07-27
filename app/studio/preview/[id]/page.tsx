import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireEditorialStaff } from "../../../../lib/auth/editorial";
import { DevicePreview } from "./DevicePreview";
import { PreviewActions } from "./PreviewActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Article preview", robots: { index: false, follow: false } };

function localDateTime(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { supabase } = await requireEditorialStaff(`/studio/preview/${id}`);
    const [{ data: article }, { data: approval }] = await Promise.all([
        supabase.from("editorial_articles").select("id,title,status,updated_at,scheduled_for").eq("id", id).maybeSingle(),
        supabase.from("editorial_preview_approvals").select("article_updated_at,previewed_at").eq("article_id", id).maybeSingle(),
    ]);
    if (!article) notFound();
    const approved = approval?.article_updated_at === article.updated_at;

    return (
        <main className="min-h-screen bg-potomac-primary px-4 py-8 text-potomac-cream md:px-8">
            <div className="mx-auto max-w-[96rem]">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-potomac-regolith/25 pb-5">
                    <div>
                        <Link href="/studio" className="font-mono text-xs font-bold uppercase text-potomac-gold">Back to editor</Link>
                        <h1 className="mt-3 font-serif text-3xl uppercase text-white">{article.title}</h1>
                        <p className="mt-2 font-mono text-xs uppercase text-potomac-regolith">
                            {article.status} · {approved ? "current revision approved" : "approval required"}
                        </p>
                    </div>
                    <Link href="/studio/dashboard" className="border border-potomac-regolith/35 px-4 py-3 font-mono text-xs font-bold uppercase text-potomac-cream">Article dashboard</Link>
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                    <DevicePreview articleId={id} />
                    <PreviewActions articleId={id} approved={approved} initialSchedule={localDateTime(article.scheduled_for)} />
                </div>
            </div>
        </main>
    );
}
