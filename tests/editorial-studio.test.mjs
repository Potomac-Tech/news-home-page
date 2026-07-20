import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const studioPage = readFileSync("app/studio/page.tsx", "utf8");
const studioUi = readFileSync("app/studio/EditorialStudio.tsx", "utf8");
const loginPage = readFileSync("app/studio/login/page.tsx", "utf8");
const actions = readFileSync("app/admin/editorial/actions.ts", "utf8");
const sourceDocuments = readFileSync("lib/editorial/source-documents.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260720025828_editorial_studio_source_documents.sql", "utf8");

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
        "Standfirst",
        "Public teaser",
        "Draft from opening",
        "Story body",
        "draggable",
        "moveSection",
        "Homepage",
        "Full story",
        "Save draft",
        "Publish",
    ]) assert.ok(studioUi.includes(token), `missing ${token}`);
});

test("studio saves source documents and retains article version history", () => {
    assert.match(actions, /storeSourceDocument/);
    assert.match(actions, /createVersion/);
    assert.match(actions, /revalidatePath\("\/studio"\)/);
    assert.match(studioUi, /createArticleDraft/);
    assert.match(studioUi, /updateArticleDraft/);
    assert.match(studioUi, /publishArticle/);
});
