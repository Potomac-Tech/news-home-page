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
        })
        .select("id")
        .single();

    if (deliveryEventError || !deliveryEvent) {
        redirect("/command?status=configuration-needed");
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
            failure_reason: delivery.failureReason,
            updated_at: new Date().toISOString(),
        })
        .eq("id", deliveryEvent.id);

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
