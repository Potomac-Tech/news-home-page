"use server";

import { revalidatePath } from "next/cache";
import { requireEconomyStaff } from "../../../lib/auth/economy";

type EconomySupabase = Awaited<ReturnType<typeof requireEconomyStaff>>["supabase"];

const modelStatuses = ["draft", "active", "archived"] as const;
const confidenceLabels = ["experimental", "low", "medium", "high"] as const;
const sourceReviewStatuses = [
    "queued",
    "needs_review",
    "approved",
    "rejected",
    "expired",
] as const;

function getRequiredString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function getOptionalString(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    return value || null;
}

function getAllowedValue<const T extends readonly string[]>(
    formData: FormData,
    key: string,
    allowedValues: T,
    fallbackValue: T[number],
    errorLabel: string
) {
    const value = String(formData.get(key) ?? fallbackValue);

    if (!allowedValues.includes(value as T[number])) {
        throw new Error(`Invalid ${errorLabel}.`);
    }

    return value as T[number];
}

function getOptionalDate(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Invalid ${key}.`);
    }

    return value;
}

function getRequiredDate(formData: FormData, key: string) {
    const value = getOptionalDate(formData, key);

    if (!value) {
        throw new Error(`Missing ${key}.`);
    }

    return value;
}

function getOptionalTimestamp(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ${key}.`);
    }

    return date.toISOString();
}

function getOptionalNumber(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim().replaceAll(",", "");

    if (!value) {
        return null;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        throw new Error(`Invalid ${key}.`);
    }

    return numberValue;
}

function getNonnegativeInteger(formData: FormData, key: string, fallback: number) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return fallback;
    }

    const integerValue = Number(value);

    if (
        !Number.isInteger(integerValue) ||
        integerValue < 0 ||
        !Number.isSafeInteger(integerValue)
    ) {
        throw new Error(`Invalid ${key}.`);
    }

    return integerValue;
}

function getCurrencyCode(formData: FormData) {
    const value = String(formData.get("currency_code") ?? "USD")
        .trim()
        .toUpperCase();

    if (!/^[A-Z]{3}$/.test(value)) {
        throw new Error("Invalid currency code.");
    }

    return value;
}

function getModelStatus(formData: FormData) {
    return getAllowedValue(
        formData,
        "status",
        modelStatuses,
        "draft",
        "model status"
    );
}

function getConfidenceLabel(formData: FormData) {
    return getAllowedValue(
        formData,
        "confidence_label",
        confidenceLabels,
        "experimental",
        "confidence label"
    );
}

function getSourceReviewStatus(formData: FormData) {
    return getAllowedValue(
        formData,
        "review_status",
        sourceReviewStatuses,
        "queued",
        "source review status"
    );
}

function modelVersionPayload(formData: FormData, userId: string) {
    const status = getModelStatus(formData);

    return {
        version_key: getRequiredString(formData, "version_key"),
        version_name: getRequiredString(formData, "version_name"),
        status,
        summary: getOptionalString(formData, "summary") ?? "",
        methodology_markdown:
            getOptionalString(formData, "methodology_markdown") ?? "",
        model_scope:
            getOptionalString(formData, "model_scope") ??
            "lunar_economy_tracker",
        currency_code: getCurrencyCode(formData),
        valid_from: getRequiredDate(formData, "valid_from"),
        valid_to: getOptionalDate(formData, "valid_to"),
        is_public: formData.get("is_public") === "on",
        published_at:
            status === "active" && formData.get("is_public") === "on"
                ? getOptionalTimestamp(formData, "published_at") ??
                  new Date().toISOString()
                : getOptionalTimestamp(formData, "published_at"),
        updated_by: userId,
    };
}

function assumptionPayload(formData: FormData, userId: string) {
    const valueNumeric = getOptionalNumber(formData, "value_numeric");
    const valueText = getOptionalString(formData, "value_text");

    if (valueNumeric == null && !valueText) {
        throw new Error("Assumptions need either a numeric or text value.");
    }

    return {
        model_version_id: getRequiredString(formData, "model_version_id"),
        assumption_key: getRequiredString(formData, "assumption_key"),
        assumption_name: getRequiredString(formData, "assumption_name"),
        category: getOptionalString(formData, "category") ?? "general",
        value_numeric: valueNumeric,
        value_text: valueText,
        unit_name: getOptionalString(formData, "unit_name"),
        unit_symbol: getOptionalString(formData, "unit_symbol"),
        confidence_label: getConfidenceLabel(formData),
        is_public: formData.get("is_public") === "on",
        source_note: getOptionalString(formData, "source_note"),
        rationale: getOptionalString(formData, "rationale"),
        display_order: getNonnegativeInteger(formData, "display_order", 100),
        updated_by: userId,
    };
}

