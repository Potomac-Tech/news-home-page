import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "../../../../lib/supabase/service";
import {
    createStripeClient,
    getStripeWebhookSecret,
} from "../../../../lib/stripe/server";

export const dynamic = "force-dynamic";

type EntitlementStatus = "active" | "expired" | "revoked" | "pending";

function getStringId(value: string | { id?: string } | null) {
    return typeof value === "string" ? value : value?.id ?? null;
}

function getSubscriptionId(value: string | Stripe.Subscription | null) {
    if (typeof value === "string") {
        return value;
    }

    return value?.id ?? null;
}

async function insertAuditEvent(params: {
    supabase: ReturnType<typeof createServiceClient>;
    userId: string | null;
    eventType: string;
    eventSummary: string;
    metadata: Record<string, unknown>;
}) {
    await params.supabase.from("access_audit_events").insert({
        target_user_id: params.userId,
        event_type: params.eventType,
        event_summary: params.eventSummary,
        metadata: params.metadata,
    });
}

async function grantScoutEntitlement(params: {
    supabase: ReturnType<typeof createServiceClient>;
    userId: string;
    customerId: string | null;
    subscriptionId: string | null;
    externalReference: string;
    metadata: Record<string, unknown>;
}) {
    const now = new Date().toISOString();

    const { error: entitlementError } = await params.supabase
        .from("entitlements")
        .upsert(
            {
                user_id: params.userId,
                tier: "scout",
                status: "active",
                source: "stripe",
                starts_at: now,
                ends_at: null,
                stripe_customer_id: params.customerId,
                stripe_subscription_id: params.subscriptionId,
                external_reference: params.externalReference,
                metadata: params.metadata,
            },
            params.subscriptionId
                ? { onConflict: "stripe_subscription_id" }
                : undefined
        );

    if (entitlementError) {
        throw new Error(entitlementError.message);
    }

    const { error: roleError } = await params.supabase
        .from("member_role_assignments")
        .insert({
            user_id: params.userId,
            role_id: "scout",
            granted_at: now,
            metadata: {
                source: "stripe",
                subscription_id: params.subscriptionId,
                checkout_session_id: params.externalReference,
            },
        });

    if (roleError && roleError.code !== "23505") {
        throw new Error(roleError.message);
    }

    await insertAuditEvent({
        supabase: params.supabase,
        userId: params.userId,
        eventType: "stripe.scout_entitlement.active",
        eventSummary: "Activated Scout entitlement from Stripe payment.",
        metadata: params.metadata,
    });
}

async function updateScoutEntitlementStatus(params: {
    supabase: ReturnType<typeof createServiceClient>;
    subscriptionId: string;
    status: EntitlementStatus;
    eventType: string;
    eventSummary: string;
    metadata: Record<string, unknown>;
}) {
    const now = new Date().toISOString();
    const { data, error } = await params.supabase
        .from("entitlements")
        .update({
            status: params.status,
            ends_at: params.status === "active" ? null : now,
            metadata: params.metadata,
        })
        .eq("stripe_subscription_id", params.subscriptionId)
        .select("user_id")
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    await insertAuditEvent({
        supabase: params.supabase,
        userId: data?.user_id ?? null,
        eventType: params.eventType,
        eventSummary: params.eventSummary,
        metadata: params.metadata,
    });
}

async function handleCheckoutCompleted(
    supabase: ReturnType<typeof createServiceClient>,
    session: Stripe.Checkout.Session
) {
    if (session.mode !== "subscription" || session.metadata?.tier !== "scout") {
        return "ignored";
    }

    const userId = session.metadata.user_id;

    if (!userId) {
        throw new Error("Missing user_id metadata on Scout checkout session.");
    }

    await grantScoutEntitlement({
        supabase,
        userId,
        customerId: getStringId(session.customer),
        subscriptionId: getSubscriptionId(session.subscription),
        externalReference: session.id,
        metadata: {
            stripe_event: "checkout.session.completed",
            checkout_session_id: session.id,
            subscription_id: getSubscriptionId(session.subscription),
            payment_status: session.payment_status,
        },
    });

    return "processed";
}

