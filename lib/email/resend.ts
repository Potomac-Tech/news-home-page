import "server-only";

export type OperationalEmailFormType =
    | "meridian_interest"
    | "pathfinder_inquiry"
    | "source_inquiry"
    | "udri_fallback"
    | "member_alert"
    | "operational_inquiry";

type OperationalEmailInput = {
    formType: OperationalEmailFormType;
    subject: string;
    text: string;
    replyTo?: string;
    to?: string;
};

export type OperationalEmailResult = {
    deliveryStatus: "sent" | "failed" | "configuration_missing";
    providerMessageId: string | null;
    sender: string;
    recipient: string;
    failureReason: string | null;
};

const defaultAddress = "info@potomacdb.com";
const destinationEnvironment: Record<OperationalEmailFormType, string> = {
    meridian_interest: "RESEND_MERIDIAN_TO_EMAIL",
    pathfinder_inquiry: "RESEND_PATHFINDER_TO_EMAIL",
    source_inquiry: "RESEND_SOURCE_TO_EMAIL",
    udri_fallback: "RESEND_UDRI_TO_EMAIL",
    member_alert: "RESEND_ALERTS_TO_EMAIL",
    operational_inquiry: "RESEND_OPERATIONAL_TO_EMAIL",
};

function configuredAddress(value: string | undefined) {
    return value?.trim() || defaultAddress;
}

export function getOperationalEmailRecipient(formType: OperationalEmailFormType) {
    return configuredAddress(
        process.env[destinationEnvironment[formType]] ?? process.env.RESEND_TO_EMAIL
    );
}

export function getOperationalEmailSender() {
    return configuredAddress(process.env.RESEND_FROM_EMAIL);
}

export function hasResendEmailConfig() {
    return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendOperationalEmail({
    formType,
    subject,
    text,
    replyTo,
    to,
}: OperationalEmailInput): Promise<OperationalEmailResult> {
    const sender = getOperationalEmailSender();
    const recipient = to?.trim() || getOperationalEmailRecipient(formType);
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        return {
            deliveryStatus: "configuration_missing",
            providerMessageId: null,
            sender,
            recipient,
            failureReason: "RESEND_API_KEY is not configured.",
        };
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: sender,
                to: [recipient],
                reply_to: replyTo?.trim() || sender,
                subject,
                text,
            }),
            signal: AbortSignal.timeout(10_000),
        });
        const payload = (await response.json().catch(() => null)) as
            | { id?: string; message?: string; name?: string }
            | null;

        if (!response.ok || !payload?.id) {
            return {
                deliveryStatus: "failed",
                providerMessageId: null,
                sender,
                recipient,
                failureReason:
                    payload?.message ?? payload?.name ?? `Resend returned ${response.status}.`,
            };
        }

        return {
            deliveryStatus: "sent",
            providerMessageId: payload.id,
            sender,
            recipient,
            failureReason: null,
        };
    } catch (error) {
        return {
            deliveryStatus: "failed",
            providerMessageId: null,
            sender,
            recipient,
            failureReason:
                error instanceof Error ? error.message : "Resend request failed.",
        };
    }
}
