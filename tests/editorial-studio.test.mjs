import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const studioPage = readFileSync("app/studio/page.tsx", "utf8");
const studioUi = readFileSync("app/studio/EditorialStudio.tsx", "utf8");
const loginPage = readFileSync("app/studio/login/page.tsx", "utf8");
const actions = readFileSync("app/admin/editorial/actions.ts", "utf8");
const sourceDocuments = readFileSync("lib/editorial/source-documents.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260720025828_editorial_studio_source_documents.sql", "utf8");
const workflowMigration = readFileSync("supabase/migrations/20260727170007_editorial_preview_scheduling_media.sql", "utf8");
const previewPage = readFileSync("app/studio/preview/[id]/page.tsx", "utf8");
const previewRender = readFileSync("app/studio/preview/[id]/render/page.tsx", "utf8");
const previewActions = readFileSync("app/studio/preview/[id]/PreviewActions.tsx", "utf8");
const devicePreview = readFileSync("app/studio/preview/[id]/DevicePreview.tsx", "utf8");
const dashboard = readFileSync("app/studio/dashboard/page.tsx", "utf8");
const dashboardActions = readFileSync("app/studio/dashboard/actions.ts", "utf8");
const sectionTags = readFileSync("lib/editorial/section-tags.ts", "utf8");
const sectionMigration = readFileSync("supabase/migrations/20260728135218_editorial_sections_and_carousel_positions.sql", "utf8");
const newsPage = readFileSync("app/news/page.tsx", "utf8");
const carouselLoader = readFileSync("app/_data/homepageCarousel.ts", "utf8");
const authorPage = readFileSync("app/authors/[slug]/page.tsx", "utf8");
const articlePage = readFileSync("app/news/[slug]/page.tsx", "utf8");
const richText = readFileSync("lib/editorial/rich-text.ts", "utf8");
const nextConfig = readFileSync("next.config.mjs", "utf8");

test("editorial studio uses the existing editor and admin authorization boundary", () => {
    assert.match(studioPage, /requireEditorialStaff\("\/studio"\)/);
    assert.match(loginPage, /next=%2Fstudio/);
    assert.match(migration, /has_any_role\(array\['editor', 'admin'\]\)/);
    assert.match(migration, /enable row level security/);
});

test("Word manuscripts stay in private role-protected storage", () => {
    for (const token of [
        "'editorial-source-documents'",
        "false",
        "10485760",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "for insert",
        "for select",
        "for update",
        "for delete",
        "storage.foldername(name)",
    ]) assert.ok(migration.includes(token), `missing ${token}`);
    assert.match(sourceDocuments, /\.endsWith\("\.docx"\)/);
    assert.match(sourceDocuments, /file\.size > maxSourceDocumentBytes/);
    assert.match(sourceDocuments, /upsert: false/);
});

test("studio supports journalist drafting without layout knowledge", () => {
    for (const token of [
        "Drop Word story here",
        "extractRawText",
        "Headline",
        "Byline",
        "author_name",
        "Standfirst",
        "Public teaser",
        "Draft from opening",
        "Story body",
        "Save draft",
        "Continue",
        "Start writing...",
        "Story images and video",
        "Intended publishing date and time",
    ]) assert.ok(studioUi.includes(token), `missing ${token}`);
});

test("studio saves source documents and retains article version history", () => {
    assert.match(actions, /storeSourceDocument/);
    assert.match(actions, /createVersion/);
    assert.match(actions, /resolvePrimaryAuthorId/);
    assert.match(studioPage, /primary_author_id/);
    assert.match(studioPage, /editorial_authors/);
    assert.match(actions, /revalidatePath\("\/studio"\)/);
    assert.match(studioUi, /createArticleDraft/);
    assert.match(studioUi, /updateArticleDraft/);
    assert.doesNotMatch(studioUi, /publishArticle/);
});

test("preview approval gates immediate and scheduled publication", () => {
    assert.match(actions, /editorial_preview_approvals/);
    assert.match(actions, /approveArticlePreview/);
    assert.match(actions, /scheduleArticle/);
    assert.match(actions, /Open the device preview/);
    assert.match(actions, /Assign a named author before publishing/);
    assert.match(actions, /Assign a named author before scheduling/);
    assert.match(previewActions, /publishArticle/);
    assert.match(previewActions, /scheduleArticle/);
    assert.match(previewPage, /current revision approved/);
    for (const device of ["Computer", "Tablet", "Phone"]) {
        assert.match(devicePreview, new RegExp(device));
    }
    assert.match(workflowMigration, /publish_due_editorial_articles/);
    assert.match(workflowMigration, /\*\/5 \* \* \* \*/);
    assert.match(nextConfig, /frame-ancestors 'self'/);
    assert.doesNotMatch(nextConfig, /frame-ancestors 'none'/);
    assert.match(nextConfig, /X-Frame-Options[\s\S]*SAMEORIGIN/);
});

