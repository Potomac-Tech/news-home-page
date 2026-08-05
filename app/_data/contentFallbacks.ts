export function allowLocalContentFallbacks() {
    return (
        process.env.NODE_ENV !== "production" ||
        process.env.POTOMAC_E2E_CONTENT_FALLBACKS === "1"
    );
}
