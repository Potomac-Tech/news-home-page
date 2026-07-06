import { NextResponse } from "next/server";
import { getTestDataAccessContext } from "../../../../../lib/auth/test-data";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const bucketName = "experimental-test-data";
const maxUploadBytes = 6 * 1024 * 1024;
const allowedFormats = new Map([
    ["csv", ["text/csv", "application/csv", "application/vnd.ms-excel"]],
    [
        "xlsx",
        [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
    ],
]);

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maxLength);
}

function fileFormat(filename: string) {
    const extension = filename.split(".").pop()?.toLowerCase();

    return extension === "csv" || extension === "xlsx" ? extension : null;
}

function jsonError(message: string, status = 400) {
    return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const access = await getTestDataAccessContext({
        supabase,
        nextPath: "/member/test-data",
    });

    if (access.state === "signed_out") {
        return jsonError("Sign in before uploading test data.", 401);
    }

    if (!access.canUploadTestData || !access.userId) {
        return jsonError(
            "Scout or Command access is required for test data uploads.",
            403
        );
    }

    const formData = await request.formData();
    const title = cleanText(formData.get("title"), 160);
    const testEnvironment = cleanText(formData.get("testEnvironment"), 160);
    const testCampaign = cleanText(formData.get("testCampaign"), 160);
    const notes = cleanText(formData.get("notes"), 1200);
    const file = formData.get("file");

    if (!title) {
        return jsonError("Add a dataset title before uploading.");
    }

    if (!(file instanceof File) || file.size === 0) {
        return jsonError("Choose a CSV or XLSX file to upload.");
    }

    if (file.size > maxUploadBytes) {
        return jsonError("Files must be 6 MB or smaller for this upload flow.");
    }

    const format = fileFormat(file.name);

    if (!format) {
        return jsonError("Only .csv and .xlsx files are accepted.");
    }

    const allowedMimeTypes = allowedFormats.get(format) ?? [];
    const mimeType = file.type || "application/octet-stream";

    if (file.type && !allowedMimeTypes.includes(file.type)) {
        return jsonError(
            "The file type does not match the selected CSV/XLSX upload rules."
        );
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `${access.userId}/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;
    const uploadResult = await supabase.storage
        .from(bucketName)
        .upload(objectPath, file, {
            contentType: allowedMimeTypes[0] ?? mimeType,
            upsert: false,
        });

    if (uploadResult.error) {
        return jsonError(uploadResult.error.message, 400);
    }

    const { error: insertError } = await supabase
        .from("experimental_test_data_uploads")
        .insert({
            user_id: access.userId,
            title,
            test_environment: testEnvironment || null,
            test_campaign: testCampaign || null,
            notes: notes || null,
            storage_bucket: bucketName,
            storage_object_path: objectPath,
            original_filename: file.name,
            file_format: format,
            mime_type: mimeType,
            byte_size: file.size,
            validation_status: "accepted",
            validation_errors: [],
        });

    if (insertError) {
        await supabase.storage.from(bucketName).remove([objectPath]);

        return jsonError(insertError.message, 400);
    }

    return NextResponse.json({
        ok: true,
        message: "Upload accepted for comparison setup.",
    });
}