test("unnamed editorial-desk stories cannot reach public news surfaces", () => {
    const publicLoaders = [
        readFileSync("app/page.tsx", "utf8"),
        readFileSync("app/news/page.tsx", "utf8"),
        readFileSync("app/news/[slug]/page.tsx", "utf8"),
        readFileSync("app/sitemap.ts", "utf8"),
        readFileSync("app/news-sitemap.xml/route.ts", "utf8"),
        readFileSync("app/_data/homepageCarousel.ts", "utf8"),
    ];
    for (const loader of publicLoaders) {
        assert.match(loader, /\.not\("primary_author_id", "is", null\)/);
    }
    assert.doesNotMatch(readFileSync("app/page.tsx", "utf8"), /Editorial desk/i);
    assert.doesNotMatch(articlePage, /Editorial Desk/i);
    const authorGateMigration = readFileSync(
        "supabase/migrations/20260728022500_require_named_author_for_scheduled_publication.sql",
        "utf8"
    );
    assert.match(authorGateMigration, /primary_author_id is not null/);
});

test("editorial media, scalable dashboard, and author pages are wired", () => {
    assert.match(workflowMigration, /editorial_media_assets/);
    assert.match(workflowMigration, /editorial-media/);
    assert.match(actions, /storeMediaAssets/);
    assert.match(actions, /removeArticleMedia/);
    assert.match(actions, /updateArticleMediaMetadata/);
    assert.match(actions, /return \{ articleId: article\.id, uploadedMedia \}/);
    assert.match(actions, /\.storage[\s\S]*\.remove/);
    assert.match(studioUi, /Ready to upload:/);
    assert.match(studioUi, /Save media details/);
    assert.match(studioUi, /Media description and caption saved\./);
    assert.match(studioUi, /mediaAssets: \[\.\.\.current\.mediaAssets, \.\.\.result\.uploadedMedia\]/);
    assert.match(studioUi, /Remove media/);
    assert.match(dashboard, /50 per page/);
    assert.match(dashboard, /scheduled_for/);
    assert.match(authorPage, /primary_author_id/);
    assert.match(authorPage, /Articles by/);
});

test("article sections and carousel positions are editor controlled", () => {
    for (const slug of [
        "news",
        "space-investment-forum",
        "space-industrialist-week",
        "cabeus-games",
    ]) {
        assert.match(sectionTags, new RegExp(slug));
        assert.match(sectionMigration, new RegExp(slug));
    }
    assert.match(studioUi, /name="section_tags"/);
    assert.match(actions, /syncArticleSectionTags/);
    assert.match(studioPage, /editorial_article_tags/);
    assert.match(newsPage, /editorial_article_tags/);
    assert.match(newsPage, /section=\$\{item\.slug\}/);
    assert.match(sectionMigration, /carousel_position between 1 and 5/);
    assert.match(sectionMigration, /set_editorial_article_carousel_position/);
    assert.match(dashboard, /Carousel position for/);
    assert.match(dashboard, /<option value="">N\/A<\/option>/);
    assert.match(dashboardActions, /updateCarouselPosition/);
    assert.match(carouselLoader, /\.not\("carousel_position", "is", null\)/);
    assert.match(carouselLoader, /displayRank: Number\(article\.carousel_position\)/);
});

test("studio preserves headline case and separates story paragraphs", () => {
    assert.doesNotMatch(studioUi, /uppercase[^>]*>\{draft\.title/);
    assert.doesNotMatch(previewPage, /text-3xl uppercase text-white/);
    assert.match(previewRender, /renderArticleHtml/);
    assert.match(previewRender, /heroAsset\?\.caption/);
    assert.match(previewRender, /<figcaption/);
    assert.match(articlePage, /split\(\/\\n\\s\*\\n\/\)/);
    assert.match(studioUi, /aria-label="Story body"/);
    assert.match(studioUi, /contentEditable/);
    assert.match(studioUi, /studio-rich-editor[^"]*text-white/);
    assert.match(readFileSync("app/globals.css", "utf8"), /\.studio-rich-editor[\s\S]*caret-color: white;[\s\S]*color: white;/);
    assert.match(studioUi, /runEditorCommand\("bold"\)/);
    assert.match(studioUi, /runEditorCommand\("underline"\)/);
    assert.match(studioUi, /setBodyHtml/);
    assert.doesNotMatch(studioUi, /Add section|\+ Paragraph|Move section|Remove section|draggable/);
    assert.match(studioUi, /Unsaved draft/);
    assert.match(studioUi, /aria-label="Text style"/);
    assert.match(devicePreview, /Computer/);
});

test("new stories, safe rich text, and standard article rendering are enforced", () => {
    assert.match(studioPage, /redirect\("\/studio\/dashboard"\)/);
    assert.match(studioPage, /!selectedArticleId && newStory !== "1"/);
    assert.match(studioPage, /newStory === "1"/);
    assert.match(studioUi, /href="\/studio\?new=1"/);
    assert.match(dashboard, /href="\/studio\?new=1"/);
    assert.match(studioUi, /timeZone: "UTC"/);
    assert.match(actions, /sanitizeArticleHtml/);
    assert.match(actions, /promoteFirstImageToHero/);
    assert.match(actions, /revalidatePath\("\/"\)/);
    assert.match(richText, /allowedTags/);
    assert.match(richText, /noopener noreferrer/);
    assert.match(articlePage, /article-rich-text/);
    assert.doesNotMatch(articlePage, />\s*Public summary\s*</);
    assert.doesNotMatch(articlePage, />\s*Public intro\s*</);
});
