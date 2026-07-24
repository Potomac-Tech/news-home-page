export function allowLocalContentFallbacks() {
    return process.env.NODE_ENV !== "production";
}
