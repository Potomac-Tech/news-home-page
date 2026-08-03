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

        </div>
    );
}
