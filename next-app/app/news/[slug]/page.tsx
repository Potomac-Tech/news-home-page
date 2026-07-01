import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    type ArticleCitation,
    type ArticleRecord,
    findFallbackArticle,
    fallbackArticles,
} from "../_data/articles";
import {
    absoluteSiteUrl,
    jsonLdScript,
    organizationJsonLd,
    siteConfig,
} from "../../_data/site";
import { createClient } from "../../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import {
    getArticleAccessContext,
    type ArticleAccessContext,
    type ArticleAccessTier,
} from "../../../lib/auth/article-access";
import { SponsorUnit } from "../../_components/SponsorUnit";
import {
    loadSponsorUnits,
    sponsorPlacementKeys,
} from "../../_data/sponsorAds";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
    params: Promise<{
        slug: string;
    }>;
};

type EditorialArticleRow = {
    id: string;
    slug: string;
    title: string;
    dek: string | null;
    public_summary: string | null;
    public_teaser_markdown: string | null;
    public_key_points: unknown;
    intro_markdown: string | null;
    access_tier_required: string | null;
    hero_image_url: string | null;
    hero_image_alt: string | null;
    published_at: string | null;
};

type EditorialCitationRow = {
    label: string | null;
    title: string;
    publisher: string | null;
    url: string | null;
    summary: string | null;
    sort_order: number;
};

type EditorialBodyRow = {
    body_markdown: string;
    body_excerpt: string | null;
};

type LoadedArticle = {
    article: ArticleRecord;
    fullBody: string | null;
    access: ArticleAccessContext;
};

const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

const anonymousAccess: ArticleAccessContext = {
    canReadFullStory: false,
    state: "signed_out",
    userId: null,
    roleId: null,
    loginHref: "/auth/login",
};

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently published";
    }

    return displayDateFormatter.format(date);
}

function accessTierLabel(tier: ArticleAccessTier) {
    if (tier === "command") {
        return "Command";
    }

    if (tier === "scout") {
        return "Scout";
    }

    return "Member";
}

function parseKeyPoints(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function normalizeTier(value: string | null): ArticleAccessTier {
    if (value === "command" || value === "scout") {
        return value;
    }

    return "member";
}

function mapCitation(row: EditorialCitationRow): ArticleCitation {
    return {
        label: row.label ?? "Source",
        title: row.title,
        publisher: row.publisher ?? "Source",
        url: row.url ?? undefined,
        summary: row.summary ?? "Source material used for this article.",
    };
}

function mapArticle(row: EditorialArticleRow, citations: ArticleCitation[]): ArticleRecord {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        dek: row.dek ?? row.public_summary ?? "Potomac intelligence brief.",
        summary: row.public_summary ?? row.dek ?? "Potomac intelligence brief.",
        keyPoints: parseKeyPoints(row.public_key_points),
        intro: row.intro_markdown ?? row.public_teaser_markdown ?? "",
        teaser: row.public_teaser_markdown ?? row.public_summary ?? "",
        publishedAt: row.published_at ?? new Date().toISOString(),
        accessTier: normalizeTier(row.access_tier_required),
        heroImageUrl: row.hero_image_url ?? "/Source Rendering.png",
        heroImageAlt: row.hero_image_alt ?? "Potomac lunar intelligence rendering",
        citations,
    };
}

