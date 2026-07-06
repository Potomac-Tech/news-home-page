import type { Metadata } from "next";
import { requireSponsorStaff } from "../../../lib/auth/sponsors";
import {
    createCampaign,
    createCampaignPlacement,
    createPlacement,
    createSponsor,
    updateCampaign,
    updateCampaignPlacement,
    updatePlacement,
    updateSponsor,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Sponsor Inventory Admin",
};

type Sponsor = {
    id: string;
    name: string;
    slug: string;
    status: string;
    website_url: string | null;
    industry: string | null;
    primary_contact_name: string | null;
    primary_contact_email: string | null;
    billing_contact_email: string | null;
    notes: string | null;
    updated_at: string;
};

type Placement = {
    id: string;
    placement_key: string;
    name: string;
    surface: string;
    description: string;
    format: string;
    dimensions: string | null;
    status: string;
    default_rate_cents: number;
    currency_code: string;
    programmatic_allowed: boolean;
    reporting_fields: unknown;
    notes: string | null;
    updated_at: string;
};

type Campaign = {
    id: string;
    sponsor_id: string;
    name: string;
    status: string;
    starts_at: string;
    ends_at: string;
    gross_contract_value_cents: number;
    discount_percent: number;
    discount_reason: string | null;
    net_contract_value_cents: number;
    currency_code: string;
    external_order_id: string | null;
    reporting_owner: string | null;
    reporting_notes: string | null;
    last_reported_at: string | null;
    updated_at: string;
};

type CampaignPlacement = {
    id: string;
    campaign_id: string;
    placement_id: string;
    status: string;
    starts_at: string;
    ends_at: string;
    priority: number;
    share_of_voice_percent: number | null;
    flight_rate_cents: number;
    booked_impressions: number | null;
    delivered_impressions: number;
    clicks: number;
    conversions: number;
    creative_url: string | null;
    creative_alt_text: string | null;
    reporting_url: string | null;
    utm_campaign: string | null;
    notes: string | null;
    updated_at: string;
};

const sponsorStatuses = ["prospect", "active", "paused", "archived"];
const placementStatuses = [
    "draft",
    "available",
    "reserved",
    "active",
    "retired",
];
const campaignStatuses = [
    "draft",
    "reserved",
    "active",
    "completed",
    "canceled",
];
const campaignPlacementStatuses = [
    "planned",
    "live",
    "paused",
    "completed",
    "canceled",
];

const inputClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

const textareaClass =
    "mt-2 w-full rounded border border-white/15 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-500 focus:border-potomac-gold";

function FieldLabel({ children }: { children: string }) {
    return (
        <label className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
            {children}
        </label>
    );
}

function statusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleString();
}

function toDateValue(value: string | null | undefined) {
    return value ? value.slice(0, 10) : "";
}

function toDateTimeLocal(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 16);
}

function centsToDollars(value: number | null | undefined) {
    return ((value ?? 0) / 100).toFixed(2);
}

