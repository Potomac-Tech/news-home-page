import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const studioPage = readFileSync("app/studio/page.tsx", "utf8");
const studioUi = readFileSync("app/studio/EditorialStudio.tsx", "utf8");
const loginPage = readFileSync("app/studio/login/page.tsx", "utf8");
const actions = readFileSync("app/admin/editorial/actions.ts", "utf8");
const sourceDocuments = readFileSync("lib/editorial/source-documents.ts", "utf8");
const mediaAssets = readFileSync("lib/editorial/media-assets.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260720025828_editorial_studio_source_documents.sql", "utf8");
const workflowMigration = readFileSync("supabase/migrations/20260727170007_editorial_preview_scheduling_media.sql", "utf8");
const previewPage = readFileSync("app/studio/preview/[id]/page.tsx", "utf8");
const previewRender = readFileSync("app/studio/preview/[id]/render/page.tsx", "utf8");
const previewActions = readFileSync("app/studio/preview/[id]/PreviewActions.tsx", "utf8");
const devicePreview = readFileSync("app/studio/preview/[id]/DevicePreview.tsx", "utf8");
const dashboard = readFileSync("app/studio/dashboard/page.tsx", "utf8");
const dashboardActions = readFileSync("app/studio/dashboard/actions.ts", "utf8");
const carouselControl = readFileSync("app/studio/dashboard/CarouselPositionControl.tsx", "utf8");
const sectionTags = readFileSync("lib/editorial/section-tags.ts", "utf8");
const sectionMigration = readFileSync("supabase/migrations/20260728135218_editorial_sections_and_carousel_positions.sql", "utf8");
const newsPage = readFileSync("app/news/page.tsx", "utf8");
const archivesPage = readFileSync("app/archives/page.tsx", "utf8");
const editorialArchive = readFileSync("app/_data/editorialArchive.ts", "utf8");
const editorialArchiveList = readFileSync("app/_components/EditorialArchiveList.tsx", "utf8");
const carouselLoader = readFileSync("app/_data/homepageCarousel.ts", "utf8");
const authorPage = readFileSync("app/authors/[slug]/page.tsx", "utf8");
const authorsPage = readFileSync("app/authors/page.tsx", "utf8");
const articlePage = readFileSync("app/news/[slug]/page.tsx", "utf8");
const homepage = readFileSync("app/page.tsx", "utf8");
const richText = readFileSync("lib/editorial/rich-text.ts", "utf8");
const mediaFingerprint = readFileSync("lib/editorial/media-fingerprint.ts", "utf8");
const nextConfig = readFileSync("next.config.mjs", "utf8");
const globalStyles = readFileSync("app/globals.css", "utf8");
const videoMigration = readFileSync("supabase/migrations/20260728172344_allow_editorial_quicktime_video.sql", "utf8");
const youtubeMigration = readFileSync("supabase/migrations/20260729045803_add_youtube_editorial_media.sql", "utf8");
const youtube = readFileSync("lib/editorial/youtube.ts", "utf8");
const editorialVideo = readFileSync("app/_components/EditorialVideo.tsx", "utf8");
const kevinEmailMigration = readFileSync(
    "supabase/migrations/20260730204321_add_kevin_cirilli_author_email.sql",
    "utf8"
);
const jacobAuthorMigration = readFileSync(
    "supabase/migrations/20260804160652_add_jacob_matthews_author_profile.sql",
    "utf8"
);
const jacobPortraitMigration = readFileSync(
    "supabase/migrations/20260804162618_add_jacob_matthews_author_portrait.sql",
    "utf8"
);
const jacobBioMigration = readFileSync(
    "supabase/migrations/20260804163416_update_jacob_matthews_author_bio.sql",
    "utf8"
);
const kevinBioCleanupMigration = readFileSync(
    "supabase/migrations/20260804163536_remove_kevin_cirilli_newsletter_bio_reference.sql",
    "utf8"
);

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

