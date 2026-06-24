import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
    createStripeClient,
    getScoutPriceId,
} from "../../../../lib/stripe/server";

const SCOUT_ANNUAL_PRICE_USD = 25000;

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
        .from("member_profiles")
        .select("email,full_name,status")
        .eq("user_id", userId)
        .maybeSingle();

    if (profileError) {
        return NextResponse.json(
            { error: profileError.message },
            { status: 500 }
        );
    }

    if (profile?.status !== "approved") {
        return NextResponse.json(
            { error: "Scout checkout requires approved Member access." },
            { status: 403 }
        );
    }

    const { data: activeScout, error: entitlementError } = await supabase
        .from("entitlements")
        .select("id")
        .eq("user_id", userId)
        .eq("tier", "scout")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

    if (entitlementError) {
        return NextResponse.json(
            { error: entitlementError.message },
            { status: 500 }
        );
    }

    if (activeScout) {
        return NextResponse.json(
            { error: "Scout access is already active." },
            { status: 409 }
        );
    }

    const stripe = createStripeClient();
    const priceId = getScoutPriceId();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const claimsEmail = claimsData.claims.email;
    const customerEmail =
        profile.email ??
        (typeof claimsEmail === "string" ? claimsEmail : undefined);

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        customer_email: customerEmail,
        client_reference_id: userId,
        success_url: `${origin}/member?checkout=scout_success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/member?checkout=scout_cancelled`,
        metadata: {
            user_id: userId,
            tier: "scout",
            annual_price_usd: String(SCOUT_ANNUAL_PRICE_USD),
        },
        subscription_data: {
            metadata: {
                user_id: userId,
                tier: "scout",
                annual_price_usd: String(SCOUT_ANNUAL_PRICE_USD),
            },
        },
    });

    return NextResponse.json({ url: session.url });
}
