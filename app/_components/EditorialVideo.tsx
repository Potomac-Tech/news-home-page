export function EditorialVideo({
    publicUrl,
    hostingProvider,
    title,
    className = "aspect-video w-full",
}: {
    publicUrl: string;
    hostingProvider: "supabase" | "youtube";
    title: string;
    className?: string;
}) {
    if (hostingProvider === "youtube") {
        return (
            <iframe
                src={publicUrl}
                title={title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className={className}
            />
        );
    }

    return (
        <video
            src={publicUrl}
            controls
            preload="metadata"
            playsInline
            aria-label={title}
            className={className}
        />
    );
}
