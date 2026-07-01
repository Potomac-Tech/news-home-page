"use server";

import { revalidatePath } from "next/cache";
import { requireSponsorStaff } from "../../../lib/auth/sponsors";

const sponsorStatuses = ["prospect", "active", "paused", "archived"] as const;
const placementStatuses = [
    "draft",
    "available",
    "reserved",
    "active",
    "retired",
] as const;
const campaignStatuses = [
    "draft",
    "reserved",
    "active",
    "completed",
    "canceled",
] as const;
const campaignPlacementStatuses = [
    "planned",
    "live",
    "paused",
    "completed",
    "canceled",
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

    if (!allowedValues.includes(value)) {
        throw new Error(`Invalid ${errorLabel}.`);
    }

    return value;
}

function getDateValue(formData: FormData, key: string) {
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

function getMoneyCents(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return 0;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Invalid ${key}.`);
    }

    return Math.round(amount * 100);
}

function getOptionalMoneyCents(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return null;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Invalid ${key}.`);
    }

    return Math.round(amount * 100);
}

function getPercent(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return 0;
    }

    const percent = Number(value);

    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new Error(`Invalid ${key}.`);
    }

    return percent;
}

function getOptionalPercent(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return null;
    }

    const percent = Number(value);

    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new Error(`Invalid ${key}.`);
    }

    return percent;
}

function getOptionalInteger(formData: FormData, key: string) {
    const value = String(formData.get(key) ?? "").trim();

    if (!value) {
        return null;
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

function getInteger(formData: FormData, key: string) {
    return getOptionalInteger(formData, key) ?? 0;
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

function getStringList(formData: FormData, key: string) {
    return String(formData.get(key) ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function getReportingFields(formData: FormData) {
    const fields = getStringList(formData, "reporting_fields");

    return fields.length ? fields : ["impressions", "clicks", "conversions"];
}

function sponsorPayload(formData: FormData, userId: string) {
    return {
        name: getRequiredString(formData, "name"),
        slug: getRequiredString(formData, "slug"),
        status: getAllowedValue(
            formData,
            "status",
            sponsorStatuses,
            "prospect",
            "sponsor status"
        ),
        website_url: getOptionalString(formData, "website_url"),
        industry: getOptionalString(formData, "industry"),
        primary_contact_name: getOptionalString(
            formData,
            "primary_contact_name"
        ),
        primary_contact_email: getOptionalString(
            formData,
            "primary_contact_email"
        ),
        billing_contact_email: getOptionalString(
            formData,
            "billing_contact_email"
        ),
        notes: getOptionalString(formData, "notes"),
        updated_by: userId,
    };
}

function placementPayload(formData: FormData, userId: string) {
    return {
        placement_key: getRequiredString(formData, "placement_key"),
        name: getRequiredString(formData, "name"),
        surface: getRequiredString(formData, "surface"),
        description: getRequiredString(formData, "description"),
        format: getRequiredString(formData, "format"),
        dimensions: getOptionalString(formData, "dimensions"),
        status: getAllowedValue(
            formData,
            "status",
            placementStatuses,
            "draft",
            "placement status"
        ),
        default_rate_cents: getMoneyCents(formData, "default_rate"),
        currency_code: getCurrencyCode(formData),
        programmatic_allowed: formData.get("programmatic_allowed") === "on",
        reporting_fields: getReportingFields(formData),
        notes: getOptionalString(formData, "notes"),
        updated_by: userId,
    };
}

function campaignPayload(formData: FormData, userId: string) {
    const grossContractValueCents = getMoneyCents(
        formData,
        "gross_contract_value"
    );
    const discountPercent = getPercent(formData, "discount_percent");
    const netContractValueCents =
        getOptionalMoneyCents(formData, "net_contract_value") ??
        Math.round(grossContractValueCents * ((100 - discountPercent) / 100));

    return {
        sponsor_id: getRequiredString(formData, "sponsor_id"),
        name: getRequiredString(formData, "name"),
        status: getAllowedValue(
            formData,
            "status",
            campaignStatuses,
            "draft",
            "campaign status"
        ),
        starts_at: getDateValue(formData, "starts_at"),
        ends_at: getDateValue(formData, "ends_at"),
        gross_contract_value_cents: grossContractValueCents,
        discount_percent: discountPercent,
        discount_reason: getOptionalString(formData, "discount_reason"),
        net_contract_value_cents: netContractValueCents,
        currency_code: getCurrencyCode(formData),
        external_order_id: getOptionalString(formData, "external_order_id"),
        reporting_owner: getOptionalString(formData, "reporting_owner"),
        reporting_notes: getOptionalString(formData, "reporting_notes"),
        last_reported_at: getOptionalTimestamp(formData, "last_reported_at"),
        updated_by: userId,
    };
}

function campaignPlacementPayload(formData: FormData, userId: string) {
    return {
        campaign_id: getRequiredString(formData, "campaign_id"),
        placement_id: getRequiredString(formData, "placement_id"),
        status: getAllowedValue(
            formData,
            "status",
            campaignPlacementStatuses,
            "planned",
            "campaign placement status"
        ),
        starts_at: getDateValue(formData, "starts_at"),
        ends_at: getDateValue(formData, "ends_at"),
        priority: getInteger(formData, "priority"),
        share_of_voice_percent: getOptionalPercent(
            formData,
            "share_of_voice_percent"
        ),
        flight_rate_cents: getMoneyCents(formData, "flight_rate"),
        booked_impressions: getOptionalInteger(formData, "booked_impressions"),
        delivered_impressions: getInteger(formData, "delivered_impressions"),
        clicks: getInteger(formData, "clicks"),
        conversions: getInteger(formData, "conversions"),
        creative_url: getOptionalString(formData, "creative_url"),
        creative_alt_text: getOptionalString(formData, "creative_alt_text"),
        reporting_url: getOptionalString(formData, "reporting_url"),
        utm_campaign: getOptionalString(formData, "utm_campaign"),
        notes: getOptionalString(formData, "notes"),
        updated_by: userId,
    };
}

export async function createSponsor(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const { error } = await supabase.from("sponsors").insert({
        ...sponsorPayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function updateSponsor(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const sponsorId = getRequiredString(formData, "sponsor_id");
    const { error } = await supabase
        .from("sponsors")
        .update(sponsorPayload(formData, userId))
        .eq("id", sponsorId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function createPlacement(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const { error } = await supabase.from("ad_placements").insert({
        ...placementPayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function updatePlacement(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const placementId = getRequiredString(formData, "placement_id");
    const { error } = await supabase
        .from("ad_placements")
        .update(placementPayload(formData, userId))
        .eq("id", placementId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function createCampaign(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const { error } = await supabase.from("sponsor_campaigns").insert({
        ...campaignPayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function updateCampaign(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const campaignId = getRequiredString(formData, "campaign_id");
    const { error } = await supabase
        .from("sponsor_campaigns")
        .update(campaignPayload(formData, userId))
        .eq("id", campaignId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function createCampaignPlacement(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const { error } = await supabase.from("sponsor_campaign_placements").insert({
        ...campaignPlacementPayload(formData, userId),
        created_by: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}

export async function updateCampaignPlacement(formData: FormData) {
    const { supabase, userId } = await requireSponsorStaff();
    const campaignPlacementId = getRequiredString(
        formData,
        "campaign_placement_id"
    );
    const { error } = await supabase
        .from("sponsor_campaign_placements")
        .update(campaignPlacementPayload(formData, userId))
        .eq("id", campaignPlacementId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/sponsors");
}
