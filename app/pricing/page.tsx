import type { Metadata } from "next";
import Link from "next/link";
import { absoluteSiteUrl, jsonLdScript } from "../_data/site";
import { tierConfig } from "../_data/tiers";

export const metadata: Metadata = {
    title: "The Cabeus Council",
    description:
        "Compare Cabeus Explorer membership tiers for lunar news and intelligence.",
    alternates: { canonical: "/pricing" },
    openGraph: {
        title: "The Cabeus Council",
        description:
            `Explorer is free, Scout is $25,000/user/year, and ${tierConfig.enterprise.publicName} is organization-level contract access.`,
        url: absoluteSiteUrl("/pricing"),
        type: "website",
    },
};

const tiers = [
    {
        name: "Explorer",
        price: "Free",
        cadence: "default membership",
        audience: "Verified readers and community members",
        description:
            "Full reporting, Moonberg with Kevin Cirilli, and community participation after email verification and profile completion.",
        href: "/request-access",
        cta: "Start free",
        features: [
            "Full gated article bodies",
            "Moonberg delivered to your membership email",
            "Member chat and moderated forums",
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
            "Professional access for deeper dashboards, RFQs, data marketplace workflows, and paid intelligence tools.",
        href: "/member",
        cta: "Upgrade in workspace",
        features: [
            "Scout dashboards and downloads",
            "Data marketplace access",
            "RFQ posting, browsing, and responses",
            "Experimental data uploads and comparisons",
        ],
        limits: [
            "One seat per active user-scoped annual subscription",
            "API, webhook, watchlist, and alert limits apply",
        ],
    },
    {
        name: tierConfig.enterprise.publicName,
        price: "Contract",
        cadence: "organization discussion",
        audience: "Enterprises, agencies, and institutional teams",
        description:
            "Organization access for executive intelligence, analyst support, mission planning, and service delivery.",
        href: "/command",
        cta: `Request ${tierConfig.enterprise.publicName}`,
        features: [
            "Organization-scoped seats and admins",
            "Enterprise intelligence allocation",
            "Analyst support and mission briefs",
            "Higher-limit exports, APIs, webhooks, and alerts",
        ],
        limits: [
            "Manual approval and provisioning",
            "Seat and exclusivity terms are organization-scoped",
        ],
    },
] as const;

const comparisonRows = [
    ["Full article bodies", "Yes", "Yes", "Yes"],
    ["Moonberg newsletter", "Yes", "Yes", "Yes"],
    ["Member chat and forums", "Yes", "Yes", "Yes"],
    ["Dashboard downloads", "Upgrade", "Yes", "Yes"],
    ["Data marketplace", "Upgrade", "Yes", "Yes"],
    ["RFQs", "Upgrade", "Yes", "Yes"],
    ["Enterprise intelligence", "No", "No", "Yes"],
    ["Exports, API, webhooks", "No", "Limited", "Higher limits"],
] as const;

export default function PricingPage() {
    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Cabeus Explorer News & Intelligence",
        description:
            `Lunar industry news and intelligence tiers for Explorer, Scout, and ${tierConfig.enterprise.publicName} users.`,
        url: absoluteSiteUrl("/pricing"),
        offers: tiers.map((tier) => ({
            "@type": "Offer",
            name: `Cabeus Explorer ${tier.name}`,
            price: tier.name === "Scout" ? "25000" : "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: absoluteSiteUrl(tier.href),
        })),
    };

    return (
        <div className="bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd) }}
            />

            <section className="border-b border-cabeus-line">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-16 md:px-10 md:py-24">
                    <p className="brand-kicker">The Cabeus Council</p>
                    <h1 className="mt-5 max-w-[12ch] text-balance font-serif text-[clamp(4rem,7vw,7.5rem)] font-medium leading-[0.9]">
                        We choose to go to the Moon.
                    </h1>
                    <p className="mt-7 max-w-3xl text-lg leading-8 text-cabeus-muted">
                        The Cabeus Council unites the leaders securing, building,
                        and financing the lunar economy (and beyond).
                    </p>
                    <Link href="/request-access" className="brand-button mt-8 inline-flex">
                        Apply
                    </Link>
                </div>
            </section>

            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] px-5 md:px-10 lg:grid-cols-3">
                    {tiers.map((tier, index) => (
                        <article
                            key={tier.name}
                            className={`flex min-w-0 flex-col border-cabeus-line py-10 lg:px-8 ${
                                index ? "border-t lg:border-l lg:border-t-0" : ""
                            }`}
                        >
                            <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                {tier.audience}
                            </p>
                            <h2 className="mt-5 font-serif text-5xl leading-none">
                                {tier.name}
                            </h2>
                            <p className="mt-8 font-serif text-4xl">{tier.price}</p>
                            <p className="mt-2 font-mono text-[0.62rem] font-bold uppercase text-cabeus-muted">
                                {tier.cadence}
                            </p>
                            <p className="mt-6 text-sm leading-6 text-cabeus-muted">
                                {tier.description}
                            </p>

                            <div className="mt-8 border-t border-cabeus-line pt-6">
                                <h3 className="brand-kicker text-cabeus-ink">Included</h3>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-cabeus-ink/80">
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="border-l border-cabeus-bronze pl-3">
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <h3 className="brand-kicker mt-7 text-cabeus-ink">Limits</h3>
                                <ul className="mt-4 space-y-2 text-sm leading-6 text-cabeus-muted">
                                    {tier.limits.map((limit) => (
                                        <li key={limit}>{limit}</li>
                                    ))}
                                </ul>
                            </div>

                            <Link
                                href={tier.href}
                                className={`brand-button mt-8 inline-flex ${
                                    tier.name === "Scout" ? "" : "brand-button-outline"
                                }`}
                            >
                                {tier.cta}
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="border-b border-cabeus-line bg-cabeus-smoke">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-14 md:px-10 md:py-20">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="brand-kicker">Access comparison</p>
                            <h2 className="mt-4 font-serif text-5xl leading-none md:text-6xl">
                                Choose the right operating view.
                            </h2>
                        </div>
                        <Link href="/member" className="brand-button brand-button-outline inline-flex self-start">
                            Member workspace
                        </Link>
                    </div>

                    <div
                        className="mt-9 overflow-x-auto border-y border-cabeus-line"
                        role="region"
                        aria-label="Membership feature comparison"
                        tabIndex={0}
                    >
                        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-cabeus-line font-mono text-[0.62rem] uppercase text-cabeus-muted">
                                    <th className="py-4 pr-4">Capability</th>
                                    <th className="px-4 py-4">Explorer</th>
                                    <th className="px-4 py-4">Scout</th>
                                    <th className="px-4 py-4">{tierConfig.enterprise.publicName}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row) => (
                                    <tr key={row[0]} className="border-b border-cabeus-line last:border-b-0">
                                        <th className="py-4 pr-4 font-semibold">{row[0]}</th>
                                        <td className="px-4 py-4 text-cabeus-muted">{row[1]}</td>
                                        <td className="px-4 py-4 text-cabeus-muted">{row[2]}</td>
                                        <td className="px-4 py-4 text-cabeus-muted">{row[3]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
