"use client";

import { FormEvent, useState } from "react";

export type CompareUploadOption = {
    id: string;
    title: string;
    original_filename: string;
};

export type CompareDatasetOption = {
    id: string;
    title: string;
    provider_name: string;
    access_tier_required: string | null;
};

type CompareState = {
    status: "idle" | "submitting" | "success" | "error";
    message: string;
};

function tierLabel(value: string | null) {
    if (!value) {
        return "Public";
    }

    return value === "command" ? "Command" : "Scout";
}

export function CompareForm({
    uploads,
    datasets,
}: {
    uploads: CompareUploadOption[];
    datasets: CompareDatasetOption[];
}) {
    const [state, setState] = useState<CompareState>({
        status: "idle",
        message: "",
    });

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setState({
            status: "submitting",
            message: "Running comparison...",
        });

        const response = await fetch("/api/member/test-data/comparisons", {
            method: "POST",
            body: new FormData(event.currentTarget),
        });
        const payload = (await response.json()) as {
            ok?: boolean;
            message?: string;
        };

        if (!response.ok || !payload.ok) {
            setState({
                status: "error",
                message: payload.message ?? "Comparison failed.",
            });
            return;
        }

        setState({
            status: "success",
            message: payload.message ?? "Comparison saved.",
        });
    }

    const disabled =
        state.status === "submitting" || !uploads.length || !datasets.length;

    return (
        <form onSubmit={handleSubmit} className="glass-card rounded p-6">
            <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Compare
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white">
                    Test Data vs Reference
                </h2>
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    Select one uploaded file and one approved lunar/public
                    reference dataset to create a scoped comparison record.
                </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-potomac-cream/75">
                    <span className="font-bold text-white">Uploaded file</span>
                    <select
                        name="uploadId"
                        required
                        className="rounded border border-white/10 bg-potomac-primary px-4 py-3 text-white outline-none transition focus:border-potomac-gold"
                        disabled={!uploads.length}
                    >
                        <option value="">Choose upload</option>
                        {uploads.map((upload) => (
                            <option key={upload.id} value={upload.id}>
                                {upload.title} - {upload.original_filename}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="grid gap-2 text-sm text-potomac-cream/75">
                    <span className="font-bold text-white">
                        Reference dataset
                    </span>
                    <select
                        name="datasetId"
                        required
                        className="rounded border border-white/10 bg-potomac-primary px-4 py-3 text-white outline-none transition focus:border-potomac-gold"
                        disabled={!datasets.length}
                    >
                        <option value="">Choose dataset</option>
                        {datasets.map((dataset) => (
                            <option key={dataset.id} value={dataset.id}>
                                {dataset.title} - {dataset.provider_name} (
                                {tierLabel(dataset.access_tier_required)})
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {!uploads.length || !datasets.length ? (
                <p className="mt-5 rounded border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-potomac-cream/65">
                    A comparison needs at least one accepted upload and one
                    available reference dataset.
                </p>
            ) : null}

            {state.message ? (
                <p
                    className={
                        state.status === "error"
                            ? "mt-5 rounded border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                            : "mt-5 rounded border border-potomac-gold/30 bg-potomac-gold/10 px-4 py-3 text-sm text-potomac-cream"
                    }
                >
                    {state.message}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={disabled}
                className="mt-6 rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
                {state.status === "submitting" ? "Running" : "Run comparison"}
            </button>
        </form>
    );
}
