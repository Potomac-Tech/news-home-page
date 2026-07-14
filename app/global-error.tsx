"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        let analyticsAllowed = false;
        try {
            const preferences = window.localStorage.getItem("potomac-cookie-preferences");
            analyticsAllowed = Boolean(preferences && JSON.parse(preferences).analytics);
        } catch {
            analyticsAllowed = false;
        }
        if (!analyticsAllowed) return;
        void fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Analytics-Consent": "granted" },
            body: JSON.stringify({
                event_kind: "client_error",
                route_path: window.location.pathname,
                metric_name: "window_error",
                metadata: { message: error.message.slice(0, 240) },
            }),
        }).catch(() => undefined);
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-potomac-secondary text-potomac-cream">
                <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">Service interruption</p>
                    <h1 className="mt-4 font-serif text-4xl text-white">This view could not load.</h1>
                    <p className="mt-4 text-base leading-7 text-potomac-cream/70">The incident has been recorded when analytics consent permits. Retry the request or return later.</p>
                    <button type="button" onClick={reset} className="mt-8 w-fit bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary">
                        Retry
                    </button>
                </main>
            </body>
        </html>
    );
}
