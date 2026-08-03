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
import { allowLocalContentFallbacks } from "../../_data/contentFallbacks";
import {
    getArticleAccessContext,
    type ArticleAccessContext,
    type ArticleAccessTier,
} from "../../../lib/auth/article-access";
import { publicTierName, tierConfig } from "../../_data/tiers";
import { renderArticleHtml } from "../../../lib/editorial/rich-text";

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
    primary_author_id: string | null;
    dek: string | null;
    public_summary: string | null;
    public_teaser_markdown: string | null;
    public_key_points: unknown;
    intro_markdown: string | null;
    access_tier_required: string | null;
    hero_image_url: string | null;
    hero_image_alt: string | null;
    published_at: string | null;
    updated_at: string | null;
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
    mediaAssets: Array<{
        id: string;
        publicUrl: string;
        mediaType: "image" | "video";
        hostingProvider: "supabase" | "youtube";
        sourceUrl: string;
        altText: string;
        caption: string | null;
    }>;
};

const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
});

const anonymousAccess: ArticleAccessContext = {
    canReadFullStory: false,
    state: "signed_out",
    userId: null,
    roleId: null,
    loginHref: "/request-access?tab=signin",
    profileHref: null,
};

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently published";
    }

    return displayDateFormatter.format(date);
}

function accessTierLabel(tier: ArticleAccessTier) {
    return publicTierName(tier);
}

function parseKeyPoints(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === "string");
}

function normalizeTier(value: string | null): ArticleAccessTier {
    if (value === "meridian" || value === "scout") {
        return value;
    }

    return "explorer";
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

function mapArticle(
    row: EditorialArticleRow,
    citations: ArticleCitation[],
    author: { display_name?: string; slug?: string } | null
): ArticleRecord {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        authorName: author?.display_name ?? "Cabeus Explorer",
        authorSlug: author?.slug,
        dek: row.dek ?? row.public_summary ?? "Cabeus Explorer intelligence brief.",
        summary: row.public_summary ?? row.dek ?? "Cabeus Explorer intelligence brief.",
        keyPoints: parseKeyPoints(row.public_key_points),
        intro: row.intro_markdown ?? row.public_teaser_markdown ?? "",
        teaser: row.public_teaser_markdown ?? row.public_summary ?? "",
        publishedAt: row.published_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? row.published_at ?? undefined,
        accessTier: normalizeTier(row.access_tier_required),
        heroImageUrl: row.hero_image_url ?? "",
        heroImageAlt: row.hero_image_alt ?? "",
        citations,
    };
}

