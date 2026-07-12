export type PersonalizationAudience =
    | "anonymous" | "unverified" | "profile_incomplete"
    | "explorer" | "scout" | "command";

export type PersonalizationDecision = {
    behaviorRanking: boolean;
    mode: "public" | "latest_reviewed" | "personalized";
    reason: string;
    priorities: string[];
};

export function resolvePersonalization({
    audience,
    enabled = true,
    qualifyingEvents = 0,
    threshold = 5,
}: {
    audience: PersonalizationAudience;
    enabled?: boolean;
    qualifyingEvents?: number;
    threshold?: number;
}): PersonalizationDecision {
    if (audience === "anonymous" || audience === "unverified" || audience === "profile_incomplete") {
        return { behaviorRanking: false, mode: "public", reason: "Personalization requires a verified email and completed profile.", priorities: ["public_teasers", "required_picks"] };
    }
    const tierPriority = audience === "explorer" ? "paid_article_teasers" : "tier_intelligence";
    if (!enabled) {
        return { behaviorRanking: false, mode: "latest_reviewed", reason: "Behavior-based ranking is disabled in account preferences.", priorities: ["required_picks", tierPriority, "latest_reviewed"] };
    }
    if (qualifyingEvents < Math.max(5, threshold)) {
        return { behaviorRanking: false, mode: "latest_reviewed", reason: `Personalization begins after ${Math.max(5, threshold)} qualifying events.`, priorities: ["required_picks", tierPriority, "latest_reviewed"] };
    }
    return { behaviorRanking: true, mode: "personalized", reason: `Ranked from ${qualifyingEvents} privacy-safe events in the last 90 days.`, priorities: ["required_picks", "custom_intelligence", tierPriority, "latest_reviewed"] };
}
