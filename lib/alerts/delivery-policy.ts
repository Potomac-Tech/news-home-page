export type AlertSeverity = "info" | "watch" | "urgent";

function localMinutes(date: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
    return hour * 60 + minute;
}

function timeMinutes(value: string) {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
}

export function quietHoursEnd(
    now: Date,
    start: string | null,
    end: string | null,
    timezone: string
) {
    if (!start || !end || start === end) return null;
    const startMinutes = timeMinutes(start);
    const endMinutes = timeMinutes(end);
    const isQuiet = (date: Date) => {
        const current = localMinutes(date, timezone);
        return startMinutes < endMinutes
            ? current >= startMinutes && current < endMinutes
            : current >= startMinutes || current < endMinutes;
    };
    if (!isQuiet(now)) return null;
    for (let offset = 15; offset <= 24 * 60 + 15; offset += 15) {
        const candidate = new Date(now.getTime() + offset * 60 * 1000);
        if (!isQuiet(candidate)) return candidate;
    }
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export function nextDigestAt(now: Date, cadenceHours: number, sendHourUtc: number) {
    const candidate = new Date(now);
    candidate.setUTCMinutes(0, 0, 0);
    candidate.setUTCHours(sendHourUtc);
    while (candidate.getTime() <= now.getTime()) {
        candidate.setUTCHours(candidate.getUTCHours() + cadenceHours);
    }
    return candidate;
}

function severityRank(severity: AlertSeverity) {
    return { info: 0, watch: 1, urgent: 2 }[severity];
}

export function resolveAlertDeliveryMode(input: {
    severity: AlertSeverity;
    threshold: AlertSeverity;
    instantUsed: number;
    instantReserve: number;
    budgetRemaining: number;
    lowBudgetBuffer: number;
}) {
    return severityRank(input.severity) >= severityRank(input.threshold)
        && input.instantUsed < input.instantReserve
        && input.budgetRemaining > input.lowBudgetBuffer
        ? "immediate" as const
        : "digest" as const;
}

export function digestDeferralReason(input: {
    dailyAlertEmailsSent: number;
    dailyQuotaSent: number;
    dailyQuotaReserved: number;
    maxDailyAlertEmails: number;
    lowBudgetBuffer: number;
    userMessagesSent: number;
    perUserDailyCap: number;
}) {
    const alertBudgetRemaining = input.maxDailyAlertEmails - input.dailyAlertEmailsSent;
    if (
        input.dailyAlertEmailsSent >= input.maxDailyAlertEmails
        || alertBudgetRemaining <= input.lowBudgetBuffer
        || input.dailyQuotaSent + input.dailyQuotaReserved >= input.maxDailyAlertEmails
    ) return "budget" as const;
    if (input.userMessagesSent >= input.perUserDailyCap) return "member_cap" as const;
    return null;
}