function renderParagraphs(value: string) {
    return value
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

async function getPublishedCmsArticle(slug: string) {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("editorial_articles")
        .select(
            "id,slug,title,primary_author_id,dek,public_summary,public_teaser_markdown,public_key_points,intro_markdown,access_tier_required,hero_image_url,hero_image_alt,published_at,updated_at"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .not("primary_author_id", "is", null)
        .lte("published_at", now)
        .maybeSingle();

    if (error || !data) {
        return {
            article: null,
            supabase,
        };
    }

    const articleRow = data as EditorialArticleRow;
    const [citationResult, authorResult] = await Promise.all([
        supabase
            .from("editorial_article_citations")
            .select("label,title,publisher,url,summary,sort_order")
            .eq("article_id", articleRow.id)
            .order("sort_order", { ascending: true }),
        articleRow.primary_author_id
            ? supabase
                .from("editorial_authors")
                .select("display_name,slug")
                .eq("id", articleRow.primary_author_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
    ]);

    if (citationResult.error) {
        throw new Error(citationResult.error.message);
    }
    if (authorResult.error) {
        throw new Error(authorResult.error.message);
    }

    const citations = ((citationResult.data ?? []) as EditorialCitationRow[]).map(
        mapCitation
    );

    return {
        article: mapArticle(
            articleRow,
            citations,
            authorResult.data as { display_name?: string; slug?: string } | null
        ),
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
    const fallbackArticle = allowLocalContentFallbacks()
        ? findFallbackArticle(slug)
        : undefined;

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
            mediaAssets: [],
        };
    }

    const { article: cmsArticle, supabase } = await getPublishedCmsArticle(slug);
    let article = cmsArticle ?? fallbackArticle;

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

    const { data: mediaRows, error: mediaError } = article.id
        ? await supabase
            .from("editorial_media_assets")
            .select("id,public_url,media_type,hosting_provider,source_url,alt_text,caption")
            .eq("article_id", article.id)
            .order("sort_order")
        : { data: [], error: null };
    if (mediaError) throw new Error(mediaError.message);

    const mediaAssets = (mediaRows ?? []).map((asset) => ({
        id: asset.id,
        publicUrl: asset.public_url,
        mediaType: asset.media_type as "image" | "video",
        hostingProvider: asset.hosting_provider as "supabase" | "youtube",
        sourceUrl: asset.source_url ?? asset.public_url,
        altText: asset.alt_text ?? "",
        caption: asset.caption,
    }));
    const leadImage = mediaAssets.find((asset) => asset.mediaType === "image");
    if (!article.heroImageUrl && leadImage) {
        article = {
            ...article,
            heroImageUrl: leadImage.publicUrl,
            heroImageAlt: leadImage.altText || "Article photograph",
        };
    }

    return {
        article,
        fullBody,
        access,
        mediaAssets,
    };
}

export async function generateMetadata({
    params,
}: ArticlePageProps): Promise<Metadata> {
    const { slug } = await params;
    const fallbackArticle = allowLocalContentFallbacks()
        ? findFallbackArticle(slug)
        : undefined;
    const cmsArticle = hasPotomacSupabasePublicConfig()
        ? (await getPublishedCmsArticle(slug)).article
        : null;
    const article = cmsArticle ?? fallbackArticle;
    const canonicalPath = `/news/${slug}`;

    return {
        title: article?.title ?? "Article",
        description: article?.summary,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: article?.title ?? "Cabeus Explorer Article",
            description: article?.summary ?? siteConfig.description,
            url: absoluteSiteUrl(canonicalPath),
            siteName: siteConfig.name,
            type: "article",
            publishedTime: article?.publishedAt,
            authors: article?.authorName ? [article.authorName] : undefined,
            images: article?.heroImageUrl
                ? [
                      {
                          url: absoluteSiteUrl(article.heroImageUrl),
                          alt: article.heroImageAlt,
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
    slug,
}: {
    access: ArticleAccessContext;
    tier: ArticleAccessTier;
    slug: string;
}) {
    const tierLabel = accessTierLabel(tier);

    return (
        <section className="member-gated-content border-y border-cabeus-line py-7">
            <p className="brand-kicker">
                {tierLabel}+ full story
            </p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight text-cabeus-ink">
                Full analysis is reserved for approved members.
            </h2>
            <p className="mt-4 text-sm leading-6 text-cabeus-muted">
                Public readers can review the headline, summary, key points,
                intro, and citations. Approved members can read the full
                analysis once their role is active.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
                {access.state === "signed_out" ? (
                    <Link
                        href={access.loginHref}
                        className="brand-button inline-flex"
                    >
                        Sign in
                    </Link>
                ) : null}
                {access.state === "profile_incomplete" && access.profileHref ? (
                    <Link
                        href={access.profileHref}
                        className="brand-button inline-flex"
                    >
                        Complete profile
                    </Link>
                ) : null}
                <Link
                    href="/request-access"
                    className="brand-button brand-button-outline inline-flex"
                >
                    Request Explorer access
                </Link>
                <Link
                    href={`/upgrade?tier=meridian&source=article&content=news&object=${encodeURIComponent(slug)}&next=${encodeURIComponent(`/news/${slug}`)}`}
                    className="brand-button brand-button-outline inline-flex"
                >
                    {tierConfig.enterprise.publicName} access
                </Link>
            </div>
        </section>
    );
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { slug } = await params;
    const loaded = await loadArticle(slug);

    if (!loaded) {
        notFound();
    }

    const { article, fullBody, access, mediaAssets } = loaded;
    const keyPoints = article.keyPoints.length
        ? article.keyPoints
        : [article.summary, article.teaser].filter(Boolean);
    const canonicalUrl = absoluteSiteUrl(`/news/${article.slug}`);
    const authorUrl = article.authorSlug
        ? absoluteSiteUrl(`/authors/${article.authorSlug}`)
        : undefined;
    const { "@context": _publisherContext, ...publisherJsonLd } =
        organizationJsonLd();
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.summary,
        image: article.heroImageUrl
            ? [
                  {
                      "@type": "ImageObject",
                      url: absoluteSiteUrl(article.heroImageUrl),
                      caption: article.heroImageAlt,
                  },
              ]
            : undefined,
        datePublished: new Date(article.publishedAt).toISOString(),
        dateModified: new Date(article.updatedAt ?? article.publishedAt).toISOString(),
        author: article.authorName
            ? {
                  "@type": "Person",
                  name: article.authorName,
                  url: authorUrl,
              }
            : publisherJsonLd,
        publisher: publisherJsonLd,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonicalUrl,
        },
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
        <article className="bg-cabeus-paper text-cabeus-ink">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(articleJsonLd),
                }}
            />
            <header className="border-b border-cabeus-line">
                <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8 lg:py-16">
                    <div className="max-w-4xl">
                        <Link
                            href="/news"
                            className="brand-kicker hover:text-cabeus-ink"
                        >
                            Back to news
                        </Link>
                        <h1 className="mt-6 font-serif text-5xl font-medium leading-[0.94] text-cabeus-ink md:text-7xl">
                            {article.title}
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-cabeus-muted">
                            {article.dek}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 font-mono text-xs font-bold uppercase text-cabeus-muted">
                            {article.authorSlug ? (
                                <Link
                                    href={`/authors/${article.authorSlug}`}
                                    className="text-cabeus-bronze underline decoration-cabeus-gold/60 underline-offset-4 hover:text-cabeus-ink"
                                >
                                    By {article.authorName}
                                </Link>
                            ) : (
                                <span>By {article.authorName ?? "Cabeus Explorer"}</span>
                            )}
                            <time dateTime={article.publishedAt}>
                                Published {formatDate(article.publishedAt)}
                            </time>
                            {article.updatedAt &&
                            article.updatedAt !== article.publishedAt ? (
                                <time dateTime={article.updatedAt}>
                                    Updated {formatDate(article.updatedAt)}
                                </time>
                            ) : null}
                            <span>{accessTierLabel(article.accessTier)}+ full story</span>
                        </div>
                    </div>
                    {article.heroImageUrl ? (
                    <figure className="mt-10">
                        <img
                            src={article.heroImageUrl}
                            alt={article.heroImageAlt}
                            className="max-h-[42rem] w-full bg-cabeus-smoke object-contain object-top"
                        />
                        {mediaAssets.find((asset) => asset.publicUrl === article.heroImageUrl)?.caption ? (
                            <figcaption className="mt-3 text-sm leading-6 text-cabeus-muted">
                                {mediaAssets.find((asset) => asset.publicUrl === article.heroImageUrl)?.caption}
                            </figcaption>
                        ) : null}
                    </figure>
                    ) : null}
                </div>
            </header>

            <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
                <main className="mx-auto max-w-3xl">
                    {fullBody ? (
                        <section className="member-gated-content">
                            <p className="brand-kicker">
                                Member full story
                            </p>
                            <div
                                className="article-rich-text mt-6 text-lg leading-8 text-cabeus-ink/85"
                                dangerouslySetInnerHTML={{
                                    __html: renderArticleHtml(fullBody),
                                }}
                            />
                        </section>
                    ) : (
                        <>
                            <div className="article-rich-text text-lg leading-8 text-cabeus-ink/80">
                                {renderParagraphs(article.teaser || article.summary).map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                            <div className="mt-10">
                                <GatePanel access={access} tier={article.accessTier} slug={article.slug} />
                            </div>
                        </>
                    )}
                </main>
            </div>
        </article>
    );
}
