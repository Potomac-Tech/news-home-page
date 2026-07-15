export type EmailReleaseConfiguration = {
    apiKeyPresent: boolean;
    fromEmail: string;
    toEmail: string;
    plan: string;
    inboundReceiving: string;
    sendingDomainCount: string;
    domainStatus?: string;
    senderStatus?: string;
};

export type EmailReleaseBlocker =
    | "api_key_missing"
    | "sender_invalid"
    | "recipient_invalid"
    | "plan_not_free"
    | "inbound_enabled"
    | "domain_count_invalid"
    | "domain_unverified"
    | "sender_unverified";

const approvedAddress = "info@potomacdb.com";

function isVerified(value: string | undefined) {
    return value === undefined || value.trim().toLowerCase() === "verified";
}

export function emailReleaseBlockers(config: EmailReleaseConfiguration): EmailReleaseBlocker[] {
    const blockers: EmailReleaseBlocker[] = [];

    if (!config.apiKeyPresent) blockers.push("api_key_missing");
    if (config.fromEmail.trim().toLowerCase() !== approvedAddress) blockers.push("sender_invalid");
    if (config.toEmail.trim().toLowerCase() !== approvedAddress) blockers.push("recipient_invalid");
    if (config.plan.trim().toLowerCase() !== "free") blockers.push("plan_not_free");
    if (config.inboundReceiving.trim().toLowerCase() !== "disabled") blockers.push("inbound_enabled");
    if (config.sendingDomainCount.trim() !== "1") blockers.push("domain_count_invalid");
    if (!isVerified(config.domainStatus)) blockers.push("domain_unverified");
    if (!isVerified(config.senderStatus)) blockers.push("sender_unverified");

    return blockers;
}
