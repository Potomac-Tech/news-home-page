"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createServiceClient } from "../../lib/supabase/service";
import {
    getOperationalEmailRecipient,
    getOperationalEmailSender,
    sendOperationalEmail,
} from "../../lib/email/resend";
import {
    hasValidResendFreePlanConfig,
    resendFreePlanConfigurationError,
    type ResendQuotaClaim,
} from "../../lib/email/resend-quota";

const personalEmailDomains = new Set([
    "aol.com",
    "gmail.com",
    "hotmail.com",
    "icloud.com",
    "live.com",
    "me.com",
    "msn.com",
    "outlook.com",
    "proton.me",
    "protonmail.com",
    "yahoo.com",
]);

function getEmailDomain(email: string) {
    const [, domain] = email.toLowerCase().split("@");
    return domain ?? "";
}

export async function submitMeridianInterest(formData: FormData) {
    const contactName = String(formData.get("contact_name") ?? "").trim();
    const contactEmail = String(formData.get("contact_email") ?? "").trim();
    const organizationName = String(formData.get("organization_name") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const useCase = String(formData.get("use_case") ?? "").trim();
    const estimatedSeats = Number(formData.get("estimated_seats") ?? 0);
    const emailDomain = getEmailDomain(contactEmail);

    if (!contactName || !contactEmail || !organizationName || !emailDomain) {
        redirect("/command?status=missing-required");
    }

    if (personalEmailDomains.has(emailDomain)) {
        redirect("/command?status=business-email-required");
    }

    if (!hasPotomacSupabasePublicConfig()) {
        redirect("/command?status=configuration-needed");
    }

    const supabase = await createClient();
    const { data: interest, error } = await supabase
        .from("command_interest_requests")
        .insert({
        contact_name: contactName,
        contact_email: contactEmail,
        organization_name: organizationName,
        title: title || null,
        estimated_seats: estimatedSeats > 0 ? estimatedSeats : null,
        use_case: useCase || null,
        status: "new",
        })
        .select("id")
        .single();

    if (error) {
        redirect("/command?status=submit-error");
    }

    let service;
    try {
        service = createServiceClient();
    } catch {
        redirect("/command?status=configuration-needed");
    }

    const sender = getOperationalEmailSender();
    const recipient = getOperationalEmailRecipient("meridian_interest");
    const { data: deliveryEvent, error: deliveryEventError } = await service
        .schema("private")
        .from("outbound_email_delivery_events")
        .insert({
            command_interest_request_id: interest.id,
            form_type: "meridian_interest",
            provider: "resend",
            sender,
            recipient,
            recipient_count: 1,
            reply_to: contactEmail,
            delivery_status: "queued",
            retry_status: "not_requested",
            quota_bucket: "operational",
            priority: "operational",
            idempotency_key: `meridian-interest:${interest.id}`,
        })
        .select("id")
        .single();

    if (deliveryEventError || !deliveryEvent) {
        redirect("/command?status=configuration-needed");
    }

    if (!hasValidResendFreePlanConfig()) {
        await service
            .schema("private")
            .from("outbound_email_delivery_events")
            .update({
                delivery_status: "configuration_missing",
                failure_reason: resendFreePlanConfigurationError(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", deliveryEvent.id);
        redirect("/command?status=configuration-needed");
    }

    const { data: rateData, error: rateError } = await service
        .schema("private")
        .rpc("claim_resend_send_rate");
    const rateClaim = (rateData as Array<{ allowed: boolean; retry_at: string | null }> | null)?.[0];

    if (rateError || !rateClaim?.allowed) {
        await service
            .schema("private")
            .from("outbound_email_delivery_events")
            .update({
                delivery_status: "held",
                retry_status: "retry_pending",
                failure_reason: "Resend send-rate capacity is temporarily unavailable.",
                next_retry_at: rateClaim?.retry_at ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", deliveryEvent.id);
        redirect("/command?status=delivery-pending");
    }

    const { data: quotaData, error: quotaError } = await service
        .schema("private")
        .rpc("claim_resend_free_quota", {
            p_event_id: deliveryEvent.id,
            p_recipient_count: 1,
            p_is_operational: true,
        });
    const quotaClaim = (quotaData as ResendQuotaClaim[] | null)?.[0];

    if (quotaError || !quotaClaim?.allowed) {
        await service
            .schema("private")
            .from("outbound_email_delivery_events")
            .update({
                delivery_status: "held",
                retry_status: "retry_pending",
                failure_reason:
                    quotaClaim?.hold_reason ?? "Resend quota check is unavailable.",
                next_retry_at: quotaClaim?.retry_at ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", deliveryEvent.id);
        redirect("/command?status=delivery-pending");
    }

    const delivery = await sendOperationalEmail({
        formType: "meridian_interest",
        subject: `Meridian contract discussion: ${organizationName}`,
        replyTo: contactEmail,
        text: [
            `Contact: ${contactName}`,
            `Email: ${contactEmail}`,
            `Organization: ${organizationName}`,
            `Title: ${title || "Not provided"}`,
            `Estimated seats: ${estimatedSeats > 0 ? estimatedSeats : "Not provided"}`,
            `Mission need: ${useCase || "Not provided"}`,
            `Lead ID: ${interest.id}`,
        ].join("\n"),
    });

    await service
        .schema("private")
        .from("outbound_email_delivery_events")
        .update({
            provider_message_id: delivery.providerMessageId,
            sender: delivery.sender,
            recipient: delivery.recipient,
            reply_to: contactEmail,
            delivery_status: delivery.deliveryStatus,
            retry_status:
                delivery.deliveryStatus === "held" ? "retry_pending" : "not_requested",
            failure_reason: delivery.failureReason,
            provider_headers: delivery.providerHeaders,
            next_retry_at: delivery.retryAt,
            updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryEvent.id);

    await service.schema("private").rpc("complete_resend_free_quota", {
        p_recipient_count: 1,
        p_sent: delivery.deliveryStatus === "sent",
    });

    if (delivery.deliveryStatus === "sent") {
        redirect("/command?status=submitted");
    }

    redirect(
        `/command?status=${
            delivery.deliveryStatus === "configuration_missing"
                ? "configuration-needed"
                : "delivery-pending"
        }`
    );
}