test("studio accepts and renders common article video formats", () => {
    for (const mimeType of [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-m4v",
    ]) {
        assert.ok(mediaAssets.includes(mimeType), `missing server validation for ${mimeType}`);
        assert.ok(studioUi.includes(mimeType), `missing file-picker support for ${mimeType}`);
        assert.ok(videoMigration.includes(mimeType), `missing bucket support for ${mimeType}`);
    }
    assert.match(nextConfig, /bodySizeLimit: "100mb"/);
    assert.match(studioUi, /aria-label=\{altText \|\| "Article video"\}/);
    assert.doesNotMatch(previewRender, /!inlineMediaIds\.has/);
    assert.doesNotMatch(articlePage, /!inlineMediaIds\.has/);
    assert.match(editorialVideo, /aria-label=\{title\}/);
    assert.match(editorialVideo, /playsInline/);
});

test("studio integrates privacy-enhanced YouTube Unlisted hosting", () => {
    for (const token of [
        "UCVEihTOMM2801sGKtplQ7qw",
        "youtu.be",
        "youtube.com",
        "youtube-nocookie.com",
        "watch?v=",
        "embedUrl",
    ]) assert.ok(youtube.includes(token), `missing YouTube integration token ${token}`);

    assert.match(youtubeMigration, /hosting_provider in \('supabase', 'youtube'\)/);
    assert.match(youtubeMigration, /external_video_id ~ '\^\[A-Za-z0-9_-\]\{11\}\$'/);
    assert.match(youtubeMigration, /editorial_media_assets_article_youtube_unique/);
    assert.match(mediaAssets, /storeYouTubeAsset/);
    assert.match(actions, /addYouTubeArticleMedia/);
    assert.match(actions, /asset\.hosting_provider === "supabase"/);
    assert.match(studioUi, /YouTube Unlisted video/);
    assert.match(studioUi, /Upload on YouTube/);
    assert.match(studioUi, /Attach video/);
    assert.match(studioUi, /CABEUS_YOUTUBE_CHANNEL_URL/);
    assert.match(studioUi, /hostingProvider === "youtube"/);
    assert.match(richText, /allowedIframeHostnames: \["www\.youtube-nocookie\.com"\]/);
    assert.match(editorialVideo, /allowFullScreen/);
    assert.match(editorialVideo, /referrerPolicy="strict-origin-when-cross-origin"/);
    assert.match(nextConfig, /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);
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
        archivesPage + editorialArchive,
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
    for (const placement of ["Beginning", "Cursor", "End"]) {
        assert.match(studioUi, new RegExp(placement));
    }
    assert.match(studioUi, /removeExistingMediaEmbed/);
    assert.match(studioUi, /Repositioning moves the existing media/);
    assert.match(studioUi, /drag it to an exact paragraph/);
    assert.match(dashboard, /50 per page/);
    assert.match(dashboard, /scheduled_for/);
    assert.match(authorPage, /primary_author_id/);
    assert.match(authorPage, /Articles by/);
    assert.match(authorPage, /bg-cabeus-paper text-cabeus-ink/);
    assert.match(authorPage, /avatarUrl[\s\S]*\? "grid md:grid-cols-\[15rem_minmax\(0,1fr\)\] md:items-start"[\s\S]*: "block"/);
    assert.match(authorsPage, /bg-cabeus-paper text-cabeus-ink/);
    assert.doesNotMatch(authorPage, /text-white|text-potomac-cream/);
    assert.doesNotMatch(authorsPage, /text-white|text-potomac-cream/);
});

test("draft editorial media stays private and published media uses the application route", () => {
    const hardening = readFileSync("supabase/migrations/20260804212406_harden_launch_security_controls.sql", "utf8");
    const mediaStorage = readFileSync("lib/editorial/media-assets.ts", "utf8");
    const mediaRoute = readFileSync("app/api/editorial-media/[id]/route.ts", "utf8");

    assert.match(hardening, /update storage\.buckets[\s\S]*set public = false[\s\S]*editorial-media/);
    assert.match(hardening, /editorial_media_storage_select/);
    assert.match(hardening, /article\.status = 'published'/);
    assert.match(mediaStorage, /`\/api\/editorial-media\/\$\{assetId\}`/);
    assert.match(mediaRoute, /from\("editorial_media_assets"\)/);
    assert.match(mediaRoute, /\.download\(asset\.storage_object_path\)/);
});

