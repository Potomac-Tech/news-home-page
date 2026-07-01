import type { Metadata } from "next";
import Link from "next/link";
import { absoluteSiteUrl, jsonLdScript } from "../_data/site";

export const metadata: Metadata = {
    title: "Pricing",
    description:
        "Compare Potomac Explorer, Scout, and Command access for lunar news and intelligence.",
    alternates: {
        canonical: "/pricing",
    },
    openGraph: {
        title: "Potomac Pricing",
        description:
            "Explorer is free after approval, Scout is self-serve at $25,000/user/year, and Command is organization-level enterprise access.",
        url: absoluteSiteUrl("/pricing"),
        type: "website",
    },
};

const tiers = [
    {
        name: "Explorer",
        price: "Free",
        cadence: "manual approval",
        audience: "Individual readers and approved community members",
        description:
            "Read full public-story bodies and participate in approved member community spaces after application review.",
        href: "/apply",
        cta: "Apply for access",
        features: [
            "Full gated article bodies",
            "Member chat and moderated forums",
            "Member-gated event details",
            "Explorer dataset and terminal previews",
        ],
        limits: [
            "No paid exports, API keys, webhooks, RFQs, or marketplace transactions",
            "Community participation remains subject to moderation and trust controls",
        ],
    },
    {
        name: "Scout",
        price: "$25,000",
        cadence: "per user / year",
        audience: "Professional lunar market users",
        description:
            "Self-serve annual access for deeper dashboards, RFQs, data marketplace workflows, and paid intelligence tools.",
        href: "/member",
        cta: "Upgrade in workspace",
        features: [
            "Scout economy dashboard and downloads",
            "Data marketplace access",
            "RFQ posting, browsing, and responses",
            "Experimental test data uploads and comparisons",
        ],
        limits: [
            "One seat per active user-scoped annual subscription",
            "Exports, API access, webhooks, watchlists, and alerts are planned paid features",
        ],
    },
    {
        name: "Command",
        price: "Custom",
        cadence: "organization agreement",
        audience: "Enterprises, agencies, and institutional teams",
        description:
            "Manual sales-led organization access for Command-only intelligence, analyst support, and service delivery.",
        href: "/command",
        cta: "Request Command",
        features: [
            "Organization-scoped seats and admins",
            "Command-exclusive intelligence allocation",
            "Analyst support, mission briefs, and service tracking",
            "Higher-limit exports, API, webhook, and alert plans",
        ],
        limits: [
            "Manual approval and provisioning",
            "Seat and exclusivity terms are organization-scoped",
        ],
    },
] as const;

const comparisonRows = [
    ["Full article bodies", "Yes", "Yes", "Yes"],
    ["Member chat and forums", "Yes", "Yes", "Yes"],
    ["Economy dashboard downloads", "Upgrade", "Yes", "Yes"],
    ["Data marketplace", "Upgrade", "Yes", "Yes"],
    ["RFQs", "Upgrade", "Yes", "Yes"],
    ["Command-exclusive intelligence", "No", "No", "Yes"],
    ["Exports, API, webhooks", "No", "Planned", "Higher limits planned"],
] as const;

