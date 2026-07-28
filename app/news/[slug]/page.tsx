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
import { SponsorUnit } from "../../_components/SponsorUnit";
import {
    loadSponsorUnits,
    sponsorPlacementKeys,
} from "../../_data/sponsorAds";
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
            .select("id,public_url,media_type,alt_text,caption")
            .eq("article_id", article.id)
            .order("sort_order")
        : { data: [], error: null };
    if (mediaError) throw new Error(mediaError.message);

    const mediaAssets = (mediaRows ?? []).map((asset) => ({
        id: asset.id,
        publicUrl: asset.public_url,
        mediaType: asset.media_type as "image" | "video",
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
                {access.state === "profile_incomplete" && access.profileHref ? (
                    <Link
                        href={access.profileHref}
                        className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                    >
                        Complete profile
                    </Link>
                ) : null}
                <Link
                    href="/request-access"
                    className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                >
                    Request Explorer access
                </Link>
                <Link
                    href={`/upgrade?tier=meridian&source=article&content=news&object=${encodeURIComponent(slug)}&next=${encodeURIComponent(`/news/${slug}`)}`}
                    className="rounded border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-cream transition hover:border-potomac-gold hover:text-potomac-gold"
                >
                    {tierConfig.enterprise.publicName} access
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

    const { article, fullBody, access, mediaAssets } = loaded;
    const inlineMediaIds = new Set(
        Array.from((fullBody ?? "").matchAll(/data-media-id="([^"]+)"/g))
            .map((match) => match[1])
    );
    const articleSponsorUnit = sponsorUnits.get(
        sponsorPlacementKeys.articleSidebar
    )!;
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
        <article className="bg-grid-pattern">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript(articleJsonLd),
                }}
            />
            <header className="border-b border-white/10">
                <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8 lg:py-16">
                    <div className="max-w-4xl">
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
                            {article.authorSlug ? (
                                <Link href={`/authors/${article.authorSlug}`}>By {article.authorName}</Link>
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
                            className="max-h-[42rem] w-full bg-black object-contain object-top"
                        />
                        {mediaAssets.find((asset) => asset.publicUrl === article.heroImageUrl)?.caption ? (
                            <figcaption className="mt-3 text-sm leading-6 text-potomac-cream/60">
                                {mediaAssets.find((asset) => asset.publicUrl === article.heroImageUrl)?.caption}
                            </figcaption>
                        ) : null}
                    </figure>
                    ) : null}
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <main>
                    {fullBody ? (
                        <section className="member-gated-content">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                                Member full story
                            </p>
                            <div
                                className="article-rich-text mt-6 text-lg leading-8 text-potomac-cream/85"
                                dangerouslySetInnerHTML={{
                                    __html: renderArticleHtml(fullBody),
                                }}
                            />
                        </section>
                    ) : (
                        <>
                            <div className="article-rich-text text-lg leading-8 text-potomac-cream/80">
                                {renderParagraphs(article.teaser || article.summary).map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                            <div className="mt-10">
                                <GatePanel access={access} tier={article.accessTier} slug={article.slug} />
                            </div>
                        </>
                    )}
                    {mediaAssets.some((asset) =>
                        asset.mediaType === "video" && !inlineMediaIds.has(asset.id)
                    ) ? (
                        <section className="mt-10 space-y-5">
                            {mediaAssets.filter((asset) =>
                                asset.mediaType === "video" && !inlineMediaIds.has(asset.id)
                            ).map((asset) => (
                                <figure key={asset.id} className="glass-card rounded p-4">
                                    <video
                                        src={asset.publicUrl}
                                        controls
                                        preload="metadata"
                                        playsInline
                                        aria-label={asset.altText || "Article video"}
                                        className="w-full rounded"
                                    />
                                    {asset.caption ? <figcaption className="mt-3 text-sm text-potomac-cream/60">{asset.caption}</figcaption> : null}
                                </figure>
                            ))}
                        </section>
                    ) : null}
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
                            Free Explorer access unlocks full public-story bodies
                            after verification and profile completion. Scout and
                            {tierConfig.enterprise.publicName} paths unlock deeper intelligence in later
                            dashboard tasks.
                        </p>
                        <Link
                            href="/request-access"
                            className="mt-6 inline-flex rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Request access
                        </Link>
                    </section>
                </aside>
            </div>
        </article>
    );
}
