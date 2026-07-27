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
const previewActions = readFileSync("app/studio/preview/[id]/PreviewActions.tsx", "utf8");
const devicePreview = readFileSync("app/studio/preview/[id]/DevicePreview.tsx", "utf8");
const dashboard = readFileSync("app/studio/dashboard/page.tsx", "utf8");
const authorPage = readFileSync("app/authors/[slug]/page.tsx", "utf8");

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
        "draggable",
        "moveSection",
        "Homepage",
        "Full story",
        "Save draft",
        "Preview to publish",
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
    assert.match(previewActions, /publishArticle/);
    assert.match(previewActions, /scheduleArticle/);
    assert.match(previewPage, /current revision approved/);
    for (const device of ["Computer", "Tablet", "Phone"]) {
        assert.match(devicePreview, new RegExp(device));
    }
    assert.match(workflowMigration, /publish_due_editorial_articles/);
    assert.match(workflowMigration, /\*\/5 \* \* \* \*/);
});

test("editorial media, scalable dashboard, and author pages are wired", () => {
    assert.match(workflowMigration, /editorial_media_assets/);
    assert.match(workflowMigration, /editorial-media/);
    assert.match(actions, /storeMediaAssets/);
    assert.match(dashboard, /50 per page/);
    assert.match(dashboard, /scheduled_for/);
    assert.match(authorPage, /primary_author_id/);
    assert.match(authorPage, /Articles by/);
});
