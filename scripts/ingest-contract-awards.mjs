import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "xlpkdoeldtlhearqajat";
const PROJECT_URL = `https://${PROJECT_REF}.supabase.co`;
const directSpaceTerms = /\b(lunar|moon|cislunar|artemis|clps|spacecraft|lander|rover|satellite|launch vehicle|space launch|space mission|orbital|space station)\b/i;
const highSignalLunarTerms = /\b(lunar|moon|cislunar|artemis|clps|lander|lunar rover)\b/i;
const gatewayTerm = /\bgateway\b/i;
const gatewaySpaceContext = /\b(space|lunar|moon|cislunar|artemis|orbital|spacecraft|lander)\b/i;
const nasaAgency = /\b(nasa|national aeronautics and space administration)\b/i;

function options(argv) {
    const result = { input: null, apply: false, source: "usaspending" };
    for (let index = 0; index < argv.length; index += 1) {
        if (argv[index] === "--input") result.input = argv[++index];
        else if (argv[index] === "--source") result.source = argv[++index];
        else if (argv[index] === "--apply") result.apply = true;
        else throw new Error(`Unknown argument: ${argv[index]}`);
    }
    return result;
}

function asDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString().slice(0, 10);
}

function valueFields(item, citationUrl) {
    const exact = Number(item.amount ?? item.award_amount ?? item.obligated_amount);
    if (citationUrl && Number.isFinite(exact) && exact >= 0) return { value_state: "exact_cited", exact_cited_amount: exact };
    return { value_state: "unknown", exact_cited_amount: null };
}

function isLunarRelevance(text, customerName) {
    if (highSignalLunarTerms.test(text)) return true;
    return gatewayTerm.test(text) && (nasaAgency.test(customerName) || gatewaySpaceContext.test(text));
}

export function normalizeContractAward(item, sourceId, runId, checkedAt) {
    const title = item.title ?? item.description ?? item.Award_Description ?? "";
    const program = item.program_name ?? item.program ?? item.parent_award_id ?? "";
    const relevanceText = [title, item.description, item.relevance_statement, program].filter(Boolean).join(" ");
    const customerName = item.customer_name ?? item.awarding_agency ?? item.Awarding_Agency ?? "";
    const isLunar = isLunarRelevance(relevanceText, customerName);
    if (!directSpaceTerms.test(relevanceText) && !isLunar) return null;
    const awardDate = asDate(item.award_date ?? item.start_date ?? item.Action_Date);
    const externalKey = item.id ?? item.award_id ?? item.Award_ID;
    if (!awardDate || !externalKey) return null;
    const citationUrl = item.citation_url ?? item.generated_subaward_url ?? item.source_url;
    return {
        award: {
            external_source_key: String(externalKey), source_registry_id: sourceId, ingestion_run_id: runId,
            title: title.trim().slice(0, 240), award_date: awardDate,
            effective_date: asDate(item.effective_date), option_exercise_date: asDate(item.option_exercise_date),
            customer_name: customerName || "Customer pending review",
            vendor_name: item.vendor_name ?? item.recipient_name ?? item.Recipient_Name ?? "Vendor pending review",
            program_name: program || null, award_vehicle: item.award_vehicle ?? item.contract_award_type ?? null,
            award_number: item.award_number ?? String(externalKey), relevance_scope: isLunar ? "lunar" : "space",
            relevance_statement: (item.relevance_statement ?? `Direct ${isLunar ? "lunar" : "space"} relevance identified in the cited award description.`).slice(0, 500),
            is_space_or_lunar_relevant: true, confidence_label: "medium",
            tier_visibility: "member", publication_status: "draft", source_checked_at: checkedAt,
        },
        value: { ...valueFields(item, citationUrl), value_visibility: "scout", currency_code: item.currency_code ?? "USD", source_registry_id: sourceId, source_citation_url: citationUrl ?? null },
        citation: citationUrl ? { source_registry_id: sourceId, citation_title: item.citation_title ?? title, citation_url: citationUrl, is_primary: true } : null,
    };
}

