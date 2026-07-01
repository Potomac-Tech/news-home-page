import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const POTOMAC_SUPABASE_PROJECT_REF = "xlpkdoeldtlhearqajat";
const POTOMAC_SUPABASE_URL = `https://${POTOMAC_SUPABASE_PROJECT_REF}.supabase.co`;
const defaultInputPath = "scripts/data-marketplace-sample-input.json";

function parseArgs(argv) {
    const options = {
        input: defaultInputPath,
        apply: false,
        publish: false,
        help: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--input") {
            options.input = argv[index + 1];
            index += 1;
        } else if (arg === "--apply") {
            options.apply = true;
        } else if (arg === "--publish") {
            options.publish = true;
        } else if (arg === "--help" || arg === "-h") {
            options.help = true;
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return options;
}

function usage() {
    return [
        "Usage: npm run extract:data-marketplace -- [--input path] [--apply] [--publish]",
        "",
        "Dry run is the default. --apply writes to Supabase using SUPABASE_SERVICE_ROLE_KEY.",
        "--publish marks generated request/offer records approved and visible to their tier.",
    ].join("\n");
}

function requiredString(value, label) {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Missing ${label}.`);
    }

    return value.trim();
}

function optionalString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value, fallback = null) {
    if (value == null || value === "") {
        return fallback;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        throw new Error(`Invalid numeric value: ${value}`);
    }

    return numberValue;
}

function tier(value) {
    const normalized = optionalString(value) ?? "scout";

    if (normalized !== "scout" && normalized !== "command") {
        throw new Error(`Invalid access tier: ${normalized}`);
    }

    return normalized;
}

function confidence(value) {
    const normalized = optionalString(value) ?? "experimental";
    const allowed = new Set(["experimental", "low", "medium", "high"]);

    if (!allowed.has(normalized)) {
        throw new Error(`Invalid confidence label: ${normalized}`);
    }

    return normalized;
}

async function loadInput(path) {
    const raw = await readFile(path, "utf8");
    const input = JSON.parse(raw);

    return {
        runKey: requiredString(input.runKey, "runKey"),
        pipelineName: requiredString(input.pipelineName, "pipelineName"),
        source: input.source ?? {},
        requests: Array.isArray(input.requests) ? input.requests : [],
        offers: Array.isArray(input.offers) ? input.offers : [],
    };
}

function buildPayloads(input, options) {
    const now = new Date().toISOString();
    const source = input.source;
    const reviewStatus = options.publish ? "approved" : "queued";
    const publishedAt = options.publish ? now : null;

    const extractionRun = {
        run_key: input.runKey,
        pipeline_name: input.pipelineName,
        source_type: optionalString(source.documentType) ?? "source",
        source_url: optionalString(source.url),
        status: "completed",
        started_at: now,
        completed_at: now,
        input_summary: optionalString(source.summary),
        model_name: "placeholder-rule-extractor",
        prompt_version: "placeholder-v1",
        extractor_version: "local-placeholder-v1",
        records_found: input.requests.length + input.offers.length,
        data_requests_created: input.requests.length,
        data_offers_created: input.offers.length,
        confidence_label: confidence(source.confidenceLabel),
        rationale:
            "Placeholder extraction maps reviewed source snippets into draft marketplace records for analyst review.",
        metadata: {
            dry_run_default: true,
            source_key: source.sourceKey,
        },
    };

    const sourceDocument = {
        source_key: requiredString(source.sourceKey, "source.sourceKey"),
        title: requiredString(source.title, "source.title"),
        publisher: optionalString(source.publisher),
        document_type: optionalString(source.documentType) ?? "source",
        url: optionalString(source.url),
        published_at: optionalString(source.publishedAt),
        retrieved_at: optionalString(source.retrievedAt) ?? now,
        citation_text: optionalString(source.citationText),
        summary: optionalString(source.summary),
        license_notes: optionalString(source.licenseNotes),
        access_tier_required: tier(source.accessTierRequired),
        review_status: reviewStatus,
        confidence_label: confidence(source.confidenceLabel),
        metadata: {
            pipeline_name: input.pipelineName,
        },
    };

    const requests = input.requests.map((request) => ({
        slug: requiredString(request.slug, "request.slug"),
        title: requiredString(request.title, "request.title"),
        request_summary: requiredString(request.summary, "request.summary"),
        requester_name: optionalString(request.requesterName),
        requester_organization: optionalString(request.requesterOrganization),
        status: options.publish ? "open" : "draft",
        access_tier_required: tier(request.accessTierRequired),
        review_status: reviewStatus,
        confidence_label: confidence(request.confidenceLabel),
        confidence_score: optionalNumber(request.confidenceScore, 0),
        extraction_rationale: optionalString(request.extractionRationale),
        data_type: optionalString(request.dataType),
        requested_format: optionalString(request.requestedFormat),
        mission_name: optionalString(request.missionName),
        mission_phase: optionalString(request.missionPhase),
        lunar_region: optionalString(request.lunarRegion),
        location_name: optionalString(request.locationName),
        instrument_name: optionalString(request.instrumentName),
        needed_by: optionalString(request.neededBy),
        priority_score: optionalNumber(request.priorityScore, 0),
        published_at: publishedAt,
        metadata: {
            page_reference: optionalString(request.pageReference),
            placeholder_pipeline: true,
        },
    }));

    const offers = input.offers.map((offer) => ({
        slug: requiredString(offer.slug, "offer.slug"),
        title: requiredString(offer.title, "offer.title"),
        offer_summary: requiredString(offer.summary, "offer.summary"),
        provider_name: optionalString(offer.providerName),
        provider_organization: optionalString(offer.providerOrganization),
        status: options.publish ? "available" : "draft",
        access_tier_required: tier(offer.accessTierRequired),
        review_status: reviewStatus,
        confidence_label: confidence(offer.confidenceLabel),
        confidence_score: optionalNumber(offer.confidenceScore, 0),
        extraction_rationale: optionalString(offer.extractionRationale),
        data_type: optionalString(offer.dataType),
        delivery_mode: optionalString(offer.deliveryMode),
        availability_state: optionalString(offer.availabilityState),
        mission_name: optionalString(offer.missionName),
        mission_phase: optionalString(offer.missionPhase),
        lunar_region: optionalString(offer.lunarRegion),
        location_name: optionalString(offer.locationName),
        instrument_name: optionalString(offer.instrumentName),
        coverage_start_at: optionalString(offer.coverageStartAt),
        coverage_end_at: optionalString(offer.coverageEndAt),
        sample_url: optionalString(offer.sampleUrl),
        published_at: publishedAt,
        metadata: {
            page_reference: optionalString(offer.pageReference),
            placeholder_pipeline: true,
        },
    }));

    return {
        extractionRun,
        sourceDocument,
        requests,
        offers,
    };
}

function getSupabaseClient() {
    const supabaseUrl =
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (supabaseUrl !== POTOMAC_SUPABASE_URL) {
        throw new Error(`Supabase URL must target ${POTOMAC_SUPABASE_PROJECT_REF}.`);
    }

    if (!serviceKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
    }

    return createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

async function upsertSingle(supabase, table, payload, onConflict) {
    const { data, error } = await supabase
        .from(table)
        .upsert(payload, { onConflict })
        .select("id")
        .single();

    if (error) {
        throw new Error(`${table}: ${error.message}`);
    }

    return data.id;
}

function ensureNoError(result, label) {
    if (result.error) {
        throw new Error(`${label}: ${result.error.message}`);
    }
}

async function applyPayloads(payloads) {
    const supabase = getSupabaseClient();
    const extractionRunId = await upsertSingle(
        supabase,
        "data_market_extraction_runs",
        payloads.extractionRun,
        "run_key"
    );
    const sourceDocumentId = await upsertSingle(
        supabase,
        "data_market_source_documents",
        {
            ...payloads.sourceDocument,
            extraction_run_id: extractionRunId,
        },
        "source_key"
    );

    for (const request of payloads.requests) {
        const dataRequestId = await upsertSingle(
            supabase,
            "data_market_data_requests",
            {
                ...request,
                extraction_run_id: extractionRunId,
                primary_source_document_id: sourceDocumentId,
            },
            "slug"
        );

        const requestSourceResult = await supabase
            .from("data_market_request_sources")
            .upsert(
            {
                data_request_id: dataRequestId,
                source_document_id: sourceDocumentId,
                relationship_type: "extracted_from",
                page_reference: request.metadata.page_reference,
                rationale: request.extraction_rationale,
                confidence_label: request.confidence_label,
            },
            {
                onConflict:
                    "data_request_id,source_document_id,relationship_type",
            }
            );
        ensureNoError(requestSourceResult, "data_market_request_sources");

        const requestAuditResult = await supabase.from("data_market_audit_logs").insert({
            extraction_run_id: extractionRunId,
            source_document_id: sourceDocumentId,
            data_request_id: dataRequestId,
            event_type: "data_market.request_extracted",
            event_summary: `Extracted data request candidate: ${request.title}`,
            after_state: request,
            metadata: { pipeline: payloads.extractionRun.pipeline_name },
        });
        ensureNoError(requestAuditResult, "data_market_audit_logs request");
    }

    for (const offer of payloads.offers) {
        const dataOfferId = await upsertSingle(
            supabase,
            "data_market_data_offers",
            {
                ...offer,
                extraction_run_id: extractionRunId,
                primary_source_document_id: sourceDocumentId,
            },
            "slug"
        );

        const offerSourceResult = await supabase
            .from("data_market_offer_sources")
            .upsert(
            {
                data_offer_id: dataOfferId,
                source_document_id: sourceDocumentId,
                relationship_type: "extracted_from",
                page_reference: offer.metadata.page_reference,
                rationale: offer.extraction_rationale,
                confidence_label: offer.confidence_label,
            },
            {
                onConflict: "data_offer_id,source_document_id,relationship_type",
            }
            );
        ensureNoError(offerSourceResult, "data_market_offer_sources");

        const offerAuditResult = await supabase.from("data_market_audit_logs").insert({
            extraction_run_id: extractionRunId,
            source_document_id: sourceDocumentId,
            data_offer_id: dataOfferId,
            event_type: "data_market.offer_extracted",
            event_summary: `Extracted data offer candidate: ${offer.title}`,
            after_state: offer,
            metadata: { pipeline: payloads.extractionRun.pipeline_name },
        });
        ensureNoError(offerAuditResult, "data_market_audit_logs offer");
    }

    const runAuditResult = await supabase.from("data_market_audit_logs").insert({
        extraction_run_id: extractionRunId,
        source_document_id: sourceDocumentId,
        event_type: "data_market.extraction_run_completed",
        event_summary: "Completed placeholder data marketplace extraction run.",
        after_state: payloads.extractionRun,
        metadata: {
            request_count: payloads.requests.length,
            offer_count: payloads.offers.length,
        },
    });
    ensureNoError(runAuditResult, "data_market_audit_logs run");

    return {
        extractionRunId,
        sourceDocumentId,
        requestCount: payloads.requests.length,
        offerCount: payloads.offers.length,
    };
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        console.log(usage());
        return;
    }

    const input = await loadInput(options.input);
    const payloads = buildPayloads(input, options);

    if (!options.apply) {
        console.log(
            JSON.stringify(
                {
                    mode: "dry-run",
                    input: options.input,
                    publish: options.publish,
                    planned: {
                        runKey: payloads.extractionRun.run_key,
                        sourceKey: payloads.sourceDocument.source_key,
                        requestCount: payloads.requests.length,
                        offerCount: payloads.offers.length,
                        confidenceLabels: [
                            payloads.extractionRun.confidence_label,
                            ...payloads.requests.map(
                                (request) => request.confidence_label
                            ),
                            ...payloads.offers.map(
                                (offer) => offer.confidence_label
                            ),
                        ],
                    },
                    payloads,
                },
                null,
                2
            )
        );
        return;
    }

    const result = await applyPayloads(payloads);
    console.log(JSON.stringify({ mode: "applied", ...result }, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
