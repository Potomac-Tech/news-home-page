import "server-only";

import type { OperationalEmailFormType } from "./resend";

export type ResendQuotaClaim = {
    allowed: boolean;
    hold_reason: string | null;
    retry_at: string | null;
};

function setting(name: string, fallback: string) {
    return process.env[name]?.trim() || fallback;
}

export function isOperationalEmail(formType: OperationalEmailFormType) {
    return formType !== "member_alert";
}

export function hasValidResendFreePlanConfig() {
    return (
        setting("RESEND_PLAN", "free") === "free" &&
        setting("RESEND_INBOUND_RECEIVING", "disabled") === "disabled" &&
        setting("RESEND_SENDING_DOMAIN_COUNT", "1") === "1"
    );
}

export function resendFreePlanConfigurationError() {
    if (setting("RESEND_PLAN", "free") !== "free") {
        return "RESEND_PLAN must remain free until an approved plan change.";
    }
    if (setting("RESEND_INBOUND_RECEIVING", "disabled") !== "disabled") {
        return "Inbound Resend receiving must remain disabled for the Free-plan budget.";
    }
    if (setting("RESEND_SENDING_DOMAIN_COUNT", "1") !== "1") {
        return "Exactly one Resend sending domain is allowed for the Free-plan budget.";
    }
    return null;
}
