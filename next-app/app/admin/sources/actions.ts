"use server";

import { revalidatePath } from "next/cache";
import { requireDataSourceStaff } from "../../../lib/auth/data-sources";

const ownerKinds = [
    "government",
    "commercial",
    "academic",
    "nonprofit",
    "media",
    "community",
    "internal",
    "unknown",
] as const;
const licenseStatuses = [
    "queued",
    "approved",
    "restricted",
    "rejected",
    "expired",
    "unknown",
] as const;
const healthStatuses = [
    "healthy",
    "degraded",
    "failing",
    "paused",
    "retired",
    "unknown",
] as const;
const refreshFrequencies = [
    "realtime",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "manual",
    "static",
] as const;
const confidenceLabels = ["low", "medium", "high", "experimental"] as const;
const reviewStates = [
    "not_started",
    "in_review",
    "approved",
    "needs_changes",
    "blocked",
    "retired",
] as const;
const jobStatuses = [
    "queued",
    "running",
    "succeeded",
    "failed",
    "cancelled",
    "skipped",
] as const;
const sourceKinds = [
    "article",
    "event",
    "company",
    "lunar_mission",
    "dataset",
    "data_request",
    "data_offer",
    "job",
    "procurement",
    "regulatory_record",
    "methodology_source",
    "dashboard_module",
    "calculator",
    "rfq",
    "forum_thread",
    "member_profile",
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

function getOptionalUrl(formData: FormData, key: string) {
    const value = getOptionalString(formData, key);

    if (!value) {
        return null;
    }

    try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Unsupported protocol.");
        }
    } catch {
        throw new Error(`Invalid ${key}.`);
    }

    return value;
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

function getScore(formData: FormData, key: string, fallback: number) {
    const value = getOptionalNumber(formData, key) ?? fallback;

    if (value < 0 || value > 100) {
        throw new Error(`${key} must be between 0 and 100.`);
    }

    return value;
}

function getOptionalScore(formData: FormData, key: string) {
    const value = getOptionalNumber(formData, key);

    if (value == null) {
        return null;
    }

    if (value < 0 || value > 100) {
        throw new Error(`${key} must be between 0 and 100.`);
    }

    return value;
}