test("story entry points and author bylines link to their destinations", () => {
    assert.match(homepage, /\.select\("id,display_name,slug"\)/);
    assert.match(homepage, /href=\{`\/authors\/\$\{story\.authorSlug\}`\}/);
    assert.match(homepage, /href=\{story\.href\}[\s\S]*group-hover:underline/);
    assert.match(homepage, /aria-label=\{`Read \$\{story\.title\}`\}/);
    assert.doesNotMatch(homepage, /Full story →/);
    assert.match(articlePage, /href=\{`\/authors\/\$\{article\.authorSlug\}`\}/);
    assert.match(previewRender, /href=\{`\/authors\/\$\{author\.slug\}`\}/);
    for (const placement of ["homepage_carousel_headline", "homepage_carousel_subhead", "homepage_carousel_image"]) {
        assert.match(readFileSync("app/_components/HomepageCarousel.tsx", "utf8"), new RegExp(placement));
    }
    assert.doesNotMatch(readFileSync("app/_components/HomepageCarousel.tsx", "utf8"), /slide\.ctaLabel/);
});

test("Kevin Cirilli author profile exposes a valid email contact", () => {
    assert.match(kevinEmailMigration, /mailto:kevin@cabeusexplorer\.com/);
    assert.match(kevinEmailMigration, /where lower\(slug\) = 'kevin-cirilli'/);
    assert.match(authorPage, /email: emailLink/);
    assert.match(authorPage, /<p className="brand-kicker">Contact<\/p>/);
    assert.match(authorPage, /sameAs: profileLinks/);
    assert.match(kevinBioCleanupMigration, /replace\(/);
    assert.match(kevinBioCleanupMigration, /where lower\(slug\) = 'kevin-cirilli'/);
});

test("Jacob Matthews has an active linked author profile", () => {
    assert.match(jacobAuthorMigration, /display_name = 'Jacob Matthews'/);
    assert.match(jacobAuthorMigration, /'jacob-matthews'/);
    assert.match(jacobAuthorMigration, /Potomac Database Systems/);
    assert.match(jacobAuthorMigration, /mailto:jake@potomacdb\.com/);
    assert.match(jacobAuthorMigration, /is_active = true/);
    assert.match(jacobPortraitMigration, /avatar_url = '\/jacob-matthews-author\.jpg'/);
    assert.match(jacobPortraitMigration, /where lower\(slug\) = 'jacob-matthews'/);
    assert.match(jacobBioMigration, /founder and CEO of Potomac/);
    assert.match(jacobBioMigration, /co-founded Zeno Power/);
    assert.match(jacobBioMigration, /U\.S\. Army Cavalry officer/);
    assert.match(jacobBioMigration, /Vanderbilt University/);
    assert.match(jacobBioMigration, /United States Military Academy at West Point/);
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
    assert.match(newsPage, /redirect\("\/"\)/);
    assert.match(archivesPage, /loadEditorialArchive/);
    assert.match(editorialArchive, /editorial_article_tags/);
    assert.match(editorialArchiveList, /articles\.map/);
    assert.match(archivesPage, /displayMode="news"/);
    assert.match(archivesPage, /Cabeus Explorer is the permanent record of the Moon \(and beyond\)\./);
    assert.doesNotMatch(archivesPage, /Archive sections|editorialSections/);
    assert.match(editorialArchive, /authorName/);
    assert.match(editorialArchive, /authorSlug/);
    assert.match(editorialArchiveList, /By \{article\.authorName\}/);
    assert.match(sectionMigration, /carousel_position between 1 and 5/);
    assert.match(sectionMigration, /set_editorial_article_carousel_position/);
    assert.match(carouselControl, /Carousel position for/);
    assert.match(carouselControl, /<option value="">N\/A<\/option>/);
    assert.match(carouselControl, /router\.refresh\(\)/);
    assert.match(carouselControl, /setMessage\("Saved"\)/);
    assert.match(carouselControl, /Appears after this article is published\./);
    assert.match(dashboardActions, /updateCarouselPosition/);
    assert.match(dashboardActions, /savedArticle\.carousel_position !== position/);
    assert.match(actions, /updateArticleSectionTags/);
    assert.match(actions, /Article sections were not saved/);
    assert.match(studioUi, /Article sections saved\./);
    assert.match(carouselLoader, /\.not\("carousel_position", "is", null\)/);
    assert.match(carouselLoader, /displayRank: Number\(article\.carousel_position\)/);
    assert.match(carouselLoader, /if \(auto\.length\)/);
    assert.match(carouselLoader, /left\.displayRank - right\.displayRank/);
    assert.doesNotMatch(homepage, /homepage-editorial-lead/);
});

test("studio preserves headline case and separates story paragraphs", () => {
    assert.doesNotMatch(studioUi, /uppercase[^>]*>\{draft\.title/);
    assert.doesNotMatch(previewPage, /text-3xl uppercase text-white/);
    assert.match(previewRender, /renderArticleHtml/);
    assert.match(previewRender, /excludeImageSrcs: duplicateHeroImageUrls/);
    assert.match(articlePage, /excludeImageSrcs: duplicateHeroImageUrls/);
    assert.match(richText, /parseDocument/);
    assert.match(richText, /DomUtils\.getParent/);
    assert.match(richText, /removeDuplicateImages/);
    assert.match(mediaFingerprint, /method: "HEAD"/);
    assert.match(mediaFingerprint, /etag/);
    assert.match(mediaFingerprint, /contentLength/);
    assert.match(mediaFingerprint, /findDuplicateHeroImageUrls/);
    assert.match(previewRender, /heroAsset\?\.caption/);
    assert.match(previewRender, /<figcaption/);
    assert.match(articlePage, /split\(\/\\n\\s\*\\n\/\)/);
    assert.match(studioUi, /aria-label="Story body"/);
    assert.match(studioUi, /contentEditable/);
    assert.match(studioUi, /studio-rich-editor[^"]*text-cabeus-ink/);
    assert.match(globalStyles, /\.studio-rich-editor[\s\S]*caret-color: #151513;[\s\S]*color: #151513;/);
    assert.match(studioUi, /runEditorCommand\("bold"\)/);
    assert.match(studioUi, /runEditorCommand\("underline"\)/);
    assert.match(studioUi, /setBodyHtml/);
    assert.match(studioUi, /bodyHtmlRef\.current = nextBody/);
    assert.doesNotMatch(studioUi, /onInput=\{\(event\) => setBodyHtml/);
    assert.doesNotMatch(studioUi, /Add section|\+ Paragraph|Move section|Remove section/);
    assert.match(studioUi, /application\/x-cabeus-media/);
    assert.match(studioUi, /event\.dataTransfer\.files/);
    assert.match(studioUi, /file\.type\.startsWith\("image\/"\)/);
    assert.match(studioUi, /file\.type\.startsWith\("video\/"\)/);
    assert.match(studioUi, /placeMediaAssets\(result\.uploadedMedia, "cursor"\)/);
    assert.match(studioUi, /formData\.set\("body_markdown", bodyHtmlRef\.current\)/);
    assert.match(studioUi, /saveStory\(new FormData\(form\), true\)/);
    assert.match(studioUi, /router\.push\(`\/studio\/preview\/\$\{result\.articleId\}`\)/);
    assert.match(studioUi, /commitBodyFromEditor/);
    assert.match(studioUi, /Use as thumbnail/);
    assert.match(studioUi, /aria-label="Font family"/);
    assert.match(studioUi, /aria-label="Font size"/);
    assert.match(studioUi, /Unsaved draft/);
    assert.match(studioUi, /aria-label="Text style"/);
    assert.match(devicePreview, /Computer/);
});

test("editorial CMS follows the Cabeus visual system", () => {
    const surfaces = [
        studioUi,
        dashboard,
        previewPage,
        previewRender,
        previewActions,
        devicePreview,
        carouselControl,
    ];

    for (const surface of surfaces) {
        assert.match(surface, /cabeus-/);
        assert.doesNotMatch(surface, /bg-potomac-primary|text-potomac-cream|text-potomac-gold|text-potomac-regolith/);
    }

    assert.match(studioUi, /bg-cabeus-paper[^"]*text-cabeus-ink/);
    assert.match(dashboard, /bg-cabeus-paper[^"]*text-cabeus-ink/);
    assert.match(previewRender, /bg-cabeus-paper[^"]*text-cabeus-ink/);
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
