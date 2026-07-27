import type { Metadata } from "next";
import { absoluteSiteUrl, jsonLdScript, organizationJsonLd, siteConfig } from "../_data/site";

export const metadata: Metadata = {
    title: "Contact and Editorial Standards",
    description:
        "Publisher contact information, editorial standards, corrections, sourcing, and advertising disclosures for Cabeus Explorer.",
    alternates: {
        canonical: "/contact",
    },
};

export default function ContactPage() {
    const contactJsonLd = {
        ...organizationJsonLd(),
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "newsroom and publisher inquiries",
            email: siteConfig.publisherEmail,
            url: absoluteSiteUrl("/contact"),
        },
    };

    return (
        <section className="bg-grid-pattern min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(contactJsonLd) }}
            />
            <div className="mx-auto max-w-5xl px-4 py-14 md:px-8">
                <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                    Publisher transparency
                </p>
                <h1 className="mt-4 font-serif text-5xl text-white md:text-6xl">
                    Contact and Editorial Standards
                </h1>

                <div className="mt-10 grid gap-8 md:grid-cols-2">
                    <section className="border border-white/10 bg-potomac-primary p-6">
                        <h2 className="font-serif text-3xl text-white">Publisher</h2>
                        <dl className="mt-5 space-y-4 text-sm leading-6 text-potomac-cream/75">
                            <div>
                                <dt className="font-mono text-xs uppercase text-potomac-gold">Company</dt>
                                <dd>{siteConfig.legalName}</dd>
                            </div>
                            <div>
                                <dt className="font-mono text-xs uppercase text-potomac-gold">Headquarters</dt>
                                <dd>{siteConfig.publisherLocation}</dd>
                            </div>
                            <div>
                                <dt className="font-mono text-xs uppercase text-potomac-gold">Email</dt>
                                <dd>
                                    <a className="text-white hover:text-potomac-gold" href={`mailto:${siteConfig.publisherEmail}`}>
                                        {siteConfig.publisherEmail}
                                    </a>
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="border border-white/10 bg-potomac-primary p-6">
                        <h2 className="font-serif text-3xl text-white">Corrections</h2>
                        <p className="mt-5 text-sm leading-7 text-potomac-cream/75">
                            Send factual corrections, source documentation, or
                            questions about a byline to the newsroom email. Include
                            the article URL and the specific passage under review.
                            Material corrections are reflected in the article
                            modification timestamp.
                        </p>
                    </section>
                </div>

                <section className="mt-8 border border-white/10 bg-potomac-primary p-6">
                    <h2 className="font-serif text-3xl text-white">Editorial policy</h2>
                    <div className="mt-5 grid gap-6 text-sm leading-7 text-potomac-cream/75 md:grid-cols-3">
                        <div>
                            <h3 className="font-mono text-xs font-bold uppercase text-potomac-gold">Original reporting</h3>
                            <p className="mt-2">Cabeus Explorer prioritizes original interviews, source documents, market analysis, and reporting that adds material strategic context.</p>
                        </div>
                        <div>
                            <h3 className="font-mono text-xs font-bold uppercase text-potomac-gold">Sources and bylines</h3>
                            <p className="mt-2">News stories identify a specific author, publication time, source citations when available, and a linked professional biography.</p>
                        </div>
                        <div>
                            <h3 className="font-mono text-xs font-bold uppercase text-potomac-gold">Advertising</h3>
                            <p className="mt-2">Paid sponsorships, advertisements, affiliate relationships, and publisher promotions are clearly labeled and visually separated from editorial reporting.</p>
                        </div>
                    </div>
                </section>
            </div>
        </section>
    );
}
