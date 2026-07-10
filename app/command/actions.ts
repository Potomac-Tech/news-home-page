"use server";

import { redirect } from "next/navigation";
import { getOperationalEmailRecipient, getOperationalEmailSender, sendOperationalEmail } from "../../lib/email/resend";
import { hasValidResendFreePlanConfig, resendFreePlanConfigurationError } from "../../lib/email/resend-quota";
import { getProfileGateContext, safeReturnPath } from "../../lib/auth/profile-completion";
import { createClient } from "../../lib/supabase/server";

type MeridianQuotaClaim = {
    allowed: boolean;
    hold_reason: string | null;
    retry_at: string | null;
};

function text(formData: FormData, name: string) {
    return String(formData.get(name) ?? "").trim();
}

export async function submitMeridianInterest(formData: FormData) {
    const returnUrl = safeReturnPath(text(formData, "return_url"), "/command");
    const supabase = await createClient();
    const gate = await getProfileGateContext({ supabase, nextPath: returnUrl });

    if (gate.state === "signed_out" || gate.state === "email_unverified") {
        redirect(gate.loginHref);
    }
    if (gate.state === "profile_incomplete" && gate.profileHref) {
        redirect(gate.profileHref);
    }

    const contactName = text(formData, "contact_name");
    const contactEmail = text(formData, "contact_email");
    const organizationName = text(formData, "organization_name");
    const title = text(formData, "title");
    const useCase = text(formData, "use_case");
    const estimatedSeats = Number(formData.get("estimated_seats") ?? 0);
    const sourceCta = text(formData, "source_cta");
    const sourceContent = text(formData, "source_content");
    const communicationPreference = text(formData, "communication_preference");
    let attribution: Record<string, string> = {};
    try {
        attribution = JSON.parse(text(formData, "attribution") || "{}") as Record<string, string>;
    } catch {
        attribution = {};
    }

    if (!contactName || !contactEmail || !organizationName) {
        redirect("/command?status=missing-required");
    }

    const { data: interestId, error: interestError } = await supabase.rpc(
        "submit_meridian_interest",
        {
            p_contact_name: contactName,
            p_business_email: contactEmail,
            p_organization_name: organizationName,
            p_title: title,
            p_estimated_seats: estimatedSeats,
            p_use_case: useCase,
            p_source_cta: sourceCta,
            p_source_content: sourceContent,
            p_return_url: returnUrl,
            p_attribution: attribution,
            p_communication_preference: communicationPreference,
        }
    );

    if (interestError || !interestId) {
        const message = interestError?.message ?? "";
        redirect(
            `/command?status=${
                /business or organization email/i.test(message)
                    ? "business-email-required"
                    : "submit-error"
            }`
        );
    }

    const sender = getOperationalEmailSender();
    const recipient = getOperationalEmailRecipient("meridian_interest");
    const { data: deliveryEventId, error: eventError } = await supabase.rpc(
        "create_meridian_delivery_event",
        {
            p_interest_id: interestId,
            p_sender: sender,
            p_recipient: recipient,
            p_reply_to: contactEmail,
        }
    );

    if (eventError || !deliveryEventId) {
        redirect("/command?status=configuration-needed");
    }

    if (!hasValidResendFreePlanConfig()) {
        await supabase.rpc("complete_meridian_delivery", {
            p_event_id: deliveryEventId,
            p_delivery_status: "configuration_missing",
            p_provider_message_id: null,
            p_failure_reason: resendFreePlanConfigurationError(),
            p_provider_headers: {},
            p_next_retry_at: null,
        });
        redirect("/command?status=configuration-needed");
    }

    const { data: quotaData, error: quotaError } = await supabase.rpc(
        "claim_meridian_delivery_quota",
        { p_event_id: deliveryEventId }
    );
    const quotaClaim = (quotaData as MeridianQuotaClaim[] | null)?.[0];
    if (quotaError || !quotaClaim?.allowed) {
        await supabase.rpc("complete_meridian_delivery", {
            p_event_id: deliveryEventId,
            p_delivery_status: "held",
            p_provider_message_id: null,
            p_failure_reason: quotaClaim?.hold_reason ?? "Resend quota check is unavailable.",
            p_provider_headers: {},
            p_next_retry_at: quotaClaim?.retry_at ?? null,
        });
        redirect("/command?status=delivery-pending");
    }

    const delivery = await sendOperationalEmail({
        formType: "meridian_interest",
        subject: `Meridian contract discussion: ${organizationName}`,
        replyTo: contactEmail,
        text: [
            `Contact: ${contactName}`,
            `Verified account: ${gate.userId}`,
            `Business email: ${contactEmail}`,
            `Organization: ${organizationName}`,
            `Title: ${title || "Not provided"}`,
            `Estimated seats: ${estimatedSeats > 0 ? estimatedSeats : "Not provided"}`,
            `Mission need: ${useCase || "Not provided"}`,
            `Source CTA: ${sourceCta || "Not provided"}`,
            `Source content: ${sourceContent || "Not provided"}`,
            `Return URL: ${returnUrl}`,
        ].join("\n"),
    });

    await supabase.rpc("complete_meridian_delivery", {
        p_event_id: deliveryEventId,
        p_delivery_status: delivery.deliveryStatus,
        p_provider_message_id: delivery.providerMessageId,
        p_failure_reason: delivery.failureReason,
        p_provider_headers: delivery.providerHeaders,
        p_next_retry_at: delivery.retryAt,
    });

    redirect(`/command?status=${delivery.deliveryStatus === "sent" ? "submitted" : "delivery-pending"}`);
}
