"use client";

import { useState } from "react";

export function ScoutCheckoutButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function startCheckout() {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/stripe/scout-checkout", {
            method: "POST",
        });
        const payload = (await response.json()) as {
            url?: string;
            error?: string;
        };

        if (!response.ok || !payload.url) {
            setError(payload.error ?? "Unable to start Scout checkout.");
            setIsLoading(false);
            return;
        }

        window.location.assign(payload.url);
    }

    return (
        <div className="glass-card mt-10 rounded p-6">
            <h2 className="font-serif text-2xl text-white">Scout Upgrade</h2>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/75">
                Self-serve Scout access is configured for $25k per user per
                year through Stripe Checkout.
            </p>
            <button
                type="button"
                onClick={startCheckout}
                disabled={isLoading}
                className="mt-6 rounded bg-potomac-gold px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isLoading ? "Starting checkout" : "Upgrade to Scout"}
            </button>
            {error ? (
                <p className="mt-4 text-sm leading-6 text-red-300">{error}</p>
            ) : null}
        </div>
    );
}
