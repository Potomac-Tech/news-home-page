import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Developer API Reference",
    description: "Authentication, endpoints, exports, and webhooks for the Cabeus Explorer paid developer API.",
};

const endpoints = [
    ["GET", "/api/v1/articles", "Scout", "Published lunar intelligence articles"],
    ["GET", "/api/v1/lunar-missions", "Scout", "Lunar mission and status records"],
    ["GET", "/api/v1/procurement-regulatory", "Scout", "Procurement and regulatory intelligence"],
    ["GET", "/api/v1/companies", "Scout", "Lunar company profiles"],
    ["GET", "/api/v1/command/briefs", "Cabeus Council", "Organization-scoped Cabeus Council briefs"],
    ["POST", "/api/v1/exports", "Scout", "CSV, PDF, and JSON export jobs"],
];

export default function DeveloperApiReferencePage() {
    return (
        <main className="bg-grid-pattern min-h-screen">
            <div className="mx-auto w-full max-w-5xl px-4 py-16 md:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">Developer reference</p>
                <h1 className="mt-3 font-serif text-4xl text-white md:text-5xl">Cabeus Explorer API v1</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-potomac-cream/70">
                    Scout and Cabeus Council members can access versioned lunar intelligence endpoints, private exports, and signed event delivery. Use a developer key as a Bearer token or in the X-API-Key header.
                </p>

                <section className="mt-10 border-y border-white/10 py-8">
                    <h2 className="font-serif text-3xl text-white">Endpoints</h2>
                    <div className="mt-5 divide-y divide-white/10 border-t border-white/10">
                        {endpoints.map(([method, route, tier, description]) => (
                            <div key={route} className="grid gap-2 py-4 md:grid-cols-[5rem_1fr_7rem_1.5fr] md:items-center">
                                <strong className="text-xs tracking-[0.14em] text-potomac-gold">{method}</strong>
                                <code className="break-all text-sm text-white">{route}</code>
                                <span className="text-xs uppercase tracking-[0.12em] text-potomac-cream/45">{tier}+</span>
                                <span className="text-sm text-potomac-cream/65">{description}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-8 py-8 md:grid-cols-2">
                    <div>
                        <h2 className="font-serif text-2xl text-white">Errors and quotas</h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                            Responses carry a request ID and remaining monthly units. The API uses 401 for invalid keys, 403 for tier or scope restrictions, and 429 when a quota is exhausted.
                        </p>
                    </div>
                    <div>
                        <h2 className="font-serif text-2xl text-white">Webhooks</h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                            Cabeus Council webhook payloads are signed with HMAC-SHA256. Verify X-Cabeus-Signature against the timestamp and raw body. Failed deliveries retry with bounded exponential backoff.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
