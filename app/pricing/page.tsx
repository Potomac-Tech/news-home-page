import type { Metadata } from "next";
import Link from "next/link";
import { absoluteSiteUrl, jsonLdScript } from "../_data/site";

export const metadata: Metadata = {
    title: "The Cabeus Council",
    description:
        "The Cabeus Council unites leaders securing, building, and financing the lunar economy and beyond.",
    alternates: { canonical: "/pricing" },
    openGraph: {
        title: "The Cabeus Council",
        description:
            "The Cabeus Council unites leaders securing, building, and financing the lunar economy and beyond.",
        url: absoluteSiteUrl("/pricing"),
        type: "website",
        images: [
            {
                url: absoluteSiteUrl("/artemis-ii-earthrise-feature.jpg"),
                alt: "Earth rising above the lunar horizon during NASA's Artemis II mission",
            },
        ],
    },
};

export default function PricingPage() {
    const pageJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "The Cabeus Council",
        description:
            "The Cabeus Council unites leaders securing, building, and financing the lunar economy and beyond.",
        url: absoluteSiteUrl("/pricing"),
    };

    return (
        <div className="bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(pageJsonLd) }}
            />

            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid min-h-[40rem] w-full max-w-[92rem] lg:grid-cols-[0.88fr_1.12fr]">
                    <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
                        <p className="brand-kicker">The Cabeus Council</p>
                        <h1 className="mt-5 max-w-[12ch] text-balance font-serif text-[clamp(4rem,7vw,7.5rem)] font-medium leading-[0.9]">
                            We choose to go to the Moon.
                        </h1>
                        <p className="mt-7 max-w-3xl text-lg leading-8 text-cabeus-muted">
                            The Cabeus Council unites the leaders securing, building,
                            and financing the lunar economy (and beyond).
                        </p>
                        <Link href="/request-access" className="brand-button mt-8 inline-flex self-start">
                            Apply
                        </Link>
                    </div>
                    <figure className="relative order-first h-72 overflow-hidden bg-cabeus-ink lg:order-none lg:h-full lg:min-h-[40rem]">
                        <img
                            src="/artemis-ii-earthrise-feature.jpg"
                            alt="Earth rising above the lunar horizon during NASA's Artemis II mission"
                            className="h-full w-full object-cover object-center"
                            fetchPriority="high"
                        />
                        <figcaption className="absolute bottom-3 right-3 bg-cabeus-ink/85 px-3 py-2 font-mono text-[0.55rem] uppercase text-cabeus-paper">
                            NASA / Artemis II / ART002-E-009288
                        </figcaption>
                    </figure>
                </div>
            </section>

        </div>
    );
}