function renderParagraphs(value: string) {
    return value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

async function getPublishedCmsArticle(slug: string) {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("editorial_articles")
        .select(
            "id,slug,title,dek,public_summary,public_teaser_markdown,public_key_points,intro_markdown,access_tier_required,hero_image_url,hero_image_alt,published_at"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .lte("published_at", now)
        .maybeSingle();

    if (error || !data) {
        return {
            article: null,
            supabase,
        };
    }

    const articleRow = data as EditorialArticleRow;
    const { data: citationData, error: citationError } = await supabase
        .from("editorial_article_citations")
        .select("label,title,publisher,url,summary,sort_order")
        .eq("article_id", articleRow.id)
        .order("sort_order", { ascending: true });

    if (citationError) {
        throw new Error(citationError.message);
    }

    const citations = ((citationData ?? []) as EditorialCitationRow[]).map(
        mapCitation
    );

    return {
        article: mapArticle(articleRow, citations),
        supabase,
    };
}

async function getArticleBody(articleId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("editorial_article_bodies")
        .select("body_markdown,body_excerpt")
        .eq("article_id", articleId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return (data as EditorialBodyRow | null)?.body_markdown ?? null;
}

async function loadArticle(slug: string): Promise<LoadedArticle | null> {
    const fallbackArticle = findFallbackArticle(slug);

    if (!hasPotomacSupabasePublicConfig()) {
        if (!fallbackArticle) {
            return null;
        }

        return {
            article: fallbackArticle,
            fullBody: null,
            access: {
                ...anonymousAccess,
                loginHref: `/auth/login?next=${encodeURIComponent(`/news/${slug}`)}`,
            },
        };
    }

    const { article: cmsArticle, supabase } = await getPublishedCmsArticle(slug);
    const article = cmsArticle ?? fallbackArticle;

    if (!article) {
        return null;
    }

    const access = await getArticleAccessContext({
        supabase,
        tier: article.accessTier,
        nextPath: `/news/${slug}`,
    });

    const fullBody =
        access.canReadFullStory && article.id
            ? await getArticleBody(article.id)
            : access.canReadFullStory
              ? article.fallbackBody ?? null
              : null;

    return {
        article,
        fullBody,
        access,
    };
}

export async function generateMetadata({
    params,
}: ArticlePageProps): Promise<Metadata> {
    const { slug } = await params;
    const fallbackArticle = findFallbackArticle(slug);
    const canonicalPath = `/news/${slug}`;

    return {
        title: fallbackArticle?.title ?? "Article",
        description: fallbackArticle?.summary,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: fallbackArticle?.title ?? "Potomac Article",
            description: fallbackArticle?.summary ?? siteConfig.description,
            url: absoluteSiteUrl(canonicalPath),
            siteName: siteConfig.name,
            type: "article",
            publishedTime: fallbackArticle?.publishedAt,
            images: fallbackArticle
                ? [
                      {
                          url: absoluteSiteUrl(fallbackArticle.heroImageUrl),
                          alt: fallbackArticle.heroImageAlt,
                      },
                  ]
                : undefined,
        },
    };
}

export function generateStaticParams() {
    return fallbackArticles.map((article) => ({ slug: article.slug }));
}

function GatePanel({
    access,
    tier,
}: {
    access: ArticleAccessContext;
    tier: ArticleAccessTier;
}) {
    const tierLabel = accessTierLabel(tier);

    return (
        <section className="member-gated-content glass-card rounded p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                {tierLabel}+ full story
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-white">
                Full analysis is reserved for approved members.
            </h2>
            <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                Public readers can review the headline, summary, key points,
                intro, and citations. Approved members can read the full
                analysis once their role is active.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
                {access.state === "signed_out" ? (
                    <Link
                        href={access.loginHref}
                        className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Sign in
                    </Link>
                ) : null}
                <Link
                    href="/apply"
                    className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Apply for Member access
                </Link>
                <Link
                    href="/command"
                    className="rounded border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold"
                >
                    Command access
                </Link>
            </div>
        </section>
    );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { slug } = await params;
    const [loaded, sponsorUnits] = await Promise.all([
        loadArticle(slug),
        loadSponsorUnits([sponsorPlacementKeys.articleSidebar]),
    ]);

    if (!loaded) {
        notFound();
    }

    const { article, fullBody, access } = loaded;
    const articleSponsorUnit = sponsorUnits.get(
        sponsorPlacementKeys.articleSidebar
    )!;
    const keyPoints = article.keyPoints.length
        ? article.keyPoints
        : [article.summary, article.teaser].filter(Boolean);
    const canonicalUrl = absoluteSiteUrl(`/news/${article.slug}`);
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.summary,
        image: [absoluteSiteUrl(article.heroImageUrl)],
        datePublished: new Date(article.publishedAt).toISOString(),
        dateModified: new Date(article.publishedAt).toISOString(),
        author: organizationJsonLd(),
        publisher: organizationJsonLd(),
        mainEntityOfPage: canonicalUrl,
        isAccessibleForFree: false,
        keywords: keyPoints,
        abstract: article.teaser || article.summary,
        citation: article.citations.map((citation) =>
            citation.url ? absoluteSiteUrl(citation.url) : citation.title
        ),
        hasPart: {
            "@type": "WebPageElement",
            isAccessibleForFree: false,
            cssSelector: ".member-gated-content",
        },
    };

    return (
        <article className="bg-grid-pattern">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(articleJsonLd),
                }}
            />
            <header className="border-b border-white/10">
                <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
                    <div>
                        <Link
                            href="/news"
                            className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold hover:text-potomac-cream"
                        >
                            Back to news
                        </Link>
                        <h1 className="mt-6 font-serif text-4xl leading-tight text-white md:text-6xl">
                            {article.title}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            {article.dek}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.14em] text-potomac-cream/50">
                            <time dateTime={article.publishedAt}>
                                {formatDate(article.publishedAt)}
                            </time>
                            <span>{accessTierLabel(article.accessTier)}+ full story</span>
                        </div>
                    </div>
                    <figure className="glass-card rounded p-5">
                        <img
                            src={article.heroImageUrl}
                            alt={article.heroImageAlt}
                            className="h-72 w-full rounded object-cover"
                        />
                        <figcaption className="mt-4 text-sm leading-6 text-potomac-cream/60">
                            {article.summary}
                        </figcaption>
                    </figure>
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <main className="space-y-8">
                    <section className="glass-card rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Public summary
                        </p>
                        <p className="mt-4 text-xl leading-8 text-white">
                            {article.summary}
                        </p>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {keyPoints.map((point) => (
                                <div
                                    key={point}
                                    className="border-l border-potomac-gold/45 pl-4"
                                >
                                    <p className="text-sm leading-6 text-potomac-cream/75">
                                        {point}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="glass-card rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Public intro
                        </p>
                        <div className="mt-4 space-y-4 text-base leading-7 text-potomac-cream/75">
                            {renderParagraphs(article.intro || article.teaser).map(
                                (paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                )
                            )}
                        </div>
                    </section>

                    {fullBody ? (
                        <section className="member-gated-content glass-card rounded p-6">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                Member full story
                            </p>
                            <div className="mt-5 space-y-5 text-base leading-8 text-potomac-cream/80">
                                {renderParagraphs(fullBody).map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </section>
                    ) : (
                        <GatePanel access={access} tier={article.accessTier} />
                    )}
                </main>

                <aside className="space-y-6">
                    <SponsorUnit unit={articleSponsorUnit} />

                    <section className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            Source Citations
                        </h2>
                        <div className="mt-5 space-y-5">
                            {article.citations.map((citation) => (
                                <div
                                    key={`${citation.label}-${citation.title}`}
                                    className="border-b border-white/10 pb-5 last:border-0 last:pb-0"
                                >
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold">
                                        {citation.label}
                                    </p>
                                    {citation.url ? (
                                        <a
                                            href={citation.url}
                                            target={
                                                citation.url.startsWith("http")
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                citation.url.startsWith("http")
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            className="mt-2 block font-semibold leading-6 text-white transition hover:text-potomac-gold"
                                        >
                                            {citation.title}
                                        </a>
                                    ) : (
                                        <p className="mt-2 font-semibold leading-6 text-white">
                                            {citation.title}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-potomac-cream/45">
                                        {citation.publisher}
                                    </p>
                                    <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                                        {citation.summary}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="glass-card rounded p-6">
                        <h2 className="font-serif text-2xl text-white">
                            Access Path
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                            Free Member access unlocks full public-story bodies
                            after approval. Scout and Command roles satisfy
                            Member gates and unlock deeper intelligence in later
                            dashboard tasks.
                        </p>
                        <Link
                            href="/apply"
                            className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Apply for access
                        </Link>
                    </section>
                </aside>
            </div>
        </article>
    );
}
