import { potomacBrand } from "./brand";
import type { createClient } from "../../lib/supabase/server";
import type { ProfileGateState } from "../../lib/auth/profile-completion";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type HomepageCarouselSlide = {
    id: string;
    articleId: string | null;
    slideType: string;
    title: string;
    summary: string;
    visualAssetUrl: string;
    visualAssetAlt: string;
    ctaLabel: string;
    ctaRoute: string;
    minimumTier: string;
    isRequired: boolean;
    isPinned: boolean;
    displayRank: number;
    sourceNote: string;
    freshnessAt: string;
    expiresAt: string;
};

export type CarouselAudience = "anonymous" | "unverified" | "profile_incomplete" | "explorer" | "scout" | "command" | "staff";
export type CarouselViewer = { audience: CarouselAudience; userId: string | null; personalizationEnabled: boolean; qualifyingEvents: number };

const tierRank: Record<string, number> = { public: 0, member: 1, scout: 2, command: 3 };

function accessPrompt(audience: CarouselAudience): HomepageCarouselSlide | null {
    const prompts: Partial<Record<CarouselAudience, { title: string; summary: string; label: string; route: string }>> = {
        anonymous: { title: "Join the lunar intelligence network", summary: "Create a free Explorer account to read full briefings and build your lunar industry watchlist.", label: "Join Explorer", route: "/request-access" },
        unverified: { title: "Verify your email", summary: "Confirm your email address to continue into the Cabeus Explorer member workspace.", label: "Verify email", route: "/account/verify?next=%2F" },
        profile_incomplete: { title: "Complete your member profile", summary: "Add the minimum operating profile details required to unlock reviewed member intelligence.", label: "Complete profile", route: "/account/profile/complete?next=%2F" },
    };
    const prompt = prompts[audience];
    if (!prompt) return null;
    return {
        id: `access:${audience}`, articleId: null, slideType: "access_prompt", title: prompt.title,
        summary: prompt.summary, visualAssetUrl: potomacBrand.assets.cabeusHero,
        visualAssetAlt: "Cabeus Explorer lunar industrial intelligence terminal", ctaLabel: prompt.label,
        ctaRoute: prompt.route, minimumTier: "public", isRequired: true, isPinned: true, displayRank: 1,
        sourceNote: "System access-state prompt.", freshnessAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
}

export function resolveCarouselSlides({ inventory, customCards = [], viewer, limit = 5 }: {
    inventory: HomepageCarouselSlide[]; customCards?: HomepageCarouselSlide[]; viewer: CarouselViewer; limit?: number;
}) {
    const publicOnly = ["anonymous", "unverified", "profile_incomplete"].includes(viewer.audience);
    if (publicOnly) {
        const publicSlides = inventory.filter((slide) => slide.minimumTier === "public").map((slide) =>
            viewer.audience === "anonymous" && !slide.isRequired
                ? { ...slide, ctaLabel: "Join to read", ctaRoute: `/request-access?next=${encodeURIComponent(slide.ctaRoute)}` }
                : slide
        );
        const prompt = accessPrompt(viewer.audience);
        return [...publicSlides.filter((slide) => slide.isRequired), ...(prompt ? [prompt] : []), ...publicSlides.filter((slide) => !slide.isRequired)].slice(0, limit);
    }
    const audienceTier = viewer.audience === "explorer" ? "member" : viewer.audience === "scout" ? "scout" : "command";
    const eligible = inventory.filter((slide) =>
        tierRank[slide.minimumTier] <= tierRank[audienceTier]
        || (viewer.audience === "explorer" && slide.slideType === "paid_tier_teaser")
    );
    const required = eligible.filter((slide) => slide.isRequired);
    const optional = eligible.filter((slide) => !slide.isRequired && slide.slideType !== "paid_tier_teaser");
    const paidTeasers = viewer.audience === "explorer" ? inventory.filter((slide) => slide.slideType === "paid_tier_teaser" && !slide.isRequired) : [];
    const canPersonalize = viewer.personalizationEnabled && viewer.qualifyingEvents >= 5;
    const tierCards = viewer.audience === "explorer" ? paidTeasers : [];
    const ordered = canPersonalize ? [...required, ...customCards, ...tierCards, ...optional] : [...required, ...tierCards, ...optional];
    return Array.from(new Map(ordered.map((slide) => [slide.id, slide])).values()).slice(0, limit);
}

export function audienceFromGate(state: ProfileGateState): CarouselAudience {
    if (state === "signed_out") return "anonymous";
    if (state === "email_unverified") return "unverified";
    if (state === "profile_incomplete") return "profile_incomplete";
    return "explorer";
}

export async function loadCarouselViewer(supabase: SupabaseServerClient, state: ProfileGateState, userId: string | null): Promise<CarouselViewer> {
    let audience = audienceFromGate(state);
    if (state !== "ready" || !userId) return { audience, userId, personalizationEnabled: false, qualifyingEvents: 0 };
    const now = new Date().toISOString();
    const [{ data: roles }, { data: preference }, events] = await Promise.all([
        supabase.from("member_role_assignments").select("role_id").eq("user_id", userId).or(`expires_at.is.null,expires_at.gt.${now}`),
        supabase.from("member_personalization_preferences").select("behavior_ranking_enabled").maybeSingle(),
        supabase.from("member_engagement_events").select("id", { count: "exact", head: true }).gte("occurred_at", new Date(Date.now() - 90 * 86_400_000).toISOString()).gt("expires_at", now),
    ]);
    const roleIds = new Set((roles ?? []).map((role) => role.role_id));
    if (["admin", "editor", "analyst"].some((role) => roleIds.has(role))) audience = "staff";
    else if (roleIds.has("command_user")) audience = "command";
    else if (roleIds.has("scout")) audience = "scout";
    return { audience, userId, personalizationEnabled: preference?.behavior_ranking_enabled ?? true, qualifyingEvents: events.count ?? 0 };
}

function mapSlide(row: Record<string, unknown>): HomepageCarouselSlide {
    return {
        id: String(row.id),
        articleId: typeof row.article_id === "string" ? row.article_id : null,
        slideType: String(row.slide_type),
        title: String(row.title),
        summary: String(row.summary),
        visualAssetUrl: String(row.visual_asset_url),
        visualAssetAlt: String(row.visual_asset_alt),
        ctaLabel: String(row.cta_label),
        ctaRoute: String(row.cta_route),
        minimumTier: String(row.minimum_tier),
        isRequired: Boolean(row.is_required),
        isPinned: Boolean(row.is_pinned),
        displayRank: Number(row.display_rank),
        sourceNote: String(row.source_note),
        freshnessAt: String(row.freshness_at),
        expiresAt: String(row.expires_at),
    };
}

export async function loadHomepageCarousel(
    supabase: SupabaseServerClient,
    viewer: CarouselViewer
) {
    const now = new Date().toISOString();
    const query = supabase
        .from("homepage_carousel_slides")
        .select("*")
        .eq("status", "published")
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .gt("expires_at", now)
        .order("is_required", { ascending: false })
        .order("is_pinned", { ascending: false })
        .order("display_rank", { ascending: true })
        .limit(5);
    const isCompleteMember = !["anonymous", "unverified", "profile_incomplete"].includes(viewer.audience);
    const result = isCompleteMember
        ? await query
        : await query.eq("content_visibility", "public_teaser");
    if (result.error) throw new Error(result.error.message);
    const manual = ((result.data ?? []) as Record<string, unknown>[]).map(mapSlide);
    const articleIds = new Set(manual.flatMap((slide) => slide.articleId ?? []));
    const { data: articles, error: articleError } = await supabase
        .from("editorial_articles")
        .select("id,slug,title,public_summary,hero_image_url,hero_image_alt,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);
    if (articleError) throw new Error(articleError.message);

    const auto = ((articles ?? []) as Array<Record<string, unknown>>)
        .filter((article) => !articleIds.has(String(article.id)))
        .slice(0, 5)
        .map((article, index): HomepageCarouselSlide => ({
            id: `auto:${String(article.id)}`,
            articleId: String(article.id),
            slideType: "anonymous_teaser",
            title: String(article.title),
            summary: String(article.public_summary),
            visualAssetUrl: typeof article.hero_image_url === "string"
                ? article.hero_image_url
                : potomacBrand.assets.cabeusHero,
            visualAssetAlt: typeof article.hero_image_alt === "string"
                ? article.hero_image_alt
                : "Cabeus Explorer lunar intelligence briefing",
            ctaLabel: "Read the brief",
            ctaRoute: `/news/${String(article.slug)}`,
            minimumTier: "public",
            isRequired: false,
            isPinned: false,
            displayRank: 900 + index,
            sourceNote: "Latest published CMS story auto-selection.",
            freshnessAt: String(article.published_at),
            expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        }));
    let customCards: HomepageCarouselSlide[] = [];
    if (isCompleteMember && viewer.personalizationEnabled && viewer.qualifyingEvents >= 5) {
        await supabase.rpc("refresh_my_custom_intelligence_cards");
        const { data: cards } = await supabase.from("member_custom_intelligence_cards")
            .select("id,title,summary,cta_route,reason_text,display_rank,generated_at,expires_at")
            .gt("expires_at", now).order("display_rank").limit(3);
        customCards = (cards ?? []).map((card) => ({
            id: `custom:${card.id}`, articleId: null, slideType: "custom_intelligence_card", title: card.title,
            summary: `${card.summary} ${card.reason_text}`, visualAssetUrl: potomacBrand.assets.cabeusHero,
            visualAssetAlt: "Personalized Cabeus Explorer lunar intelligence briefing", ctaLabel: "Open intelligence",
            ctaRoute: card.cta_route, minimumTier: "member", isRequired: false, isPinned: false,
            displayRank: card.display_rank, sourceNote: card.reason_text, freshnessAt: card.generated_at, expiresAt: card.expires_at,
        }));
    }
    return resolveCarouselSlides({ inventory: [...manual, ...auto], customCards, viewer });
}