export default function PricingPage() {
    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Potomac News & Intelligence",
        description:
            "Lunar industry news and member-gated intelligence tiers for Explorer, Scout, and Command users.",
        url: absoluteSiteUrl("/pricing"),
        offers: tiers.map((tier) => ({
            "@type": "Offer",
            name: `Potomac ${tier.name}`,
            price: tier.name === "Scout" ? "25000" : "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: absoluteSiteUrl(tier.href),
        })),
    };

    return (
        <div className="bg-grid-pattern">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(productJsonLd),
                }}
            />
            <section className="border-b border-white/10">
                <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
                    <div className="max-w-4xl">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-potomac-gold">
                            Membership tiers
                        </p>
                        <h1 className="mt-4 font-serif text-4xl leading-tight text-white md:text-6xl">
                            Explorer, Scout, and Command access
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-potomac-cream/80">
                            Start with free approved Explorer access, upgrade to
                            Scout for professional intelligence workflows, or
                            request Command for organization-level lunar market
                            coverage and analyst support.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-12 md:px-8 lg:grid-cols-3">
                {tiers.map((tier) => (
                    <article
                        key={tier.name}
                        className="glass-card flex h-full flex-col rounded p-6"
                    >
                        <div className="border-b border-white/10 pb-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                {tier.audience}
                            </p>
                            <h2 className="mt-3 font-serif text-3xl text-white">
                                {tier.name}
                            </h2>
                            <p className="mt-4 text-4xl font-bold text-white">
                                {tier.price}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                                {tier.cadence}
                            </p>
                            <p className="mt-5 text-sm leading-6 text-potomac-cream/70">
                                {tier.description}
                            </p>
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                            <div>
                                <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Included
                                </h3>
                                <ul className="mt-3 space-y-2 text-sm leading-6 text-potomac-cream/75">
                                    {tier.features.map((feature) => (
                                        <li key={feature}>- {feature}</li>
                                    ))}
                                </ul>
                                <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                    Limits
                                </h3>
                                <ul className="mt-3 space-y-2 text-sm leading-6 text-potomac-cream/60">
                                    {tier.limits.map((limit) => (
                                        <li key={limit}>- {limit}</li>
                                    ))}
                                </ul>
                            </div>
                            <Link
                                href={tier.href}
                                className={
                                    tier.name === "Scout"
                                        ? "mt-6 rounded bg-potomac-gold px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                                        : "mt-6 rounded border border-potomac-gold/50 px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                                }
                            >
                                {tier.cta}
                            </Link>
                        </div>
                    </article>
                ))}
            </section>

            <section className="border-y border-white/10 bg-potomac-primary/70">
                <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="font-serif text-3xl leading-tight text-white">
                                Gate comparison
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-potomac-cream/70">
                                Access is enforced with normalized roles and
                                entitlements, not user-editable metadata.
                            </p>
                        </div>
                        <Link
                            href="/member"
                            className="w-fit rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                    </div>
                    <div className="mt-7 overflow-x-auto">
                        <table className="min-w-[48rem] w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-potomac-cream/45">
                                    <th className="py-3 pr-4">Capability</th>
                                    <th className="px-4 py-3">Explorer</th>
                                    <th className="px-4 py-3">Scout</th>
                                    <th className="px-4 py-3">Command</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row) => (
                                    <tr
                                        key={row[0]}
                                        className="border-b border-white/10 text-potomac-cream/75"
                                    >
                                        <th className="py-4 pr-4 font-semibold text-white">
                                            {row[0]}
                                        </th>
                                        <td className="px-4 py-4">{row[1]}</td>
                                        <td className="px-4 py-4">{row[2]}</td>
                                        <td className="px-4 py-4">{row[3]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                    <h2 className="font-serif text-3xl leading-tight text-white">
                        Upgrade paths
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Public visitors apply for Explorer, approved members
                        start Scout checkout from the workspace, and Command
                        prospects enter a manual sales workflow.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Link
                        href="/apply"
                        className="rounded border border-potomac-gold/35 p-5 transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Public to Explorer
                        </span>
                        <span className="mt-3 block text-sm leading-6 text-potomac-cream/70">
                            Submit the free application for manual approval.
                        </span>
                    </Link>
                    <Link
                        href="/member"
                        className="rounded border border-potomac-gold/35 p-5 transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Explorer to Scout
                        </span>
                        <span className="mt-3 block text-sm leading-6 text-potomac-cream/70">
                            Use the workspace Scout checkout after approval.
                        </span>
                    </Link>
                    <Link
                        href="/command"
                        className="rounded border border-potomac-gold/35 p-5 transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                            Team to Command
                        </span>
                        <span className="mt-3 block text-sm leading-6 text-potomac-cream/70">
                            Request organization-level access and sales review.
                        </span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
