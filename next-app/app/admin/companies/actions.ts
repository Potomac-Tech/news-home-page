"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyUniverseStaff } from "../../../lib/auth/company-universe";

const companyStatuses = [
    "watchlist",
    "active",
    "inactive",
    "delisted",
    "excluded",
] as const;

const rankingMetrics = [
    "market_cap_usd",
    "enterprise_value_usd",
    "revenue_ttm_usd",
    "space_revenue_estimate_usd",
] as const;

const rankingStatuses = ["draft", "published", "archived"] as const;

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
    const value = getRequiredString(formData, key);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Invalid ${key}.`);
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

    if (!Number.isFinite(numberValue) || numberValue < 0) {
        throw new Error(`Invalid ${key}.`);
    }

    return numberValue;
}

function getCurrencyCode(formData: FormData) {
    const value = String(formData.get("ranking_metric_currency") ?? "USD")
        .trim()
        .toUpperCase();

    if (!/^[A-Z]{3}$/.test(value)) {
        throw new Error("Invalid ranking metric currency.");
    }

    return value;
}

function getOptionalCountryCode(formData: FormData) {
    const value = String(formData.get("country_code") ?? "")
        .trim()
        .toUpperCase();

    if (!value) {
        return null;
    }

    if (!/^[A-Z]{2}$/.test(value)) {
        throw new Error("Invalid country code.");
    }

    return value;
}

function normalizeTicker(formData: FormData) {
    return getRequiredString(formData, "ticker_symbol").toUpperCase();
}

function normalizeExchange(formData: FormData) {
    return getRequiredString(formData, "exchange_code").toUpperCase();
}

function companyPayload(formData: FormData, userId: string) {
    return {
        company_name: getRequiredString(formData, "company_name"),
        ticker_symbol: normalizeTicker(formData),
        exchange_code: normalizeExchange(formData),
        country_code: getOptionalCountryCode(formData),
        website_url: getOptionalString(formData, "website_url"),
        investor_relations_url: getOptionalString(
            formData,
            "investor_relations_url"
        ),
        sector: getRequiredString(formData, "sector"),
        lunar_relevance: getOptionalString(formData, "lunar_relevance") ?? "",
        status: getAllowedValue(
            formData,
            "status",
            companyStatuses,
            "watchlist",
            "company status"
        ),
        ranking_eligible: formData.get("ranking_eligible") === "on",
        ranking_metric: getAllowedValue(
            formData,
            "ranking_metric",
            rankingMetrics,
            "market_cap_usd",
            "ranking metric"
        ),
        ranking_metric_value: getOptionalNumber(
            formData,
            "ranking_metric_value"
        ),
        ranking_metric_currency: getCurrencyCode(formData),
        ranking_metric_as_of_date: getOptionalDate(
            formData,
            "ranking_metric_as_of_date"
        ),
        ranking_source_name: getOptionalString(formData, "ranking_source_name"),
        ranking_source_url: getOptionalString(formData, "ranking_source_url"),
        ranking_source_retrieved_at: getOptionalTimestamp(
            formData,
            "ranking_source_retrieved_at"
        ),
        eligibility_notes: getOptionalString(formData, "eligibility_notes"),
        exclusion_reason: getOptionalString(formData, "exclusion_reason"),
        updated_by: userId,
    };
}

export async function createCompany(formData: FormData) {
    const { supabase, userId } = await requireCompanyUniverseStaff();
    const { error } = await supabase.from("public_space_companies").insert({
        ...companyPayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/companies");
}

export async function updateCompany(formData: FormData) {
    const { supabase, userId } = await requireCompanyUniverseStaff();
    const companyId = getRequiredString(formData, "company_id");
    const { error } = await supabase
        .from("public_space_companies")
        .update(companyPayload(formData, userId))
        .eq("id", companyId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/companies");
}

export async function createRankingSnapshot(formData: FormData) {
    const { supabase } = await requireCompanyUniverseStaff();
    const { error } = await supabase.rpc(
        "create_public_company_top20_ranking",
        {
            target_metric: getAllowedValue(
                formData,
                "target_metric",
                rankingMetrics,
                "market_cap_usd",
                "ranking metric"
            ),
            target_ranking_date: getRequiredDate(
                formData,
                "target_ranking_date"
            ),
            source_name: getRequiredString(formData, "source_name"),
            source_url: getOptionalString(formData, "source_url"),
            notes: getOptionalString(formData, "notes"),
            publish_snapshot: formData.get("publish_snapshot") === "on",
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/companies");
}

export async function updateRankingRun(formData: FormData) {
    const { supabase } = await requireCompanyUniverseStaff();
    const rankingRunId = getRequiredString(formData, "ranking_run_id");
    const publicationStatus = getAllowedValue(
        formData,
        "publication_status",
        rankingStatuses,
        "draft",
        "ranking status"
    );
    const { error } = await supabase
        .from("public_space_company_ranking_runs")
        .update({
            publication_status: publicationStatus,
            notes: getOptionalString(formData, "notes"),
            published_at:
                publicationStatus === "published"
                    ? new Date().toISOString()
                    : null,
        })
        .eq("id", rankingRunId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/companies");
}
