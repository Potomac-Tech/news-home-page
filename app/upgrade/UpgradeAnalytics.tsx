"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "../../lib/platform/baseline";

export function UpgradeAnalytics({
    tier,
    source,
    content,
    objectId,
    campaign,
}: {
    tier: "scout" | "meridian";
    source?: string;
    content?: string;
    objectId?: string;
    campaign?: string;
}) {
    useEffect(() => {
        const metadata = {
            requestedTier: tier,
            source: source ?? null,
            content: content ?? null,
            objectId: objectId ?? null,
            campaign: campaign ?? null,
        };
        trackAnalyticsEvent({ name: "premium_click_source", route: "/upgrade", tier: "explorer", metadata });
        trackAnalyticsEvent({ name: "upgrade_impression", route: "/upgrade", tier: tier === "meridian" ? "command" : "scout", metadata });
    }, [campaign, content, objectId, source, tier]);

    return null;
}
