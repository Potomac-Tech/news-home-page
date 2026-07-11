import type { createClient } from "../../lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PublishedContentSubmission = {
    id: string;
    content_type: string;
    title: string;
    body_copy: string;
    destination_url: string;
    citation_urls: string[];
    storage_bucket: string | null;
    storage_object_path: string | null;
    asset_alt_text: string | null;
    scheduled_at: string | null;
    expires_at: string;
};

export async function loadActivePublishedContent(
    supabase: SupabaseServerClient,
    contentTypes: string[],
    at = new Date()
) {
    if (!contentTypes.length) return [];
    const timestamp = at.toISOString();
    const { data, error } = await supabase
        .from("content_submissions")
        .select("id,content_type,title,body_copy,destination_url,citation_urls,storage_bucket,storage_object_path,asset_alt_text,scheduled_at,expires_at")
        .in("content_type", contentTypes)
        .eq("status", "published")
        .or(`scheduled_at.is.null,scheduled_at.lte.${timestamp}`)
        .gt("expires_at", timestamp)
        .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PublishedContentSubmission[];
}
