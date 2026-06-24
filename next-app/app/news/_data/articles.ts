import type { ArticleAccessTier } from "../../../lib/auth/article-access";

export type ArticleCitation = {
    label: string;
    title: string;
    publisher: string;
    url?: string;
    summary: string;
};

export type ArticleRecord = {
    id?: string;
    slug: string;
    title: string;
    dek: string;
    summary: string;
    keyPoints: string[];
    intro: string;
    teaser: string;
    publishedAt: string;
    accessTier: ArticleAccessTier;
    heroImageUrl: string;
    heroImageAlt: string;
    citations: ArticleCitation[];
    fallbackBody?: string;
};

export const fallbackArticles: ArticleRecord[] = [
    {
        slug: "vipc-grant-winner",
        title: "Potomac selected as VIPC Launch Grant winner",
        dek: "The award supports Potomac's low-cost lunar data infrastructure roadmap and its transition toward member-ready intelligence products.",
        summary:
            "Potomac Database Systems was selected as a VIPC Grant Winner and is applying for pre-seed follow-on funding.",
        keyPoints: [
            "VIPC selected Potomac for Launch Grant support in 2026.",
            "The funding advances proprietary lunar site intelligence for proposal teams and operators.",
            "Potomac's roadmap includes Compass, Pathfinder, Source, and Nexus as the foundation for member intelligence workflows.",
        ],
        intro:
            "Potomac is building the data layer for the lunar economy. The company's systems are designed to reduce the risk, cost, and complexity of lunar surface data collection so proposal teams can buy the intelligence they need to win major programs and land safely.",
        teaser:
            "The public update explains the grant milestone and the product roadmap. Members receive deeper context on how the funding connects to data acquisition, delivery, and future gated intelligence coverage.",
        publishedAt: "2026-05-18",
        accessTier: "member",
        heroImageUrl: "/Source Rendering.png",
        heroImageAlt: "Potomac lunar Source rendering",
        citations: [
            {
                label: "Company update",
                title: "Potomac selected as VIPC Launch Grant winner",
                publisher: "LinkedIn",
                url: "https://www.linkedin.com/feed/update/urn:li:activity:7443340367858425877",
                summary:
                    "Company announcement describing the VIPC Launch Grant selection.",
            },
            {
                label: "Press release",
                title: "Potomac advances low-cost data infrastructure for the lunar economy",
                publisher: "Potomac Database Systems",
                url: "/potomac-lunar-economy-press-release-05182026.pdf",
                summary:
                    "Press release outlining Compass, Pathfinder, Source, Nexus, and the lunar data roadmap.",
            },
            {
                label: "Press coverage",
                title: "Potomac Database Systems Unveils Plans to Amass Lunar Data",
                publisher: "Payload",
                url: "https://payloadspace.com/potomac-database-systems-unveils-plans-to-amass-lunar-data/",
                summary:
                    "External coverage of Potomac's lunar data collection and commercialization plan.",
            },
        ],
        fallbackBody:
            "The member brief connects the VIPC milestone to Potomac's broader operating plan. The immediate use of the support is to mature low-cost lunar data infrastructure while keeping the commercial product focused on repeatable intelligence, not one-off mission design.\n\nFor members, the important signal is that Potomac is packaging hardware, source capture, and delivery workflows around decisions proposal teams already need to make: where to land, what to measure, how to reduce uncertainty, and how to turn scarce surface observations into an advantage before procurement deadlines.\n\nThe next editorial layer will track how grant funding, payload partnerships, and data-rights structures change the pace at which lunar surface intelligence can move from mission artifact to commercial product.",
    },
];

export function findFallbackArticle(slug: string) {
    return fallbackArticles.find((article) => article.slug === slug);
}