async function handleSubscriptionUpdated(
    supabase: ReturnType<typeof createServiceClient>,
    subscription: Stripe.Subscription
) {
    const userId = subscription.metadata.user_id;
    const tier = subscription.metadata.tier;

    if (tier !== "scout") {
        return "ignored";
    }

    if (subscription.status === "active" || subscription.status === "trialing") {
        if (!userId) {
            throw new Error("Missing user_id metadata on Scout subscription.");
        }

        await grantScoutEntitlement({
            supabase,
            userId,
            customerId: getStringId(subscription.customer),
            subscriptionId: subscription.id,
            externalReference: subscription.id,
            metadata: {
                stripe_event: "customer.subscription.updated",
                subscription_id: subscription.id,
                subscription_status: subscription.status,
            },
        });

        return "processed";
    }

    const status: EntitlementStatus =
        subscription.status === "canceled" ? "revoked" : "pending";

    await updateScoutEntitlementStatus({
        supabase,
        subscriptionId: subscription.id,
        status,
        eventType: "stripe.scout_subscription.updated",
        eventSummary: `Updated Scout subscription status to ${subscription.status}.`,
        metadata: {
            stripe_event: "customer.subscription.updated",
            subscription_id: subscription.id,
            subscription_status: subscription.status,
        },
    });

    return "processed";
}

async function handleSubscriptionDeleted(
    supabase: ReturnType<typeof createServiceClient>,
    subscription: Stripe.Subscription
) {
    if (subscription.metadata.tier !== "scout") {
        return "ignored";
    }

    await updateScoutEntitlementStatus({
        supabase,
        subscriptionId: subscription.id,
        status: "revoked",
        eventType: "stripe.scout_subscription.deleted",
        eventSummary: "Revoked Scout entitlement after Stripe subscription deletion.",
        metadata: {
            stripe_event: "customer.subscription.deleted",
            subscription_id: subscription.id,
            subscription_status: subscription.status,
        },
    });

    return "processed";
}

async function handleInvoicePaymentFailed(
    supabase: ReturnType<typeof createServiceClient>,
    invoice: Stripe.Invoice
) {
    const subscriptionId = getSubscriptionId(
        invoice.parent?.subscription_details?.subscription ?? null
    );

    if (!subscriptionId) {
        return "ignored";
    }

    await updateScoutEntitlementStatus({
        supabase,
        subscriptionId,
        status: "pending",
        eventType: "stripe.scout_payment.failed",
        eventSummary: "Marked Scout entitlement pending after Stripe payment failure.",
        metadata: {
            stripe_event: "invoice.payment_failed",
            invoice_id: invoice.id,
            subscription_id: subscriptionId,
        },
    });

    return "processed";
}

async function processEvent(
    supabase: ReturnType<typeof createServiceClient>,
    event: Stripe.Event
) {
    switch (event.type) {
        case "checkout.session.completed":
            return handleCheckoutCompleted(
                supabase,
                event.data.object as Stripe.Checkout.Session
            );
        case "customer.subscription.updated":
            return handleSubscriptionUpdated(
                supabase,
                event.data.object as Stripe.Subscription
            );
        case "customer.subscription.deleted":
            return handleSubscriptionDeleted(
                supabase,
                event.data.object as Stripe.Subscription
            );
        case "invoice.payment_failed":
            return handleInvoicePaymentFailed(
                supabase,
                event.data.object as Stripe.Invoice
            );
        default:
            return "ignored";
    }
}

export async function POST(request: Request) {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json(
            { error: "Missing Stripe signature." },
            { status: 400 }
        );
    }

    const payload = await request.text();
    const stripe = createStripeClient();
    const webhookSecret = getStripeWebhookSecret();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Invalid webhook payload.";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error: idempotencyError } = await supabase
        .from("stripe_webhook_events")
        .insert({
            event_id: event.id,
            event_type: event.type,
            status: "processing",
            payload: event as unknown as Record<string, unknown>,
        });

    if (idempotencyError?.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
    }

    if (idempotencyError) {
        return NextResponse.json(
            { error: idempotencyError.message },
            { status: 500 }
        );
    }

    try {
        const status = await processEvent(supabase, event);
        await supabase
            .from("stripe_webhook_events")
            .update({
                status,
                processed_at: new Date().toISOString(),
            })
            .eq("event_id", event.id);

        return NextResponse.json({ received: true, status });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Webhook processing failed.";
        await supabase
            .from("stripe_webhook_events")
            .update({
                status: "failed",
                processed_at: new Date().toISOString(),
                error_message: message,
            })
            .eq("event_id", event.id);

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
