import "server-only";

import Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-05-27.dahlia";

export function createStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
        throw new Error("Missing STRIPE_SECRET_KEY.");
    }

    return new Stripe(secretKey, {
        apiVersion: STRIPE_API_VERSION,
    });
}

export function getScoutPriceId() {
    const priceId = process.env.STRIPE_SCOUT_PRICE_ID;

    if (!priceId) {
        throw new Error("Missing STRIPE_SCOUT_PRICE_ID.");
    }

    return priceId;
}

export function getStripeWebhookSecret() {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
    }

    return webhookSecret;
}
