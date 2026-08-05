const blockedHostSuffixes = [
    ".internal",
    ".invalid",
    ".lan",
    ".local",
    ".localhost",
    ".test",
];

function isBlockedIpv4(hostname: string) {
    const octets = hostname.split(".").map(Number);
    if (
        octets.length !== 4
        || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    ) {
        return false;
    }

    const [first, second, third] = octets;
    return first === 0
        || first === 10
        || first === 127
        || first >= 224
        || (first === 100 && second >= 64 && second <= 127)
        || (first === 169 && second === 254)
        || (first === 172 && second >= 16 && second <= 31)
        || (first === 192 && second === 0 && third === 0)
        || (first === 192 && second === 0 && third === 2)
        || (first === 192 && second === 88 && third === 99)
        || (first === 192 && second === 168)
        || (first === 198 && (second === 18 || second === 19))
        || (first === 198 && second === 51 && third === 100)
        || (first === 203 && second === 0 && third === 113);
}

function isBlockedIpv6(hostname: string) {
    const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!normalized.includes(":")) return false;

    if (
        normalized === "::"
        || normalized === "::1"
        || normalized.startsWith("fc")
        || normalized.startsWith("fd")
        || /^fe[89ab]/.test(normalized)
        || normalized.startsWith("2001:db8:")
    ) {
        return true;
    }

    const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return mappedIpv4 ? isBlockedIpv4(mappedIpv4) : false;
}

export function parseSafeWebhookDestination(value: string) {
    if (!value || value.length > 2048) {
        throw new Error("Webhook endpoint must be a valid public HTTPS URL.");
    }

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error("Webhook endpoint must be a valid public HTTPS URL.");
    }

    const hostname = url.hostname.replace(/\.$/, "").toLowerCase();
    const blockedHostname = hostname === "localhost"
        || !hostname.includes(".")
        || blockedHostSuffixes.some((suffix) => hostname.endsWith(suffix));

    if (
        url.protocol !== "https:"
        || Boolean(url.username || url.password)
        || (url.port !== "" && url.port !== "443")
        || blockedHostname
        || isBlockedIpv4(hostname)
        || isBlockedIpv6(hostname)
    ) {
        throw new Error("Webhook endpoint must be a public HTTPS URL on port 443.");
    }

    url.hostname = hostname;
    url.hash = "";
    return url.toString();
}
