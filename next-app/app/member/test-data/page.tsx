import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTestDataAccessContext } from "../../../lib/auth/test-data";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { UploadForm } from "./UploadForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Experimental Test Data",
};

type TestDataUpload = {
    id: string;
    title: string;
    original_filename: string;
    file_format: string;
    byte_size: number;
    validation_status: string;
    uploaded_at: string;
    test_environment: string | null;
    test_campaign: string | null;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
});

function statusLabel(value: string | null | undefined) {
    if (!value) {
        return "Not set";
    }

    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not set";
    }

    return dateTimeFormatter.format(date);
}

function formatFileSize(value: number) {
    if (value >= 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function ConfigGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Experimental test data
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Supabase session required
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Uploads require Potomac Supabase Storage and a signed-in
                        Scout or Command member. Configure the public Supabase
                        environment variables before testing this flow locally.
                    </p>
                    <Link
                        href="/member"
                        className="mt-6 inline-flex rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                    >
                        Member workspace
                    </Link>
                </div>
            </div>
        </section>
    );
}

function LockedGate() {
    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-20 md:px-8">
                <div className="glass-card max-w-3xl rounded p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                        Experimental test data
                    </p>
                    <h1 className="mt-4 font-serif text-4xl leading-tight text-white">
                        Scout or Command access is required.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-potomac-cream/70">
                        Earth test data uploads are reserved for paid Scout
                        members, Command organization users, and authorized
                        staff because files may contain sensitive experimental
                        context.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/member"
                            className="rounded border border-potomac-gold/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                        <Link
                            href="/command"
                            className="rounded bg-potomac-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-primary transition hover:bg-potomac-cream"
                        >
                            Command access
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function RecentUploads({ uploads }: { uploads: TestDataUpload[] }) {
    return (
        <section className="glass-card h-fit rounded p-6">
            <div className="border-b border-white/10 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                    Recent files
                </p>
                <h2 className="mt-2 font-serif text-2xl text-white">
                    Upload History
                </h2>
            </div>
            <div className="mt-5 space-y-4">
                {uploads.length ? (
                    uploads.map((upload) => (
                        <article
                            key={upload.id}
                            className="border-b border-white/10 pb-4 last:border-0 last:pb-0"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white">
                                        {upload.title}
                                    </h3>
                                    <p className="mt-1 break-all text-xs text-potomac-cream/55">
                                        {upload.original_filename}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded border border-potomac-gold/35 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-potomac-gold">
                                    {upload.file_format}
                                </span>
                            </div>
                            <dl className="mt-3 space-y-2 text-xs text-potomac-cream/55">
                                <div className="flex justify-between gap-4">
                                    <dt>Status</dt>
                                    <dd className="text-potomac-cream/75">
                                        {statusLabel(upload.validation_status)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Size</dt>
                                    <dd className="text-potomac-cream/75">
                                        {formatFileSize(upload.byte_size)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Uploaded</dt>
                                    <dd className="text-right text-potomac-cream/75">
                                        {formatDateTime(upload.uploaded_at)}
                                    </dd>
                                </div>
                            </dl>
                            {upload.test_environment || upload.test_campaign ? (
                                <p className="mt-3 text-xs leading-5 text-potomac-cream/50">
                                    {[upload.test_environment, upload.test_campaign]
                                        .filter(Boolean)
                                        .join(" | ")}
                                </p>
                            ) : null}
                        </article>
                    ))
                ) : (
                    <p className="text-sm leading-6 text-potomac-cream/60">
                        No test data uploads are visible for this account yet.
                    </p>
                )}
            </div>
        </section>
    );
}

export default async function ExperimentalTestDataPage() {
    if (!hasPotomacSupabasePublicConfig()) {
        return <ConfigGate />;
    }

    const supabase = await createClient();
    const access = await getTestDataAccessContext({
        supabase,
        nextPath: "/member/test-data",
    });

    if (access.state === "signed_out") {
        redirect(access.loginHref);
    }

    if (!access.canUploadTestData) {
        return <LockedGate />;
    }

    const { data, error } = await supabase
        .from("experimental_test_data_uploads")
        .select(
            "id,title,original_filename,file_format,byte_size,validation_status,uploaded_at,test_environment,test_campaign"
        )
        .order("uploaded_at", { ascending: false })
        .limit(8);

    if (error) {
        throw new Error(error.message);
    }

    return (
        <section className="bg-grid-pattern">
            <div className="mx-auto min-h-[calc(100vh-9rem)] w-full max-w-7xl px-4 py-16 md:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-potomac-gold">
                            Scout and Command intelligence
                        </p>
                        <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
                            Experimental Test Data
                        </h1>
                        <p className="mt-6 max-w-3xl text-lg leading-8 text-potomac-cream/80">
                            Upload Earth-based experimental CSV or XLSX files to
                            private Supabase Storage so later comparison modules
                            can evaluate them against approved lunar and public
                            reference datasets.
                        </p>
                    </div>
                    <aside className="glass-card h-fit rounded p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-potomac-gold">
                            Access state
                        </p>
                        <h2 className="mt-3 font-serif text-2xl leading-tight text-white">
                            {statusLabel(access.roleId)} role
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                            Uploads are written to a private bucket under your
                            user ID. Storage and metadata policies block
                            Explorer-only and signed-out accounts.
                        </p>
                        <Link
                            href="/member"
                            className="mt-5 inline-flex rounded border border-potomac-gold/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-potomac-gold transition hover:border-potomac-gold hover:bg-white/5"
                        >
                            Member workspace
                        </Link>
                    </aside>
                </div>

                <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <UploadForm />
                    <RecentUploads uploads={(data ?? []) as TestDataUpload[]} />
                </div>
            </div>
        </section>
    );
}