async function inputData(config) {
    if (!config.input) throw new Error("Provide --input with a reviewed USAspending, SAM.gov, SEC, or company-source export.");
    const parsed = JSON.parse(await readFile(config.input, "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.results ?? parsed.awards ?? [];
}

async function main() {
    const config = options(process.argv.slice(2));
    const checkedAt = new Date().toISOString();
    const input = await inputData(config);
    const deduped = [...new Map(input.map((item) => [String(item.id ?? item.award_id ?? item.Award_ID), item])).values()];
    const normalized = deduped.map((item) => normalizeContractAward(item, "SOURCE_ID", "RUN_ID", checkedAt)).filter(Boolean);
    if (!config.apply) {
        console.log(JSON.stringify({ dryRun: true, fetched: deduped.length, relevant: normalized.length, excluded: deduped.length - normalized.length, awards: normalized }, null, 2));
        return;
    }
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
    if (url !== PROJECT_URL || !key) throw new Error(`Apply requires canonical ${PROJECT_REF} service credentials.`);
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const sourceKeys = { usaspending: "usaspending-awards-api", sam: "sam-gov-contract-awards", sec: "sec-edgar-company-filings" };
    const sourceKey = sourceKeys[config.source];
    if (!sourceKey) throw new Error("Source must be usaspending, sam, or sec.");
    const { data: source, error: sourceError } = await supabase.from("intelligence_data_sources").select("id,source_key,license_status,analyst_review_state,publication_status").eq("source_key", sourceKey).single();
    if (sourceError) throw sourceError;
    if (source.license_status !== "approved" || source.analyst_review_state !== "approved" || source.publication_status !== "published") throw new Error(`Registry source ${sourceKey} is not approved for ingestion.`);
    const runKey = `${sourceKey}:${checkedAt}`;
    const { data: run, error: runError } = await supabase.from("contract_award_ingestion_runs").insert({ run_key: runKey, source_registry_id: source.id, source_checked_at: checkedAt, records_fetched: deduped.length, metadata: { source_key: sourceKey, review_required: true, strict_space_relevance: true } }).select("id").single();
    if (runError) throw runError;
    const awards = deduped.map((item) => normalizeContractAward(item, source.id, run.id, checkedAt)).filter(Boolean);
    let created = 0;
    let updated = 0;
    for (const normalizedAward of awards) {
        const { data: existing, error: existingError } = await supabase.from("contract_awards").select("id").eq("source_registry_id", source.id).eq("external_source_key", normalizedAward.award.external_source_key).maybeSingle();
        if (existingError) throw existingError;
        let awardId;
        if (existing) {
            const { error } = await supabase.from("contract_awards").update(normalizedAward.award).eq("id", existing.id);
            if (error) throw error;
            awardId = existing.id;
            updated += 1;
        } else {
            const { data: inserted, error } = await supabase.from("contract_awards").insert(normalizedAward.award).select("id").single();
            if (error) throw error;
            awardId = inserted.id;
            created += 1;
        }
        if (normalizedAward.citation) {
            const { error } = await supabase.from("contract_award_citations").upsert({ ...normalizedAward.citation, contract_award_id: awardId }, { onConflict: "contract_award_id,source_registry_id,citation_url" });
            if (error) throw error;
        }
        const { error: valueError } = await supabase.from("contract_award_values").upsert({ ...normalizedAward.value, contract_award_id: awardId }, { onConflict: "contract_award_id" });
        if (valueError) throw valueError;
    }
    const { error: checkError } = await supabase.from("contract_award_source_checks").insert({ ingestion_run_id: run.id, source_registry_id: source.id, check_status: "checked", checked_at: checkedAt, check_note: "Approved registry source checked; non-space awards excluded before draft creation." });
    if (checkError) throw checkError;
    const { error: finishError } = await supabase.from("contract_award_ingestion_runs").update({ status: "completed", records_relevant: awards.length, records_created: created, records_updated: updated, records_excluded: deduped.length - awards.length, completed_at: new Date().toISOString() }).eq("id", run.id);
    if (finishError) throw finishError;
    console.log(JSON.stringify({ applied: true, runId: run.id, relevant: awards.length, excluded: deduped.length - awards.length }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
