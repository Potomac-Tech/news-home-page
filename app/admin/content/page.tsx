import type { Metadata } from "next";
import { requireEditorialStaff } from "../../../lib/auth/editorial";
import {
    approveContentSubmission,
    createContentSubmission,
    importProductionContent,
    publishContentSubmission,
    rejectContentSubmission,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Content Readiness Admin" };

type Submission = {
    id: string;
    content_type: string;
    title: string;
    body_copy: string;
    destination_url: string | null;
    citation_urls: string[];
    source_note: string;
    content_origin: string;
    copy_owner_confirmed: boolean;
    storage_object_path: string | null;
    asset_alt_text: string | null;
    status: string;
    readiness_issues: string[];
    scheduled_at: string | null;
    expires_at: string;
    approved_at: string | null;
    published_at: string | null;
    created_at: string;
};

type ImportItem = {
    id: string;
    record_key: string;
    content_type: string;
    import_status: string;
    blockers: string[];
};

type ImportBatch = {
    id: string;
    file_name: string;
    status: string;
    total_records: number;
    accepted_records: number;
    blocked_records: number;
    imported_at: string;
    production_content_import_items: ImportItem[];
};

const inputClass = "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-potomac-gold";
const types = [
    ["homepage_slide", "Homepage slide"], ["carousel_visual", "Carousel visual"],
    ["tracker_row", "Tracker row"], ["source_citation", "Source citation"],
    ["house_ad", "House ad"], ["pathfinder_cta", "Pathfinder CTA"],
    ["source_cta", "Source CTA"], ["contract_award", "Space/lunar contract award"],
    ["public_empty_state", "Public empty state"],
];

function label(value: string) {
    return value.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function Field({ name, title, required = false, type = "text" }: { name: string; title: string; required?: boolean; type?: string }) {
    return <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">{title}<input name={name} required={required} type={type} className={inputClass} /></label>;
}

export default async function ContentReadinessAdminPage() {
    const { supabase } = await requireEditorialStaff("/admin/content");
    const [{ data, error }, { data: importData, error: importError }] = await Promise.all([
        supabase
            .from("content_submissions")
            .select("id,content_type,title,body_copy,destination_url,citation_urls,source_note,content_origin,copy_owner_confirmed,storage_object_path,asset_alt_text,status,readiness_issues,scheduled_at,expires_at,approved_at,published_at,created_at")
            .order("created_at", { ascending: false }),
        supabase
            .from("production_content_import_batches")
            .select("id,file_name,status,total_records,accepted_records,blocked_records,imported_at,production_content_import_items(id,record_key,content_type,import_status,blockers)")
            .order("imported_at", { ascending: false })
            .limit(12),
    ]);
    if (error) throw new Error(error.message);
    if (importError) throw new Error(importError.message);
    const submissions = (data ?? []) as Submission[];
    const importBatches = (importData ?? []) as ImportBatch[];
    const ready = submissions.filter((item) => item.readiness_issues.length === 0);

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">Content operations</p>
                <h1 className="mt-4 font-serif text-4xl text-white md:text-6xl">Deployment Readiness</h1>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="glass-card p-5"><p className="text-xs uppercase text-potomac-cream/50">Submissions</p><p className="mt-2 text-3xl text-white">{submissions.length}</p></div>
                    <div className="glass-card p-5"><p className="text-xs uppercase text-potomac-cream/50">Ready</p><p className="mt-2 text-3xl text-white">{ready.length}</p></div>
                    <div className="glass-card p-5"><p className="text-xs uppercase text-potomac-cream/50">Published</p><p className="mt-2 text-3xl text-white">{submissions.filter((item) => item.status === "published").length}</p></div>
                </div>

                <section className="glass-card mt-10 p-6" aria-labelledby="production-import-heading">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">Reviewed manifest</p>
                            <h2 id="production-import-heading" className="mt-2 font-serif text-2xl text-white">Production Content Import</h2>
                        </div>
                        <span className="text-xs font-bold uppercase text-potomac-cream/50">JSON v1.0</span>
                    </div>
                    <form action={importProductionContent} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                        <label className="flex-1 text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">JSON manifest<input required name="manifest" type="file" accept="application/json,.json" className={inputClass} /></label>
                        <button className="bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary">Validate and import</button>
                    </form>
                    <div className="mt-7 space-y-4">
                        {importBatches.map((batch) => (
                            <article key={batch.id} className="border border-white/10 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div><p className="text-sm font-bold text-white">{batch.file_name}</p><p className="mt-1 text-xs text-potomac-cream/55">{batch.accepted_records} accepted / {batch.blocked_records} blocked / {batch.total_records} total</p></div>
                                    <span className={batch.status === "accepted" ? "text-xs font-bold uppercase text-green-300" : "text-xs font-bold uppercase text-red-200"}>{label(batch.status)}</span>
                                </div>
                                {batch.production_content_import_items.filter((item) => item.blockers.length).map((item) => (
                                    <div key={item.id} className="mt-3 border-l-2 border-red-400/50 pl-3 text-xs text-potomac-cream/70">
                                        <p className="font-bold text-red-200">{item.record_key} · {label(item.content_type)}</p>
                                        <p className="mt-1">{item.blockers.map(label).join("; ")}</p>
                                    </div>
                                ))}
                            </article>
                        ))}
                        {!importBatches.length ? <p className="text-sm text-potomac-cream/60">No production manifests have been imported.</p> : null}
                    </div>
                </section>

                <form action={createContentSubmission} encType="multipart/form-data" className="glass-card mt-10 p-6">
                    <h2 className="font-serif text-2xl text-white">New Submission</h2>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">Content type<select name="content_type" className={inputClass}>{types.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">Content origin<select name="content_origin" className={inputClass}><option value="ceo_provided">CEO provided</option><option value="editor_authored">Editor authored</option><option value="partner_provided">Partner provided</option><option value="licensed_import">Licensed import</option></select></label>
                        <Field name="title" title="Title" required />
                        <Field name="destination_url" title="Destination URL" required />
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold md:col-span-2">Production copy<textarea required name="body_copy" rows={5} className={inputClass} /></label>
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold md:col-span-2">Citation URLs<textarea required name="citation_urls" rows={3} className={inputClass} /></label>
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold md:col-span-2">Source note<textarea required name="source_note" rows={2} className={inputClass} /></label>
                        <Field name="scheduled_at" title="Schedule" type="datetime-local" />
                        <Field name="expires_at" title="Expiration override" type="datetime-local" />
                        <Field name="expiration_exception_reason" title="Expiration exception reason" />
                        <label className="text-xs font-bold uppercase tracking-[0.15em] text-potomac-gold">Image asset<input name="asset" type="file" accept="image/png,image/jpeg,image/webp" className={inputClass} /></label>
                        <Field name="asset_alt_text" title="Image alt text" />
                        <label className="flex items-start gap-3 text-sm text-potomac-cream/75 md:col-span-2"><input required name="copy_owner_confirmed" type="checkbox" className="mt-1 h-4 w-4 accent-potomac-gold" /><span>I confirm this production copy came from the named content owner and was not invented by automation.</span></label>
                    </div>
                    <button className="mt-6 bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary">Submit for review</button>
                </form>

                <div className="mt-10 space-y-5">
                    {submissions.map((item) => (
                        <article key={item.id} className="glass-card p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div><p className="text-xs font-bold uppercase text-potomac-gold">{label(item.content_type)} · {label(item.status)}</p><h2 className="mt-2 font-serif text-2xl text-white">{item.title}</h2></div>
                                <time className="text-xs text-potomac-cream/50" dateTime={item.expires_at}>Expires {new Date(item.expires_at).toLocaleString()}</time>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">{item.body_copy}</p>
                            <div className="mt-4 flex flex-wrap gap-2">{item.readiness_issues.length ? item.readiness_issues.map((issue) => <span key={issue} className="border border-red-400/35 px-3 py-1 text-xs text-red-200">{label(issue)}</span>) : <span className="border border-green-400/35 px-3 py-1 text-xs text-green-200">Deployment ready</span>}</div>
                            <div className="mt-5 flex flex-wrap gap-3">
                                {item.status === "submitted" ? <form action={approveContentSubmission}><input type="hidden" name="submission_id" value={item.id} /><button className="border border-potomac-gold px-4 py-2 text-xs font-bold uppercase text-potomac-gold">Approve</button></form> : null}
                                {item.status === "approved" ? <form action={publishContentSubmission}><input type="hidden" name="submission_id" value={item.id} /><button className="bg-potomac-gold px-4 py-2 text-xs font-bold uppercase text-potomac-primary">Publish</button></form> : null}
                                {!["published", "rejected", "expired"].includes(item.status) ? <form action={rejectContentSubmission} className="flex gap-2"><input type="hidden" name="submission_id" value={item.id} /><input name="review_note" aria-label="Rejection note" className="border border-white/15 bg-black/30 px-3 text-sm text-white" /><button className="border border-white/20 px-4 py-2 text-xs font-bold uppercase text-potomac-cream/70">Reject</button></form> : null}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
