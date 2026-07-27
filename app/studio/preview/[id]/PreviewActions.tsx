"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    approveArticlePreview,
    publishArticle,
    scheduleArticle,
} from "../../../admin/editorial/actions";

export function PreviewActions({
    articleId,
    approved,
    initialSchedule,
}: {
    articleId: string;
    approved: boolean;
    initialSchedule: string;
}) {
    const router = useRouter();
    const [status, setStatus] = useState("");
    const [working, setWorking] = useState(false);
    const [schedule, setSchedule] = useState(initialSchedule);

    async function run(action: (data: FormData) => Promise<string>, data: FormData, message: string) {
        setWorking(true);
        setStatus("");
        try {
            await action(data);
            setStatus(message);
            router.refresh();
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Action could not be completed.");
        } finally {
            setWorking(false);
        }
    }

    const baseData = () => {
        const data = new FormData();
        data.set("article_id", articleId);
        data.set("studio_context", "studio");
        return data;
    };

    return (
        <aside className="border border-potomac-regolith/30 bg-potomac-primary/60 p-5">
            <p className="font-mono text-xs font-bold uppercase text-potomac-gold">
                Publication gate
            </p>
            <p className="mt-3 text-sm leading-6 text-potomac-cream/70">
                Review each device size, then approve this exact saved revision. Editing the story after approval requires another preview.
            </p>
            <button
                type="button"
                disabled={working}
                onClick={() => void run(approveArticlePreview, baseData(), "Current revision approved.")}
                className="mt-5 w-full bg-potomac-gold px-4 py-3 font-mono text-xs font-bold uppercase text-potomac-primary disabled:opacity-50"
            >
                {approved ? "Reapprove current preview" : "Approve current preview"}
            </button>
            <button
                type="button"
                disabled={working || !approved}
                onClick={() => void run(publishArticle, baseData(), "Article published.")}
                className="mt-3 w-full border border-potomac-gold px-4 py-3 font-mono text-xs font-bold uppercase text-potomac-gold disabled:cursor-not-allowed disabled:opacity-35"
            >
                Publish now
            </button>
            <div className="mt-5 border-t border-potomac-regolith/25 pt-5">
                <label className="font-mono text-xs font-bold uppercase text-potomac-gold">
                    Schedule publishing
                    <input
                        type="datetime-local"
                        value={schedule}
                        onChange={(event) => setSchedule(event.target.value)}
                        className="mt-2 w-full border border-potomac-regolith/30 bg-potomac-primary px-3 py-3 text-potomac-cream"
                    />
                </label>
                <button
                    type="button"
                    disabled={working || !approved || !schedule}
                    onClick={() => {
                        const data = baseData();
                        data.set("scheduled_for", new Date(schedule).toISOString());
                        void run(scheduleArticle, data, "Article scheduled.");
                    }}
                    className="mt-3 w-full border border-potomac-regolith/40 px-4 py-3 font-mono text-xs font-bold uppercase text-potomac-cream disabled:cursor-not-allowed disabled:opacity-35"
                >
                    Confirm schedule
                </button>
            </div>
            {status ? <p role="status" className="mt-4 text-sm text-potomac-gold">{status}</p> : null}
        </aside>
    );
}
