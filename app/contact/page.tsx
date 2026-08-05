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
        <div className="min-h-screen bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(contactJsonLd) }}
            />
            <header className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <p className="brand-kicker">Publisher transparency</p>
                        <h1 className="mt-5 max-w-[10ch] font-serif text-6xl font-medium leading-[0.9] md:text-8xl">
                            Contact the team.
                        </h1>
                    </div>
                    <p className="max-w-xl text-lg leading-8 text-cabeus-muted">
                        Reach the Cabeus Explorer newsroom for reporting inquiries,
                        source material, corrections, partnerships, and publisher
                        questions.
                    </p>
                </div>
            </header>

            <section className="border-b border-cabeus-line bg-cabeus-ink text-cabeus-paper">
                <div className="mx-auto grid w-full max-w-[92rem] lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="px-5 py-14 md:px-10 md:py-20 lg:border-r lg:border-white/15">
                        <p className="font-mono text-xs font-bold uppercase text-cabeus-gold">
                            Newsroom and publisher inquiries
                        </p>
                        <a
                            className="mt-5 block break-words font-serif text-4xl leading-none transition-colors hover:text-cabeus-gold md:text-6xl"
                            href={`mailto:${siteConfig.publisherEmail}`}
                        >
                            {siteConfig.publisherEmail}
                        </a>
                        <p className="mt-6 max-w-2xl text-base leading-7 text-cabeus-paper/70">
                            Include the relevant article, event, organization, or
                            partnership in the subject line so the inquiry reaches
                            the right member of the team.
                        </p>
                    </div>
                    <dl className="grid grid-cols-1 px-5 py-8 md:grid-cols-2 md:px-10 lg:grid-cols-1 lg:py-14">
                        <div className="border-b border-white/15 py-5 md:border-b-0 md:border-r md:pr-8 lg:border-b lg:border-r-0 lg:pr-0">
                            <dt className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                                Publisher
                            </dt>
                            <dd className="mt-2 font-serif text-2xl">{siteConfig.legalName}</dd>
                        </div>
                        <div className="py-5 md:pl-8 lg:pl-0">
                            <dt className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-gold">
                                Headquarters
                            </dt>
                            <dd className="mt-2 font-serif text-2xl">{siteConfig.publisherLocation}</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section className="border-b border-cabeus-line">
                <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <p className="brand-kicker">Corrections</p>
                        <h2 className="mt-4 max-w-[9ch] font-serif text-5xl leading-[0.95] md:text-7xl">
                            Accuracy comes first.
                        </h2>
                    </div>
                    <div className="max-w-2xl lg:pt-7">
                        <p className="text-base leading-8 text-cabeus-muted">
                            Send factual corrections, source documentation, or
                            questions about a byline to the newsroom email. Include
                            the article URL and the specific passage under review.
                            Material corrections are reflected in the article
                            modification timestamp.
                        </p>
                        <a
                            href={`mailto:${siteConfig.publisherEmail}?subject=Correction%20request`}
                            className="brand-button mt-7 inline-flex"
                        >
                            Submit a correction
                        </a>
                    </div>
                </div>
            </section>

            <section className="border-b border-cabeus-line bg-cabeus-smoke">
                <div className="mx-auto w-full max-w-[92rem] px-5 py-14 md:px-10 md:py-20">
                    <p className="brand-kicker">Editorial standards</p>
                    <h2 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.95] md:text-7xl">
                        Reporting readers can evaluate.
                    </h2>
                    <div className="mt-10 grid border-y border-cabeus-line md:grid-cols-3">
                        <article className="py-8 md:pr-8">
                            <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                01 / Original reporting
                            </p>
                            <h3 className="mt-4 font-serif text-3xl">Original reporting</h3>
                            <p className="mt-4 text-sm leading-7 text-cabeus-muted">
                                Cabeus Explorer prioritizes original interviews,
                                source documents, market analysis, and reporting that
                                adds material strategic context.
                            </p>
                        </article>
                        <article className="border-t border-cabeus-line py-8 md:border-l md:border-t-0 md:px-8">
                            <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                02 / Accountability
                            </p>
                            <h3 className="mt-4 font-serif text-3xl">Sources and bylines</h3>
                            <p className="mt-4 text-sm leading-7 text-cabeus-muted">
                                News stories identify a specific author, publication
                                time, source citations when available, and a linked
                                professional biography.
                            </p>
                        </article>
                        <article className="border-t border-cabeus-line py-8 md:border-l md:border-t-0 md:pl-8">
                            <p className="font-mono text-[0.65rem] font-bold uppercase text-cabeus-bronze">
                                03 / Disclosures
                            </p>
                            <h3 className="mt-4 font-serif text-3xl">Advertising</h3>
                            <p className="mt-4 text-sm leading-7 text-cabeus-muted">
                                Paid sponsorships, advertisements, affiliate
                                relationships, and publisher promotions are clearly
                                labeled and visually separated from editorial reporting.
                            </p>
                        </article>
                    </div>
                </div>
            </section>
        </div>
    );
}