function formatCurrency(cents: number, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function parseStringArray(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function StatusSelect({
    name = "status",
    options,
    defaultValue,
}: {
    name?: string;
    options: string[];
    defaultValue: string;
}) {
    return (
        <select name={name} defaultValue={defaultValue} className={inputClass}>
            {options.map((option) => (
                <option key={option} value={option}>
                    {statusLabel(option)}
                </option>
            ))}
        </select>
    );
}

function SponsorSelect({
    sponsors,
    defaultValue,
}: {
    sponsors: Sponsor[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="sponsor_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select sponsor
            </option>
            {sponsors.map((sponsor) => (
                <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.name}
                </option>
            ))}
        </select>
    );
}

function CampaignSelect({
    campaigns,
    defaultValue,
}: {
    campaigns: Campaign[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="campaign_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select campaign
            </option>
            {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                </option>
            ))}
        </select>
    );
}

function PlacementSelect({
    placements,
    defaultValue,
}: {
    placements: Placement[];
    defaultValue?: string;
}) {
    return (
        <select
            required
            name="placement_id"
            defaultValue={defaultValue ?? ""}
            className={inputClass}
        >
            <option value="" disabled>
                Select placement
            </option>
            {placements.map((placement) => (
                <option key={placement.id} value={placement.id}>
                    {placement.name} ({placement.surface})
                </option>
            ))}
        </select>
    );
}

function SponsorFormFields({ sponsor }: { sponsor?: Sponsor }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Sponsor name</FieldLabel>
                <input
                    required
                    name="name"
                    defaultValue={sponsor?.name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Slug</FieldLabel>
                <input
                    required
                    name="slug"
                    defaultValue={sponsor?.slug ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <StatusSelect
                    options={sponsorStatuses}
                    defaultValue={sponsor?.status ?? "prospect"}
                />
            </div>
            <div>
                <FieldLabel>Industry</FieldLabel>
                <input
                    name="industry"
                    defaultValue={sponsor?.industry ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Website URL</FieldLabel>
                <input
                    name="website_url"
                    defaultValue={sponsor?.website_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Primary contact</FieldLabel>
                <input
                    name="primary_contact_name"
                    defaultValue={sponsor?.primary_contact_name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Primary contact email</FieldLabel>
                <input
                    type="email"
                    name="primary_contact_email"
                    defaultValue={sponsor?.primary_contact_email ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Billing contact email</FieldLabel>
                <input
                    type="email"
                    name="billing_contact_email"
                    defaultValue={sponsor?.billing_contact_email ?? ""}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                    name="notes"
                    rows={3}
                    defaultValue={sponsor?.notes ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function PlacementFormFields({ placement }: { placement?: Placement }) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Placement name</FieldLabel>
                <input
                    required
                    name="name"
                    defaultValue={placement?.name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Placement key</FieldLabel>
                <input
                    required
                    name="placement_key"
                    defaultValue={placement?.placement_key ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <StatusSelect
                    options={placementStatuses}
                    defaultValue={placement?.status ?? "draft"}
                />
            </div>
            <div>
                <FieldLabel>Surface</FieldLabel>
                <input
                    required
                    name="surface"
                    placeholder="Homepage, article, events"
                    defaultValue={placement?.surface ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Format</FieldLabel>
                <input
                    required
                    name="format"
                    defaultValue={placement?.format ?? "native"}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Dimensions</FieldLabel>
                <input
                    name="dimensions"
                    placeholder="728x90, native rail"
                    defaultValue={placement?.dimensions ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Default rate</FieldLabel>
                <input
                    name="default_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={centsToDollars(placement?.default_rate_cents)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Currency</FieldLabel>
                <input
                    name="currency_code"
                    maxLength={3}
                    defaultValue={placement?.currency_code ?? "USD"}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <label className="flex items-center gap-3 text-sm text-potomac-cream/75">
                    <input
                        type="checkbox"
                        name="programmatic_allowed"
                        defaultChecked={placement?.programmatic_allowed ?? false}
                        className="h-4 w-4 accent-potomac-gold"
                    />
                    Programmatic fallback allowed
                </label>
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <textarea
                    required
                    name="description"
                    rows={3}
                    defaultValue={placement?.description ?? ""}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Reporting fields</FieldLabel>
                <textarea
                    name="reporting_fields"
                    rows={3}
                    defaultValue={parseStringArray(
                        placement?.reporting_fields
                    ).join("\n")}
                    className={textareaClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                    name="notes"
                    rows={3}
                    defaultValue={placement?.notes ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function CampaignFormFields({
    campaign,
    sponsors,
}: {
    campaign?: Campaign;
    sponsors: Sponsor[];
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Campaign name</FieldLabel>
                <input
                    required
                    name="name"
                    defaultValue={campaign?.name ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Sponsor</FieldLabel>
                <SponsorSelect sponsors={sponsors} defaultValue={campaign?.sponsor_id} />
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <StatusSelect
                    options={campaignStatuses}
                    defaultValue={campaign?.status ?? "draft"}
                />
            </div>
            <div>
                <FieldLabel>External order ID</FieldLabel>
                <input
                    name="external_order_id"
                    defaultValue={campaign?.external_order_id ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Starts at</FieldLabel>
                <input
                    required
                    type="date"
                    name="starts_at"
                    defaultValue={toDateValue(campaign?.starts_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Ends at</FieldLabel>
                <input
                    required
                    type="date"
                    name="ends_at"
                    defaultValue={toDateValue(campaign?.ends_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Gross value</FieldLabel>
                <input
                    name="gross_contract_value"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={centsToDollars(
                        campaign?.gross_contract_value_cents
                    )}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Net value</FieldLabel>
                <input
                    name="net_contract_value"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={centsToDollars(
                        campaign?.net_contract_value_cents
                    )}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Discount percent</FieldLabel>
                <input
                    name="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={campaign?.discount_percent ?? 0}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Currency</FieldLabel>
                <input
                    name="currency_code"
                    maxLength={3}
                    defaultValue={campaign?.currency_code ?? "USD"}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Discount reason</FieldLabel>
                <textarea
                    name="discount_reason"
                    rows={2}
                    defaultValue={campaign?.discount_reason ?? ""}
                    className={textareaClass}
                />
            </div>
            <div>
                <FieldLabel>Reporting owner</FieldLabel>
                <input
                    name="reporting_owner"
                    defaultValue={campaign?.reporting_owner ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Last reported at</FieldLabel>
                <input
                    type="datetime-local"
                    name="last_reported_at"
                    defaultValue={toDateTimeLocal(campaign?.last_reported_at)}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Reporting notes</FieldLabel>
                <textarea
                    name="reporting_notes"
                    rows={3}
                    defaultValue={campaign?.reporting_notes ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function CampaignPlacementFormFields({
    campaignPlacement,
    campaigns,
    placements,
    defaultCampaignId,
}: {
    campaignPlacement?: CampaignPlacement;
    campaigns: Campaign[];
    placements: Placement[];
    defaultCampaignId?: string;
}) {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <div>
                <FieldLabel>Campaign</FieldLabel>
                <CampaignSelect
                    campaigns={campaigns}
                    defaultValue={
                        campaignPlacement?.campaign_id ?? defaultCampaignId
                    }
                />
            </div>
            <div>
                <FieldLabel>Placement</FieldLabel>
                <PlacementSelect
                    placements={placements}
                    defaultValue={campaignPlacement?.placement_id}
                />
            </div>
            <div>
                <FieldLabel>Status</FieldLabel>
                <StatusSelect
                    options={campaignPlacementStatuses}
                    defaultValue={campaignPlacement?.status ?? "planned"}
                />
            </div>
            <div>
                <FieldLabel>Priority</FieldLabel>
                <input
                    name="priority"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={campaignPlacement?.priority ?? 100}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Starts at</FieldLabel>
                <input
                    required
                    type="date"
                    name="starts_at"
                    defaultValue={toDateValue(campaignPlacement?.starts_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Ends at</FieldLabel>
                <input
                    required
                    type="date"
                    name="ends_at"
                    defaultValue={toDateValue(campaignPlacement?.ends_at)}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Flight rate</FieldLabel>
                <input
                    name="flight_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={centsToDollars(
                        campaignPlacement?.flight_rate_cents
                    )}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Share of voice %</FieldLabel>
                <input
                    name="share_of_voice_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={campaignPlacement?.share_of_voice_percent ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Booked impressions</FieldLabel>
                <input
                    name="booked_impressions"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={campaignPlacement?.booked_impressions ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Delivered impressions</FieldLabel>
                <input
                    name="delivered_impressions"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={campaignPlacement?.delivered_impressions ?? 0}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Clicks</FieldLabel>
                <input
                    name="clicks"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={campaignPlacement?.clicks ?? 0}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Conversions</FieldLabel>
                <input
                    name="conversions"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={campaignPlacement?.conversions ?? 0}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Creative URL</FieldLabel>
                <input
                    name="creative_url"
                    defaultValue={campaignPlacement?.creative_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Reporting URL</FieldLabel>
                <input
                    name="reporting_url"
                    defaultValue={campaignPlacement?.reporting_url ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>Creative alt text</FieldLabel>
                <input
                    name="creative_alt_text"
                    defaultValue={campaignPlacement?.creative_alt_text ?? ""}
                    className={inputClass}
                />
            </div>
            <div>
                <FieldLabel>UTM campaign</FieldLabel>
                <input
                    name="utm_campaign"
                    defaultValue={campaignPlacement?.utm_campaign ?? ""}
                    className={inputClass}
                />
            </div>
            <div className="lg:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                    name="notes"
                    rows={3}
                    defaultValue={campaignPlacement?.notes ?? ""}
                    className={textareaClass}
                />
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="glass-card rounded p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                {label}
            </p>
            <p className="mt-3 font-serif text-3xl text-white">{value}</p>
            <p className="mt-2 text-sm leading-6 text-potomac-cream/65">
                {detail}
            </p>
        </div>
    );
}

export default async function SponsorInventoryAdminPage() {
    const { supabase } = await requireSponsorStaff();
    const { data: sponsorData, error: sponsorError } = await supabase
        .from("sponsors")
        .select(
            "id,name,slug,status,website_url,industry,primary_contact_name,primary_contact_email,billing_contact_email,notes,updated_at"
        )
        .order("name", { ascending: true });

    if (sponsorError) {
        throw new Error(sponsorError.message);
    }

    const { data: placementData, error: placementError } = await supabase
        .from("ad_placements")
        .select(
            "id,placement_key,name,surface,description,format,dimensions,status,default_rate_cents,currency_code,programmatic_allowed,reporting_fields,notes,updated_at"
        )
        .order("surface", { ascending: true })
        .order("name", { ascending: true });

    if (placementError) {
        throw new Error(placementError.message);
    }

    const { data: campaignData, error: campaignError } = await supabase
        .from("sponsor_campaigns")
        .select(
            "id,sponsor_id,name,status,starts_at,ends_at,gross_contract_value_cents,discount_percent,discount_reason,net_contract_value_cents,currency_code,external_order_id,reporting_owner,reporting_notes,last_reported_at,updated_at"
        )
        .order("starts_at", { ascending: false });

    if (campaignError) {
        throw new Error(campaignError.message);
    }

    const { data: campaignPlacementData, error: campaignPlacementError } =
        await supabase
            .from("sponsor_campaign_placements")
            .select(
                "id,campaign_id,placement_id,status,starts_at,ends_at,priority,share_of_voice_percent,flight_rate_cents,booked_impressions,delivered_impressions,clicks,conversions,creative_url,creative_alt_text,reporting_url,utm_campaign,notes,updated_at"
            )
            .order("starts_at", { ascending: false });

    if (campaignPlacementError) {
        throw new Error(campaignPlacementError.message);
    }

    const sponsors = (sponsorData ?? []) as Sponsor[];
    const placements = (placementData ?? []) as Placement[];
    const campaigns = (campaignData ?? []) as Campaign[];
    const campaignPlacements = (campaignPlacementData ?? []) as CampaignPlacement[];
    const sponsorsById = new Map(
        sponsors.map((sponsor) => [sponsor.id, sponsor])
    );
    const placementsById = new Map(
        placements.map((placement) => [placement.id, placement])
    );
    const campaignPlacementsByCampaignId = new Map<string, CampaignPlacement[]>();

    for (const campaignPlacement of campaignPlacements) {
        const items =
            campaignPlacementsByCampaignId.get(
                campaignPlacement.campaign_id
            ) ?? [];
        items.push(campaignPlacement);
        campaignPlacementsByCampaignId.set(campaignPlacement.campaign_id, items);
    }

    const liveCampaigns = campaigns.filter((campaign) =>
        ["reserved", "active"].includes(campaign.status)
    );
    const activeSponsors = sponsors.filter((sponsor) => sponsor.status === "active");

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="max-w-4xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                        Sponsor operations
                    </p>
                    <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                        Sponsor Inventory Admin
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                        Manage direct-sold sponsors, ad placements, campaign
                        dates, discounts, flight status, and delivery reporting
                        fields before public ad surfaces go live.
                    </p>
                </div>

                <div className="mt-10 grid gap-5 md:grid-cols-4">
                    <StatCard
                        label="Sponsors"
                        value={String(sponsors.length)}
                        detail={`${activeSponsors.length} active sponsor accounts`}
                    />
                    <StatCard
                        label="Placements"
                        value={String(placements.length)}
                        detail={`${placements.filter((item) => item.programmatic_allowed).length} allow fallback`}
                    />
                    <StatCard
                        label="Campaigns"
                        value={String(campaigns.length)}
                        detail={`${liveCampaigns.length} reserved or active`}
                    />
                    <StatCard
                        label="Flights"
                        value={String(campaignPlacements.length)}
                        detail="Booked placement line items"
                    />
                </div>

                <div className="mt-12 grid gap-6 xl:grid-cols-2">
                    <form action={createSponsor} className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            New Sponsor
                        </h2>
                        <div className="mt-6">
                            <SponsorFormFields />
                        </div>
                        <button
                            type="submit"
                            className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Create sponsor
                        </button>
                    </form>

                    <form action={createPlacement} className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            New Placement
                        </h2>
                        <div className="mt-6">
                            <PlacementFormFields />
                        </div>
                        <button
                            type="submit"
                            className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Create placement
                        </button>
                    </form>

                    <form action={createCampaign} className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            New Campaign
                        </h2>
                        <div className="mt-6">
                            <CampaignFormFields sponsors={sponsors} />
                        </div>
                        <button
                            type="submit"
                            disabled={!sponsors.length}
                            className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Create campaign
                        </button>
                    </form>

                    <form
                        action={createCampaignPlacement}
                        className="glass-card rounded p-6"
                    >
                        <h2 className="font-serif text-2xl text-white">
                            New Flight
                        </h2>
                        <div className="mt-6">
                            <CampaignPlacementFormFields
                                campaigns={campaigns}
                                placements={placements}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!campaigns.length || !placements.length}
                            className="mt-6 rounded bg-potomac-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Create flight
                        </button>
                    </form>
                </div>

                <div className="mt-12 grid gap-6 xl:grid-cols-2">
                    <section>
                        <h2 className="font-serif text-3xl text-white">
                            Sponsors
                        </h2>
                        <div className="mt-5 space-y-5">
                            {sponsors.length === 0 ? (
                                <div className="glass-card rounded p-6 text-potomac-cream/75">
                                    No sponsors yet.
                                </div>
                            ) : (
                                sponsors.map((sponsor) => (
                                    <article
                                        key={sponsor.id}
                                        className="glass-card rounded p-6"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="font-serif text-2xl text-white">
                                                    {sponsor.name}
                                                </h3>
                                                <p className="mt-1 text-sm text-potomac-cream/55">
                                                    {sponsor.industry ??
                                                        "Industry not set"}{" "}
                                                    | Updated{" "}
                                                    {formatDateTime(
                                                        sponsor.updated_at
                                                    )}
                                                </p>
                                            </div>
                                            <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                {statusLabel(sponsor.status)}
                                            </span>
                                        </div>
                                        <form action={updateSponsor} className="mt-6">
                                            <input
                                                type="hidden"
                                                name="sponsor_id"
                                                value={sponsor.id}
                                            />
                                            <SponsorFormFields sponsor={sponsor} />
                                            <button
                                                type="submit"
                                                className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                            >
                                                Save sponsor
                                            </button>
                                        </form>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>

                    <section>
                        <h2 className="font-serif text-3xl text-white">
                            Placements
                        </h2>
                        <div className="mt-5 space-y-5">
                            {placements.length === 0 ? (
                                <div className="glass-card rounded p-6 text-potomac-cream/75">
                                    No placements yet.
                                </div>
                            ) : (
                                placements.map((placement) => (
                                    <article
                                        key={placement.id}
                                        className="glass-card rounded p-6"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="font-serif text-2xl text-white">
                                                    {placement.name}
                                                </h3>
                                                <p className="mt-1 text-sm text-potomac-cream/55">
                                                    {placement.surface} |{" "}
                                                    {formatCurrency(
                                                        placement.default_rate_cents,
                                                        placement.currency_code
                                                    )}{" "}
                                                    default
                                                </p>
                                            </div>
                                            <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                {statusLabel(placement.status)}
                                            </span>
                                        </div>
                                        <form action={updatePlacement} className="mt-6">
                                            <input
                                                type="hidden"
                                                name="placement_id"
                                                value={placement.id}
                                            />
                                            <PlacementFormFields
                                                placement={placement}
                                            />
                                            <button
                                                type="submit"
                                                className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                            >
                                                Save placement
                                            </button>
                                        </form>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                <section className="mt-12">
                    <h2 className="font-serif text-3xl text-white">
                        Campaigns And Flights
                    </h2>
                    <div className="mt-5 space-y-6">
                        {campaigns.length === 0 ? (
                            <div className="glass-card rounded p-6 text-potomac-cream/75">
                                No campaigns yet.
                            </div>
                        ) : (
                            campaigns.map((campaign) => {
                                const sponsor = sponsorsById.get(campaign.sponsor_id);
                                const campaignFlights =
                                    campaignPlacementsByCampaignId.get(
                                        campaign.id
                                    ) ?? [];

                                return (
                                    <article
                                        key={campaign.id}
                                        className="glass-card rounded p-6"
                                    >
                                        <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="font-serif text-2xl text-white">
                                                        {campaign.name}
                                                    </h3>
                                                    <span className="rounded border border-potomac-gold/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-potomac-gold">
                                                        {statusLabel(
                                                            campaign.status
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-potomac-cream/60">
                                                    {sponsor?.name ??
                                                        "Sponsor missing"}{" "}
                                                    | {formatDate(campaign.starts_at)} to{" "}
                                                    {formatDate(campaign.ends_at)}
                                                </p>
                                            </div>
                                            <dl className="grid gap-3 text-sm text-potomac-cream/70 sm:grid-cols-2">
                                                <div>
                                                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        Gross
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {formatCurrency(
                                                            campaign.gross_contract_value_cents,
                                                            campaign.currency_code
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        Net
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {formatCurrency(
                                                            campaign.net_contract_value_cents,
                                                            campaign.currency_code
                                                        )}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        Discount
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {campaign.discount_percent}%
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                        Reported
                                                    </dt>
                                                    <dd className="mt-1">
                                                        {formatDateTime(
                                                            campaign.last_reported_at
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>

                                        <details className="mt-6 border-y border-white/10 py-5">
                                            <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                Edit campaign
                                            </summary>
                                            <form
                                                action={updateCampaign}
                                                className="mt-6"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="campaign_id"
                                                    value={campaign.id}
                                                />
                                                <CampaignFormFields
                                                    campaign={campaign}
                                                    sponsors={sponsors}
                                                />
                                                <button
                                                    type="submit"
                                                    className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                >
                                                    Save campaign
                                                </button>
                                            </form>
                                        </details>

                                        <div className="mt-6">
                                            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                                Flights
                                            </h4>
                                            <div className="mt-4 space-y-4">
                                                {campaignFlights.length === 0 ? (
                                                    <p className="rounded border border-white/10 p-4 text-sm text-potomac-cream/65">
                                                        No placement flights booked
                                                        for this campaign.
                                                    </p>
                                                ) : (
                                                    campaignFlights.map(
                                                        (campaignPlacement) => {
                                                            const placement =
                                                                placementsById.get(
                                                                    campaignPlacement.placement_id
                                                                );

                                                            return (
                                                                <details
                                                                    key={
                                                                        campaignPlacement.id
                                                                    }
                                                                    className="rounded border border-white/10 p-5"
                                                                >
                                                                    <summary className="cursor-pointer">
                                                                        <span className="font-semibold text-white">
                                                                            {placement?.name ??
                                                                                "Placement missing"}
                                                                        </span>
                                                                        <span className="ml-3 text-xs uppercase tracking-[0.14em] text-potomac-cream/55">
                                                                            {statusLabel(
                                                                                campaignPlacement.status
                                                                            )}{" "}
                                                                            |{" "}
                                                                            {formatDate(
                                                                                campaignPlacement.starts_at
                                                                            )}{" "}
                                                                            to{" "}
                                                                            {formatDate(
                                                                                campaignPlacement.ends_at
                                                                            )}
                                                                        </span>
                                                                    </summary>
                                                                    <dl className="mt-4 grid gap-3 text-sm text-potomac-cream/70 md:grid-cols-4">
                                                                        <div>
                                                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                                                Booked
                                                                            </dt>
                                                                            <dd className="mt-1">
                                                                                {campaignPlacement.booked_impressions ??
                                                                                    "Not set"}
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                                                Delivered
                                                                            </dt>
                                                                            <dd className="mt-1">
                                                                                {
                                                                                    campaignPlacement.delivered_impressions
                                                                                }
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                                                Clicks
                                                                            </dt>
                                                                            <dd className="mt-1">
                                                                                {
                                                                                    campaignPlacement.clicks
                                                                                }
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                                                                Conversions
                                                                            </dt>
                                                                            <dd className="mt-1">
                                                                                {
                                                                                    campaignPlacement.conversions
                                                                                }
                                                                            </dd>
                                                                        </div>
                                                                    </dl>
                                                                    <form
                                                                        action={
                                                                            updateCampaignPlacement
                                                                        }
                                                                        className="mt-5"
                                                                    >
                                                                        <input
                                                                            type="hidden"
                                                                            name="campaign_placement_id"
                                                                            value={
                                                                                campaignPlacement.id
                                                                            }
                                                                        />
                                                                        <CampaignPlacementFormFields
                                                                            campaignPlacement={
                                                                                campaignPlacement
                                                                            }
                                                                            campaigns={
                                                                                campaigns
                                                                            }
                                                                            placements={
                                                                                placements
                                                                            }
                                                                        />
                                                                        <button
                                                                            type="submit"
                                                                            className="mt-6 rounded border border-potomac-gold/50 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                                                        >
                                                                            Save flight
                                                                        </button>
                                                                    </form>
                                                                </details>
                                                            );
                                                        }
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </section>
    );
}
