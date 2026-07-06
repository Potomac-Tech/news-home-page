export type PotomacAnalyticsEvent = {
    name: string;
    route: string;
    tier?: "public" | "explorer" | "scout" | "command" | "staff";
    metadata?: Record<string, string | number | boolean | null>;
};

export type PotomacLogLevel = "info" | "warn" | "error";

export type PotomacOperationalState =
    | "ready"
    | "loading"
    | "empty"
    | "error"
    | "stale"
    | "offline"
    | "locked";

export const performanceBudgets = {
    firstContentfulPaintMs: 1800,
    largestContentfulPaintMs: 2500,
    cumulativeLayoutShift: 0.1,
    interactionToNextPaintMs: 200,
    initialJsKb: 250,
    routeDataKb: 100,
} as const;

export const rateLimitBaselines = {
    publicFormsPerIpPerHour: 20,
    authenticatedWritesPerUserPerMinute: 60,
    apiRequestsPerKeyPerMinute: 120,
    webhookDeliveriesPerSubscriptionPerMinute: 60,
    exportJobsPerUserPerDay: 25,
} as const;

export const accessibilityBaselines = [
    "Keyboard access for navigation, forms, modals, and command palette controls.",
    "Visible focus states on links, buttons, inputs, and custom controls.",
    "Semantic landmarks, headings, labels, and form error text.",
    "No horizontal overflow at 390px mobile and 1280px desktop viewports.",
    "Readable contrast for Potomac dark gray, gold, cream, and status labels.",
] as const;

export const operationalStateCopy: Record<PotomacOperationalState, string> = {
    ready: "Content is available.",
    loading: "Content is loading.",
    empty: "No records match this view.",
    error: "This view could not load.",
    stale: "This view is showing stale data.",
    offline: "Live data is unavailable.",
    locked: "This view requires additional access.",
};

export function trackAnalyticsEvent(event: PotomacAnalyticsEvent) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent("potomac:analytics", {
            detail: {
                ...event,
                occurredAt: new Date().toISOString(),
            },
        })
    );
}

export function logPlatformEvent({
    level,
    message,
    metadata = {},
}: {
    level: PotomacLogLevel;
    message: string;
    metadata?: Record<string, string | number | boolean | null>;
}) {
    const payload = {
        level,
        message,
        metadata,
        occurredAt: new Date().toISOString(),
    };

    if (level === "error") {
        console.error("[potomac]", payload);
        return;
    }

    if (level === "warn") {
        console.warn("[potomac]", payload);
        return;
    }

    console.info("[potomac]", payload);
}
