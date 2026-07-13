import type { createClient } from "../../lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ContractAwardRow = {
    id: string;
    title: string;
    awardDate: string;
    effectiveDate: string | null;
    optionExerciseDate: string | null;
    customer: string;
    vendor: string;
    program: string | null;
    vehicle: string | null;
    awardNumber: string | null;
    scope: string;
    relevance: string;
    confidence: string;
    reviewedAt: string | null;
    reviewer: string;
    value: {
        state: string;
        visibility: string;
        currency: string;
        exact: number | null;
        low: number | null;
        high: number | null;
        estimate: number | null;
        methodology: string | null;
    } | null;
    citations: Array<{ title: string; url: string; retrievedAt: string }>;
};

export async function loadContractAwards({
    supabase,
    limit = 24,
}: {
    supabase: SupabaseServerClient;
    limit?: number;
}) {
    const { data: awards, error } = await supabase
        .from("contract_awards")
        .select("id,title,award_date,effective_date,option_exercise_date,customer_name,vendor_name,program_name,award_vehicle,award_number,relevance_scope,relevance_statement,is_space_or_lunar_relevant,confidence_label,reviewed_by,reviewed_at")
        .eq("is_space_or_lunar_relevant", true)
        .order("award_date", { ascending: false })
        .limit(limit);

    if (error) return { rows: [] as ContractAwardRow[], unavailable: true };

    const ids = (awards ?? []).map((award) => award.id);
    if (!ids.length) return { rows: [] as ContractAwardRow[], unavailable: false };

    const [{ data: citations, error: citationError }, { data: values, error: valueError }] =
        await Promise.all([
            supabase
                .from("contract_award_citations")
                .select("contract_award_id,citation_title,citation_url,retrieved_at,is_primary")
                .in("contract_award_id", ids)
                .order("is_primary", { ascending: false }),
            supabase
                .from("contract_award_values")
                .select("contract_award_id,value_state,value_visibility,currency_code,exact_cited_amount,cited_range_low,cited_range_high,analyst_estimate,estimate_methodology")
                .in("contract_award_id", ids),
        ]);

    if (citationError || valueError) {
        return { rows: [] as ContractAwardRow[], unavailable: true };
    }

    return {
        unavailable: false,
        rows: (awards ?? []).map((award): ContractAwardRow => {
            const value = values?.find(
                (candidate) => candidate.contract_award_id === award.id,
            );
            return {
                id: award.id,
                title: award.title,
                awardDate: award.award_date,
                effectiveDate: award.effective_date,
                optionExerciseDate: award.option_exercise_date,
                customer: award.customer_name,
                vendor: award.vendor_name,
                program: award.program_name,
                vehicle: award.award_vehicle,
                awardNumber: award.award_number,
                scope: award.relevance_scope,
                relevance: award.relevance_statement,
                confidence: award.confidence_label,
                reviewedAt: award.reviewed_at,
                reviewer: award.reviewed_by
                    ? "Cabeus Explorer editorial"
                    : "Review pending",
                value: value
                    ? {
                          state: value.value_state,
                          visibility: value.value_visibility,
                          currency: value.currency_code,
                          exact: value.exact_cited_amount,
                          low: value.cited_range_low,
                          high: value.cited_range_high,
                          estimate: value.analyst_estimate,
                          methodology: value.estimate_methodology,
                      }
                    : null,
                citations: (citations ?? [])
                    .filter((citation) => citation.contract_award_id === award.id)
                    .map((citation) => ({
                        title: citation.citation_title,
                        url: citation.citation_url,
                        retrievedAt: citation.retrieved_at,
                    })),
            };
        }),
    };
}