function getNonnegativeInteger(
    formData: FormData,
    key: string,
    fallback: number | null
) {
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

function sourcePayload(formData: FormData, userId: string) {
    const licenseStatus = getAllowedValue(
        formData,
        "license_status",
        licenseStatuses,
        "queued",
        "license status"
    );

    return {
        source_key: getRequiredString(formData, "source_key"),
        source_name: getRequiredString(formData, "source_name"),
        source_owner: getRequiredString(formData, "source_owner"),
        owner_kind: getAllowedValue(
            formData,
            "owner_kind",
            ownerKinds,
            "unknown",
            "owner kind"
        ),
        primary_url: getOptionalUrl(formData, "primary_url"),
        terms_url: getOptionalUrl(formData, "terms_url"),
        license_name: getOptionalString(formData, "license_name"),
        license_status: licenseStatus,
        license_reviewed_at:
            licenseStatus === "queued"
                ? getOptionalTimestamp(formData, "license_reviewed_at")
                : getOptionalTimestamp(formData, "license_reviewed_at") ??
                  new Date().toISOString(),
        license_reviewed_by:
            licenseStatus === "queued" ? null : userId,
        license_notes: getOptionalString(formData, "license_notes"),
        refresh_frequency: getAllowedValue(
            formData,
            "refresh_frequency",
            refreshFrequencies,
            "manual",
            "refresh frequency"
        ),
        parser_key: getOptionalString(formData, "parser_key"),
        parser_repository_url: getOptionalUrl(formData, "parser_repository_url"),
        job_name: getOptionalString(formData, "job_name"),
        health_status: getAllowedValue(
            formData,
            "health_status",
            healthStatuses,
            "unknown",
            "health status"
        ),
        last_checked_at: getOptionalTimestamp(formData, "last_checked_at"),
        last_success_at: getOptionalTimestamp(formData, "last_success_at"),
        last_failure_at: getOptionalTimestamp(formData, "last_failure_at"),
        stale_after_hours: getNonnegativeInteger(
            formData,
            "stale_after_hours",
            null
        ),
        next_refresh_at: getOptionalTimestamp(formData, "next_refresh_at"),
        citation_required: formData.get("citation_required") === "on",
        citation_format: getOptionalString(formData, "citation_format"),
        attribution_text: getOptionalString(formData, "attribution_text"),
        quality_score: getScore(formData, "quality_score", 0),
        confidence_label: getAllowedValue(
            formData,
            "confidence_label",
            confidenceLabels,
            "experimental",
            "confidence label"
        ),
        analyst_review_state: getAllowedValue(
            formData,
            "analyst_review_state",
            reviewStates,
            "not_started",
            "analyst review state"
        ),
        analyst_notes: getOptionalString(formData, "analyst_notes"),
        publication_status: getAllowedValue(
            formData,
            "publication_status",
            ["draft", "review", "published", "archived", "hidden"] as const,
            "draft",
            "publication status"
        ),
        updated_by: userId,
    };
}

export async function createDataSource(formData: FormData) {
    const { supabase, userId } = await requireDataSourceStaff();
    const { error } = await supabase.from("intelligence_data_sources").insert({
        ...sourcePayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}

export async function updateDataSource(formData: FormData) {
    const { supabase, userId } = await requireDataSourceStaff();
    const sourceId = getRequiredString(formData, "data_source_id");
    const { error } = await supabase
        .from("intelligence_data_sources")
        .update(sourcePayload(formData, userId))
        .eq("id", sourceId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}

export async function createCitationRequirement(formData: FormData) {
    const { supabase } = await requireDataSourceStaff();
    const { error } = await supabase
        .from("intelligence_source_citation_requirements")
        .insert({
            data_source_id: getRequiredString(formData, "data_source_id"),
            requirement_key: getRequiredString(formData, "requirement_key"),
            display_label: getRequiredString(formData, "display_label"),
            is_required: formData.get("is_required") === "on",
            guidance: getOptionalString(formData, "guidance"),
            example_value: getOptionalString(formData, "example_value"),
            display_order: getNonnegativeInteger(
                formData,
                "display_order",
                100
            ),
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}

export async function createHealthCheck(formData: FormData) {
    const { supabase, userId } = await requireDataSourceStaff();
    const { error } = await supabase
        .from("intelligence_source_health_checks")
        .insert({
            data_source_id: getRequiredString(formData, "data_source_id"),
            health_status: getAllowedValue(
                formData,
                "health_status",
                healthStatuses,
                "unknown",
                "health status"
            ),
            checked_at:
                getOptionalTimestamp(formData, "checked_at") ??
                new Date().toISOString(),
            freshness_at: getOptionalTimestamp(formData, "freshness_at"),
            freshness_lag_hours: getOptionalNumber(
                formData,
                "freshness_lag_hours"
            ),
            response_ms: getNonnegativeInteger(formData, "response_ms", null),
            observed_record_count: getNonnegativeInteger(
                formData,
                "observed_record_count",
                null
            ),
            issue_summary: getOptionalString(formData, "issue_summary"),
            checked_by: userId,
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}

export async function createQualityReview(formData: FormData) {
    const { supabase, userId } = await requireDataSourceStaff();
    const { error } = await supabase
        .from("intelligence_source_quality_reviews")
        .insert({
            data_source_id: getRequiredString(formData, "data_source_id"),
            review_state: getAllowedValue(
                formData,
                "review_state",
                reviewStates,
                "in_review",
                "review state"
            ),
            quality_score: getScore(formData, "quality_score", 0),
            confidence_label: getAllowedValue(
                formData,
                "confidence_label",
                confidenceLabels,
                "experimental",
                "confidence label"
            ),
            coverage_score: getOptionalScore(formData, "coverage_score"),
            accuracy_score: getOptionalScore(formData, "accuracy_score"),
            timeliness_score: getOptionalScore(formData, "timeliness_score"),
            citation_score: getOptionalScore(formData, "citation_score"),
            review_notes: getOptionalString(formData, "review_notes"),
            reviewed_by: userId,
            reviewed_at:
                getOptionalTimestamp(formData, "reviewed_at") ??
                new Date().toISOString(),
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}

export async function createRegistryLink(formData: FormData) {
    const { supabase } = await requireDataSourceStaff();
    const { error } = await supabase
        .from("intelligence_source_registry_links")
        .insert({
            data_source_id: getRequiredString(formData, "data_source_id"),
            source_kind: getAllowedValue(
                formData,
                "source_kind",
                sourceKinds,
                "methodology_source",
                "source kind"
            ),
            source_table: getOptionalString(formData, "source_table"),
            source_slug: getOptionalString(formData, "source_slug"),
            route_path: getOptionalString(formData, "route_path"),
            citation_text: getOptionalString(formData, "citation_text"),
            freshness_at: getOptionalTimestamp(formData, "freshness_at"),
            confidence_label: getAllowedValue(
                formData,
                "confidence_label",
                confidenceLabels,
                "experimental",
                "confidence label"
            ),
            quality_score: getScore(formData, "quality_score", 0),
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}

export async function createParserRun(formData: FormData) {
    const { supabase } = await requireDataSourceStaff();
    const { error } = await supabase
        .from("intelligence_source_parser_runs")
        .insert({
            data_source_id: getRequiredString(formData, "data_source_id"),
            parser_key: getRequiredString(formData, "parser_key"),
            job_name: getOptionalString(formData, "job_name"),
            job_status: getAllowedValue(
                formData,
                "job_status",
                jobStatuses,
                "queued",
                "job status"
            ),
            started_at: getOptionalTimestamp(formData, "started_at"),
            finished_at: getOptionalTimestamp(formData, "finished_at"),
            records_seen: getNonnegativeInteger(
                formData,
                "records_seen",
                0
            ),
            records_created: getNonnegativeInteger(
                formData,
                "records_created",
                0
            ),
            records_updated: getNonnegativeInteger(
                formData,
                "records_updated",
                0
            ),
            records_failed: getNonnegativeInteger(
                formData,
                "records_failed",
                0
            ),
            error_message: getOptionalString(formData, "error_message"),
        });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sources");
}
