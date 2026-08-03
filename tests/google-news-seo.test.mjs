import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Google News sitemap contains only recent published articles", () => {
    const route = read("app/news-sitemap.xml/route.ts");
    const robots = read("app/robots.ts");

    for (const token of [
        'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"',
        '.eq("status", "published")',
        '.gte("published_at", cutoff.toISOString())',
        '.limit(1000)',
        "<news:publication_date>",
        "<news:title>",
    ]) {
        assert.ok(route.includes(token), `news sitemap should include ${token}`);
    }
    assert.match(route, /48 \* 60 \* 60 \* 1000/);
    assert.match(robots, /absoluteSiteUrl\("\/news-sitemap\.xml"\)/);
});

test("article pages expose complete NewsArticle signals and visible timestamps", () => {
    const article = read("app/news/[slug]/page.tsx");
    const site = read("app/_data/site.ts");

    for (const token of [
        '"@type": "NewsArticle"',
        "datePublished:",
        "dateModified:",
        '"@type": "Person"',
        "authorUrl",
        '"@type": "ImageObject"',
        '"@type": "WebPage"',
        "Published {formatDate(article.publishedAt)}",
        "Updated {formatDate(article.updatedAt)}",
    ]) {
        assert.ok(article.includes(token), `article SEO should include ${token}`);
    }
    assert.match(article, /canonical:\s*canonical/);
    assert.match(article, /absoluteSiteUrl\(`\/news\/\$\{article\.slug\}`\)/);
    assert.match(site, /process\.env\.NEXT_PUBLIC_SITE_URL/);
    assert.match(site, /https:\/\/cabeus-explorer\.jake-249\.workers\.dev/);
});

test("publisher transparency pages and disclosures are public and discoverable", () => {
    const shell = read("app/_components/MigrationShell.tsx");
    const authors = read("app/authors/page.tsx");
    const authorProfile = read("app/authors/[slug]/page.tsx");
    const contact = read("app/contact/page.tsx");
    const site = read("app/_data/site.ts");
    const sponsors = read("app/_components/SponsorUnit.tsx");
    const sitemap = read("app/sitemap.ts");
    const launchVisibility = read("app/_data/launchVisibility.ts");

    assert.match(shell, /href: "\/authors", label: "Author biographies"/);
    assert.match(shell, /href: "\/contact", label: "Contact & standards"/);
    assert.match(shell, /Join Cabeus Council/);
    assert.match(authors, /editorial_authors/);
    assert.match(authorProfile, /"@type": "Person"/);
    assert.match(authorProfile, /Articles by \{author\.display_name\}/);
    assert.match(contact, /siteConfig\.publisherEmail/);
    assert.match(contact, /siteConfig\.publisherLocation/);
    assert.match(site, /publisherEmail: "info@potomacdb\.com"/);
    assert.match(site, /publisherLocation: "Washington, DC, United States"/);
    assert.match(contact, /Original reporting/);
    assert.match(contact, />Advertising</);
    assert.match(sponsors, /Sponsored content/);
    assert.match(sponsors, /noopener noreferrer sponsored/);
    assert.match(sitemap, /loadAuthorEntries/);
    assert.match(sitemap, /path: "\/authors"/);
    assert.match(sitemap, /path: "\/contact"/);
    assert.doesNotMatch(launchVisibility, /"events"|"\/events"/);
});

test("homepage Moon hero uses a credited Apollo 11 photograph", () => {
    const homepage = read("app/page.tsx");
    const archives = read("app/archives/page.tsx");
    const backdrop = read("app/_components/ApolloMoonBackdrop.tsx");
    const brand = read("app/_data/brand.ts");

    assert.ok(existsSync(new URL("public/apollo-11-full-moon-nasa.jpg", root)));
    assert.match(brand, /editorialMoonHero: "\/apollo-11-full-moon-nasa\.jpg"/);
    assert.match(backdrop, /NASA \/ Apollo 11 \/ AS11-44-6667/);
    assert.match(backdrop, /Full Moon photographed by the Apollo 11 crew/);
    assert.match(backdrop, /max-w-none/);
    assert.match(backdrop, /sm:w-\[min\(96rem,100vw\)\]/);
    assert.match(homepage, /<ApolloMoonBackdrop \/>/);
    assert.match(homepage, /md:min-h-\[40rem\]/);
    assert.doesNotMatch(homepage, /md:py-24/);
    assert.match(archives, /<ApolloMoonBackdrop \/>/);
    assert.doesNotMatch(homepage, /Detailed Moon emerging from a warm ivory field/);
});
