"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCarouselPosition } from "./actions";

type CarouselPosition = 1 | 2 | 3 | 4 | 5 | null;

export function CarouselPositionControl({
    articleId,
    articleTitle,
    articleStatus,
    initialPosition,
}: {
    articleId: string;
    articleTitle: string;
    articleStatus: string;
    initialPosition: CarouselPosition;
}) {
    const router = useRouter();
    const [selectedPosition, setSelectedPosition] = useState(
        initialPosition === null ? "" : String(initialPosition)
    );
    const [savedPosition, setSavedPosition] = useState(
        initialPosition === null ? "" : String(initialPosition)
    );
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const nextPosition = initialPosition === null ? "" : String(initialPosition);
        setSelectedPosition(nextPosition);
        setSavedPosition(nextPosition);
    }, [initialPosition]);

    function savePosition() {
        const requestedPosition = selectedPosition
            ? Number(selectedPosition) as Exclude<CarouselPosition, null>
            : null;
        setMessage("Saving...");

        startTransition(async () => {
            try {
                const result = await updateCarouselPosition(
                    articleId,
                    requestedPosition
                );
                const persistedPosition = result.position === null
                    ? ""
                    : String(result.position);
                setSelectedPosition(persistedPosition);
                setSavedPosition(persistedPosition);
                setMessage("Saved");
                router.refresh();
            } catch (error) {
                setSelectedPosition(savedPosition);
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Carousel position could not be saved."
                );
            }
        });
    }

    return (
        <div className="min-w-52">
            <div className="flex items-center gap-2">
                <select
                    value={selectedPosition}
                    onChange={(event) => {
                        setSelectedPosition(event.target.value);
                        setMessage("");
                    }}
                    disabled={isPending}
                    aria-label={`Carousel position for ${articleTitle}`}
                    className="border border-cabeus-line bg-white px-2 py-2 text-sm text-cabeus-ink outline-none focus:border-cabeus-gold disabled:opacity-55"
                >
                    <option value="">N/A</option>
                    {[1, 2, 3, 4, 5].map((position) => (
                        <option key={position} value={position}>{position}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={savePosition}
                    disabled={isPending || selectedPosition === savedPosition}
                    className="border border-cabeus-ink px-3 py-2 font-mono text-[0.6rem] font-bold uppercase text-cabeus-ink transition hover:bg-cabeus-ink hover:text-cabeus-paper disabled:cursor-not-allowed disabled:opacity-45"
                >
                    {isPending ? "Saving" : "Save"}
                </button>
                <span
                    role="status"
                    className={`max-w-36 text-xs ${message === "Saved" ? "text-cabeus-bronze" : "text-cabeus-muted"}`}
                >
                    {message}
                </span>
            </div>
            {articleStatus !== "published" && selectedPosition ? (
                <p className="mt-2 max-w-52 text-xs leading-4 text-cabeus-bronze">
                    Appears after this article is published.
                </p>
            ) : null}
            {articleStatus === "published" ? (
                <p className="mt-2 max-w-52 text-xs leading-4 text-cabeus-muted">
                    {selectedPosition
                        ? "Featured on the homepage and retained in Archives."
                        : "Published in Archives; not featured on the homepage."}
                </p>
            ) : null}
        </div>
    );
}
