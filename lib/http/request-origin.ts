const trustedHostnames = new Set([
    "www.cabeusexplorer.com",
    "cabeusexplorer.com",
    "cabeus-explorer.jake-249.workers.dev",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
]);

function configuredSiteHostname() {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!configuredUrl) return null;

    try {
        return new URL(configuredUrl).hostname.toLowerCase();
    } catch {
        return null;
    }
}

export function isTrustedRequestHostname(hostname: string) {
    const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
    return trustedHostnames.has(normalized) || normalized === configuredSiteHostname();
}

export function isTrustedRequestHostHeader(value: string | null) {
    if (!value) return true;
    const firstValue = value.split(",", 1)[0]?.trim();
    if (!firstValue) return false;

    try {
        return isTrustedRequestHostname(new URL(`http://${firstValue}`).hostname);
    } catch {
        return false;
    }
}

export function trustedRequestOrigin(requestUrl: string | URL) {
    const url = requestUrl instanceof URL ? requestUrl : new URL(requestUrl);
    if (!isTrustedRequestHostname(url.hostname)) {
        throw new Error("Untrusted request hostname.");
    }
    return url.origin;
}
