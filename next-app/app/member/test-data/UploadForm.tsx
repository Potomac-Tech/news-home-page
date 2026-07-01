"use client";

import { FormEvent, useRef, useState } from "react";

type UploadState = {
    status: "idle" | "submitting" | "success" | "error";
    message: string;
};

export function UploadForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, setState] = useState<UploadState>({
        status: "idle",
        message: "",
    });

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setState({
            status: "submitting",
            message: "Uploading test data...",
        });

        const response = await fetch("/api/member/test-data/uploads", {
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
                message: payload.message ?? "Upload failed.",
            });
            return;
        }

        formRef.current?.reset();
        setState({
            status: "success",
            message: payload.message ?? "Upload accepted.",
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="glass-card rounded p-6"
        >
            <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Upload
                </p>
                <h2 className="mt-2 font-serif text-3xl text-white">
                    Earth Test Dataset
                </h2>
                <p className="mt-3 text-sm leading-6 text-potomac-cream/65">
                    CSV and XLSX files up to 6 MB are accepted into private
                    storage for the upcoming comparison dashboard.
                </p>
            </div>

            <div className="mt-6 grid gap-5">
                <label className="grid gap-2 text-sm text-potomac-cream/75">
                    <span className="font-bold text-white">Dataset title</span>
                    <input
                        name="title"
                        required
                        maxLength={160}
                        className="rounded border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-potomac-cream/35 focus:border-potomac-gold"
                        placeholder="Thermal vacuum coupon run A"
                    />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-potomac-cream/75">
                        <span className="font-bold text-white">
                            Test environment
                        </span>
                        <input
                            name="testEnvironment"
                            maxLength={160}
                            className="rounded border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-potomac-cream/35 focus:border-potomac-gold"
                            placeholder="Thermal vacuum chamber"
                        />
                    </label>
                    <label className="grid gap-2 text-sm text-potomac-cream/75">
                        <span className="font-bold text-white">
                            Campaign
                        </span>
                        <input
                            name="testCampaign"
                            maxLength={160}
                            className="rounded border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-potomac-cream/35 focus:border-potomac-gold"
                            placeholder="Q3 regolith exposure"
                        />
                    </label>
                </div>

                <label className="grid gap-2 text-sm text-potomac-cream/75">
                    <span className="font-bold text-white">File</span>
                    <input
                        name="file"
                        type="file"
                        required
                        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="rounded border border-dashed border-potomac-gold/35 bg-white/5 px-4 py-6 text-sm text-potomac-cream/75 file:mr-4 file:rounded file:border-0 file:bg-potomac-gold file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.14em] file:text-potomac-primary"
                    />
                </label>

                <label className="grid gap-2 text-sm text-potomac-cream/75">
                    <span className="font-bold text-white">Notes</span>
                    <textarea
                        name="notes"
                        maxLength={1200}
                        rows={5}
                        className="rounded border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-potomac-cream/35 focus:border-potomac-gold"
                        placeholder="Describe units, columns, limits, or known caveats."
                    />
                </label>
            </div>

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
                disabled={state.status === "submitting"}
                className="mt-6 rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
                {state.status === "submitting" ? "Uploading" : "Upload dataset"}
            </button>
        </form>
    );
}
