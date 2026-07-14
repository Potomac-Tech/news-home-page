export type ResendQuotaHoldReason =
    | "daily_quota_exceeded"
    | "monthly_quota_exceeded"
    | "rate_limit_exceeded";

const quotaReasons = new Set<ResendQuotaHoldReason>([
    "daily_quota_exceeded",
    "monthly_quota_exceeded",
    "rate_limit_exceeded",
]);

export function classifyResendQuotaHold(
    status: number,
    providerCode: string | null | undefined,
): ResendQuotaHoldReason | null {
    const normalized = providerCode?.trim().toLowerCase() as ResendQuotaHoldReason | undefined;
    if (normalized && quotaReasons.has(normalized)) return normalized;
    return status === 429 ? "rate_limit_exceeded" : null;
}
