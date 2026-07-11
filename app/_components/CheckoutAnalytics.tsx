"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "../../lib/platform/baseline";

export function CheckoutAnalytics() {
    useEffect(() => {
        const checkout = new URLSearchParams(window.location.search).get("checkout");
        if (checkout !== "scout_success" && checkout !== "scout_cancelled") return;

        trackAnalyticsEvent({
            name: checkout === "scout_success" ? "scout_checkout_success" : "scout_checkout_failure",
            route: window.location.pathname,
            tier: "scout",
            metadata: { outcome: checkout },
        });
        trackAnalyticsEvent({
            name: "return_to_content",
            route: window.location.pathname,
            tier: "scout",
            metadata: { checkoutOutcome: checkout },
        });
    }, []);

    return null;
}
