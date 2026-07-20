import type { requireEditorialStaff } from "../auth/editorial";

const bucket = "editorial-source-documents";
const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const maxSourceDocumentBytes = 10 * 1024 * 1024;

type EditorialSupabaseClient = Awaited<
    ReturnType<typeof requireEditorialStaff>
>["supabase"];

function safeFileName(value: string) {
    const normalized = value
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

    return normalized || "story.docx";
}

export function validateSourceDocument(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
        throw new Error("Source document must be a .docx Word file.");
    }
    if (file.size <= 0 || file.size > maxSourceDocumentBytes) {
        throw new Error("Source document must be between 1 byte and 10 MB.");
    }
    if (file.type && file.type !== docxMime) {
        throw new Error("Source document must use the Word .docx format.");
    }
}

export async function storeSourceDocument({
    supabase,
    userId,
    articleId,
    file,
}: {
    supabase: EditorialSupabaseClient;
    userId: string;
    articleId: string;
    file: File;
}) {
    validateSourceDocument(file);

    const objectPath = `${userId}/${articleId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(objectPath, bytes, {
            cacheControl: "3600",
            contentType: docxMime,
            upsert: false,
        });

    if (uploadError) throw new Error(uploadError.message);

    const { error: recordError } = await supabase
        .from("editorial_source_documents")
        .insert({
            article_id: articleId,
            storage_bucket: bucket,
            storage_object_path: objectPath,
            original_file_name: file.name,
            mime_type: docxMime,
            size_bytes: file.size,
            uploaded_by: userId,
        });

    if (recordError) {
        await supabase.storage.from(bucket).remove([objectPath]);
        throw new Error(recordError.message);
    }
}

export function sourceDocumentFrom(formData: FormData) {
    const value = formData.get("source_document");
    return value instanceof File && value.size > 0 ? value : null;
}
