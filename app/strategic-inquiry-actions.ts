"use server";

import { redirect } from "next/navigation";
import {
    getOperationalEmailRecipient,
    getOperationalEmailSender,
    sendOperationalEmail,
    type OperationalEmailFormType,
} from "../lib/email/resend";
import {
    hasValidResendFreePlanConfig,
    resendFreePlanConfigurationError,
    type ResendQuotaClaim,
} from "../lib/email/resend-quota";
import { createServiceClient } from "../lib/supabase/service";

type Product = "pathfinder" | "source";
type Submission = {
    inquiry_id: string;
    delivery_event_id: string;
    delivery_token: string;
};

function value(formData: FormData, name: string) {
    return String(formData.get(name) ?? "").trim();
}

function productPath(product: Product, status: string) {
    return `/${product}/inquire?status=${encodeURIComponent(status)}`;
}

export async function submitStrategicInquiry(formData: FormData) {
    const product = value(formData, "product") as Product;
    if (!(["pathfinder", "source"] as const).includes(product)) {
        redirect("/request-access");
    }

    const contactName = value(formData, "contact_name");
    const contactEmail = value(formData, "contact_email").toLowerCase();
    const organizationName = value(formData, "organization_name");
    const roleTitle = value(formData, "role_title");
    const productInterest = value(formData, "product_interest");
    const message = value(formData, "message");
    const sourceCta = value(formData, "source_cta");
    const communicationPreference = value(formData, "communication_preference");
    const honeypot = value(formData, "company_website");
    let attribution: Record<string, string> = {};
    try {
        attribution = JSON.parse(value(formData, "attribution") || "{}") as Record<string, string>;
    } catch {
        attribution = {};
    }

    if (
        !contactName ||
        !contactEmail ||
        !organizationName ||
        !productInterest ||
        message.length < 20 ||
        communicationPreference !== "product_follow_up_approved"
    ) {
        redirect(productPath(product, "missing-required"));
    }

    const formType = `${product}_inquiry` as OperationalEmailFormType;
    const sender = getOperationalEmailSender();
    const recipient = getOperationalEmailRecipient(formType);
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("submit_strategic_product_inquiry", {
        p_product: product,
        p_contact_name: contactName,
        p_contact_email: contactEmail,
        p_organization_name: organizationName,
        p_role_title: roleTitle,
        p_product_interest: productInterest,
        p_message: message,
        p_source_cta: sourceCta,
        p_attribution: attribution,
        p_communication_preference: communicationPreference,
        p_honeypot: honeypot,
        p_sender: sender,
        p_recipient: recipient,
    });
    const submission = data as Submission | null;
    if (error || !submission?.inquiry_id || !submission.delivery_event_id || !submission.delivery_token) {
        redirect(
            productPath(
                product,
                /rate limit/i.test(error?.message ?? "") ? "rate-limited" : "submit-error"
            )
        );
    }

    const complete = async (
        status: "sent" | "failed" | "held" | "configuration_missing",
        providerMessageId: string | null,
        failureReason: string | null,
        providerHeaders: Record<string, string> = {},
        nextRetryAt: string | null = null
    ) =>
        supabase.rpc("complete_strategic_inquiry_delivery", {
            p_inquiry_id: submission.inquiry_id,
            p_event_id: submission.delivery_event_id,
            p_delivery_token: submission.delivery_token,
            p_delivery_status: status,
            p_provider_message_id: providerMessageId,
            p_failure_reason: failureReason,
            p_provider_headers: providerHeaders,
            p_next_retry_at: nextRetryAt,
        });

    if (!hasValidResendFreePlanConfig()) {
        await complete("configuration_missing", null, resendFreePlanConfigurationError());
        redirect(productPath(product, "delivery-pending"));
    }

    const { data: quotaData, error: quotaError } = await supabase.rpc(
        "claim_strategic_inquiry_delivery",
        {
            p_inquiry_id: submission.inquiry_id,
            p_event_id: submission.delivery_event_id,
            p_delivery_token: submission.delivery_token,
        }
    );
    const quotaClaim = (quotaData as ResendQuotaClaim[] | null)?.[0];
    if (quotaError || !quotaClaim?.allowed) {
        await complete(
            "held",
            null,
            quotaClaim?.hold_reason ?? "Resend quota check is unavailable.",
            {},
            quotaClaim?.retry_at ?? null
        );
        redirect(productPath(product, "delivery-pending"));
    }

    const delivery = await sendOperationalEmail({
        formType,
        subject: `${product === "pathfinder" ? "Pathfinder" : "Source"} inquiry: ${organizationName}`,
        replyTo: contactEmail,
        text: [
            `Product: ${product}`,
            `Contact: ${contactName}`,
            `Email: ${contactEmail}`,
            `Organization: ${organizationName}`,
            `Role/title: ${roleTitle || "Not provided"}`,
            `Product interest: ${productInterest}`,
            `Message: ${message}`,
            `Source CTA: ${sourceCta || "Direct inquiry page"}`,
            `Attribution: ${JSON.stringify(attribution)}`,
        ].join("\n"),
    });
    await complete(
        delivery.deliveryStatus,
        delivery.providerMessageId,
        delivery.failureReason,
        delivery.providerHeaders,
        delivery.retryAt
    );

    redirect(
        productPath(
            product,
            delivery.deliveryStatus === "sent" ? "submitted" : "delivery-pending"
        )
    );
}
