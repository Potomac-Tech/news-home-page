import { NextResponse } from "next/server";
import { getTestDataAccessContext } from "../../../../../lib/auth/test-data";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type UploadRow = {
    id: string;
    title: string;
    file_format: string;
    test_environment: string | null;
    test_campaign: string | null;
};

type DatasetRow = {
    id: string;
    title: string;
    provider_name: string;
    dataset_kind: string;
    data_types: string[];
    geography_scope: string | null;
    access_tier_required: string | null;
};

function cleanId(value: FormDataEntryValue | null) {
    return typeof value === "string" ? value.trim() : "";
}

function jsonError(message: string, status = 400) {
    return NextResponse.json({ ok: false, message }, { status });
}

function scoreFor(upload: UploadRow, dataset: DatasetRow) {
    let score = 45;
    const dataTypes = dataset.data_types.join(" ").toLowerCase();
    const environment = `${upload.test_environment ?? ""} ${
        upload.test_campaign ?? ""
    }`.toLowerCase();

    if (upload.file_format === "csv") {
        score += 10;
    }

    if (environment && dataTypes) {
        for (const token of ["thermal", "radiation", "terrain", "regolith"]) {
            if (environment.includes(token) && dataTypes.includes(token)) {
                score += 15;
                break;
            }
        }
    }

    if (dataset.geography_scope?.toLowerCase().includes("moon")) {
        score += 10;
    }

    return Math.min(score, 85);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const access = await getTestDataAccessContext({
        supabase,
        nextPath: "/member/test-data",
    });

    if (access.state === "signed_out") {
        return jsonError("Sign in before running a comparison.", 401);
    }

    if (!access.canUploadTestData || !access.userId) {
        return jsonError(
            "Scout or Command access is required for comparisons.",
            403
        );
    }

    const formData = await request.formData();
    const uploadId = cleanId(formData.get("uploadId"));
    const datasetId = cleanId(formData.get("datasetId"));

    if (!uploadId || !datasetId) {
        return jsonError("Choose both an uploaded file and a reference dataset.");
    }

    const [uploadResult, datasetResult] = await Promise.all([
        supabase
            .from("experimental_test_data_uploads")
            .select("id,title,file_format,test_environment,test_campaign")
            .eq("id", uploadId)
            .eq("user_id", access.userId)
            .in("validation_status", ["accepted", "needs_review"])
            .maybeSingle(),
        supabase
            .from("dataset_catalog_entries")
            .select(
                "id,title,provider_name,dataset_kind,data_types,geography_scope,access_tier_required"
            )
            .eq("id", datasetId)
            .eq("publication_status", "published")
            .in("availability_state", ["available", "preview"])
            .maybeSingle(),
    ]);

    if (uploadResult.error) {
        return jsonError(uploadResult.error.message, 400);
    }

    if (datasetResult.error) {
        return jsonError(datasetResult.error.message, 400);
    }

    const upload = uploadResult.data as UploadRow | null;
    const dataset = datasetResult.data as DatasetRow | null;

    if (!upload) {
        return jsonError("The selected upload is unavailable for comparison.");
    }

    if (!dataset) {
        return jsonError("The selected reference dataset is unavailable.");
    }

    const compatibilityScore = scoreFor(upload, dataset);
    const resultSummary = `${upload.title} was staged against ${dataset.title}. This preliminary comparison checks file metadata, campaign context, and reference dataset scope; row-level numeric matching still requires the parser planned for a later data operations task.`;
    const limitations = [
        "File contents are not parsed in this scaffolded comparison.",
        "Units, column names, sampling cadence, and uncertainty are not normalized yet.",
        "Results should be treated as a planning signal until analyst review is added.",
    ];
    const assumptions = {
        upload_format: upload.file_format,
        reference_provider: dataset.provider_name,
        reference_kind: dataset.dataset_kind,
        reference_data_types: dataset.data_types,
        method: "metadata_scope_alignment_v1",
    };

    const { error: insertError } = await supabase
        .from("experimental_test_data_comparisons")
        .insert({
            user_id: access.userId,
            upload_id: upload.id,
            reference_dataset_id: dataset.id,
            status: "completed",
            result_summary: resultSummary,
            assumptions,
            limitations,
            compatibility_score: compatibilityScore,
        });

    if (insertError) {
        return jsonError(insertError.message, 400);
    }

    return NextResponse.json({
        ok: true,
        message: "Comparison result saved.",
    });
}