function sourcePayload(formData: FormData, userId: string) {
    return {
        model_version_id: getRequiredString(formData, "model_version_id"),
        source_key: getRequiredString(formData, "source_key"),
        title: getRequiredString(formData, "title"),
        publisher: getOptionalString(formData, "publisher"),
        document_type: getOptionalString(formData, "document_type") ?? "source",
        url: getOptionalString(formData, "url"),
        published_at: getOptionalDate(formData, "source_published_at"),
        retrieved_at:
            getOptionalTimestamp(formData, "retrieved_at") ??
            new Date().toISOString(),
        citation_text: getOptionalString(formData, "citation_text"),
        summary: getOptionalString(formData, "summary"),
        license_notes: getOptionalString(formData, "license_notes"),
        review_status: getSourceReviewStatus(formData),
        confidence_label: getConfidenceLabel(formData),
        is_public: formData.get("is_public") === "on",
        display_order: getNonnegativeInteger(formData, "display_order", 100),
        updated_by: userId,
    };
}

function relationshipPayload(formData: FormData) {
    return {
        assumption_id: getRequiredString(formData, "assumption_id"),
        source_document_id: getRequiredString(formData, "source_document_id"),
        relationship_type:
            getOptionalString(formData, "relationship_type") ?? "supports",
        notes: getOptionalString(formData, "notes"),
        display_order: getNonnegativeInteger(formData, "display_order", 100),
    };
}

async function ensureSameModelVersion(
    supabase: EconomySupabase,
    assumptionId: string,
    sourceDocumentId: string
) {
    const [assumptionResult, sourceResult] = await Promise.all([
        supabase
            .from("lunar_economy_model_assumptions")
            .select("model_version_id")
            .eq("id", assumptionId)
            .single(),
        supabase
            .from("lunar_economy_source_documents")
            .select("model_version_id")
            .eq("id", sourceDocumentId)
            .single(),
    ]);

    if (assumptionResult.error || !assumptionResult.data) {
        throw new Error(assumptionResult.error?.message ?? "Assumption not found.");
    }

    if (sourceResult.error || !sourceResult.data) {
        throw new Error(sourceResult.error?.message ?? "Source not found.");
    }

    if (
        assumptionResult.data.model_version_id !==
        sourceResult.data.model_version_id
    ) {
        throw new Error("Assumption and source must belong to the same version.");
    }
}

export async function createModelVersion(formData: FormData) {
    const { supabase, userId } = await requireEconomyStaff();
    const { error } = await supabase
        .from("lunar_economy_model_versions")
        .insert({
            ...modelVersionPayload(formData, userId),
            created_by: userId,
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}

export async function updateModelVersion(formData: FormData) {
    const { supabase, userId } = await requireEconomyStaff();
    const modelVersionId = getRequiredString(formData, "model_version_id");
    const { error } = await supabase
        .from("lunar_economy_model_versions")
        .update(modelVersionPayload(formData, userId))
        .eq("id", modelVersionId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
    revalidatePath("/");
    revalidatePath("/member");
}

export async function createAssumption(formData: FormData) {
    const { supabase, userId } = await requireEconomyStaff();
    const { error } = await supabase
        .from("lunar_economy_model_assumptions")
        .insert({
            ...assumptionPayload(formData, userId),
            created_by: userId,
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}

export async function updateAssumption(formData: FormData) {
    const { supabase, userId } = await requireEconomyStaff();
    const assumptionId = getRequiredString(formData, "assumption_id");
    const { error } = await supabase
        .from("lunar_economy_model_assumptions")
        .update(assumptionPayload(formData, userId))
        .eq("id", assumptionId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}

export async function createSourceDocument(formData: FormData) {
    const { supabase, userId } = await requireEconomyStaff();
    const { error } = await supabase
        .from("lunar_economy_source_documents")
        .insert({
            ...sourcePayload(formData, userId),
            created_by: userId,
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}

export async function updateSourceDocument(formData: FormData) {
    const { supabase, userId } = await requireEconomyStaff();
    const sourceDocumentId = getRequiredString(formData, "source_document_id");
    const { error } = await supabase
        .from("lunar_economy_source_documents")
        .update(sourcePayload(formData, userId))
        .eq("id", sourceDocumentId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}

export async function createAssumptionSource(formData: FormData) {
    const { supabase } = await requireEconomyStaff();
    const payload = relationshipPayload(formData);

    await ensureSameModelVersion(
        supabase,
        payload.assumption_id,
        payload.source_document_id
    );

    const { error } = await supabase
        .from("lunar_economy_assumption_sources")
        .insert(payload);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}

export async function updateAssumptionSource(formData: FormData) {
    const { supabase } = await requireEconomyStaff();
    const relationshipId = getRequiredString(formData, "relationship_id");
    const payload = relationshipPayload(formData);

    await ensureSameModelVersion(
        supabase,
        payload.assumption_id,
        payload.source_document_id
    );

    const { error } = await supabase
        .from("lunar_economy_assumption_sources")
        .update(payload)
        .eq("id", relationshipId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/economy");
}
