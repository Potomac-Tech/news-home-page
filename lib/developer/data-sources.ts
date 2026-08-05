import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeveloperClaim } from "./api-runtime";

export type DeveloperSource =
    | "lunar_articles"
    | "lunar_missions"
    | "procurement_regulatory"
    | "company_profiles"
    | "command_briefs";

export async function loadDeveloperSource(
    supabase: SupabaseClient,
    source: DeveloperSource,
    claim: DeveloperClaim,
    limit = 50,
    offset = 0
) {
    const pageSize = Math.max(1, Math.min(limit, 100));
    const rangeEnd = offset + pageSize - 1;
    if (source === "lunar_articles") {
        return supabase.from("editorial_articles")
            .select("id,slug,title,dek,public_summary,public_key_points,seo_title,seo_description,canonical_url,published_at,updated_at")
            .eq("status", "published").lte("published_at", new Date().toISOString())
            .order("published_at", { ascending: false }).range(offset, rangeEnd);
    }
    if (source === "lunar_missions") {
        return supabase.from("lunar_missions")
            .select("id,slug,mission_name,program_name,summary,current_phase,current_status,target_body,mission_objectives,confidence_label,quality_score,freshness_at,updated_at")
            .eq("publication_status", "published")
            .order("freshness_at", { ascending: false, nullsFirst: false }).range(offset, rangeEnd);
    }
    if (source === "company_profiles") {
        return supabase.from("lunar_companies")
            .select("id,slug,name,legal_name,company_type,sectors,lunar_programs,summary,lunar_relevance,headquarters,country_code,website_url,confidence_label,quality_score,freshness_at,updated_at")
            .eq("publication_status", "published")
            .order("quality_score", { ascending: false }).range(offset, rangeEnd);
    }
    if (source === "command_briefs") {
        let query = supabase.from("member_alert_feed_items")
            .select("id,object_title,headline,summary,source_label,severity,freshness_at,created_at,metadata")
            .eq("alert_kind", "command_brief").eq("status", "active")
            .eq("owner_user_id", claim.ownerUserId);
        if (claim.organizationId) query = query.eq("organization_id", claim.organizationId);
        return query.order("created_at", { ascending: false }).range(offset, rangeEnd);
    }

    const [procurements, regulations] = await Promise.all([
        supabase.from("lunar_procurements")
            .select("id,slug,title,procurement_kind,status,program_name,lunar_relevance,opportunity_summary,eligibility_summary,estimated_value,currency_code,response_due_at,source_url,confidence_label,quality_score,freshness_at,updated_at")
            .eq("publication_status", "published").order("freshness_at", { ascending: false, nullsFirst: false }).range(offset, rangeEnd),
        supabase.from("lunar_regulatory_records")
            .select("id,slug,title,regulatory_kind,status,jurisdiction,affected_parties,lunar_relevance,public_summary,risk_note,comment_due_at,effective_at,source_url,confidence_label,risk_level,freshness_at,updated_at")
            .eq("publication_status", "published").order("freshness_at", { ascending: false, nullsFirst: false }).range(offset, rangeEnd),
    ]);
    if (procurements.error) return procurements;
    if (regulations.error) return regulations;
    return { data: { procurements: procurements.data ?? [], regulations: regulations.data ?? [] }, error: null };
}

export function flattenSourceRows(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (data && typeof data === "object") {
        const value = data as Record<string, unknown>;
        return Object.entries(value).flatMap(([kind, rows]) =>
            Array.isArray(rows) ? rows.map((row) => ({ record_type: kind, ...(row as Record<string, unknown>) })) : []
        );
    }
    return [];
}
