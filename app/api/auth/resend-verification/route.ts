import { NextResponse } from "next/server";
import { safeReturnPath } from "../../../../lib/auth/profile-completion";
import { createClient } from "../../../../lib/supabase/server";
import { createServiceClient } from "../../../../lib/supabase/service";
import { trustedRequestOrigin } from "../../../../lib/http/request-origin";

export const dynamic = "force-dynamic";

type ResendClaim = {
    event_id: string;
    is_allowed: boolean;
    retry_after_seconds: number;
};

function normalizeEmail(value: unknown) {
    if (typeof value !== "string") return null;
    const email = value.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

async function emailHash(email: string) {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(email)
    );

    return Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
}

function jsonError(error: string, status: number) {
    return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const admin = createServiceClient();
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = normalizeEmail(body?.email);

    if (!email) {
        return jsonError("Enter the email address used to create your account.", 400);
    }

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email_confirmed_at) {
        return jsonError("This email address is already verified.", 409);
    }

    const normalizedEmailHash = await emailHash(email);
    const { data: claimData, error: claimError } = await admin.rpc(
        "claim_email_verification_resend",
        { p_email_hash: normalizedEmailHash }
    );
    const claim = (claimData as ResendClaim[] | null)?.[0];

    if (claimError || !claim) {
        return jsonError("Verification resend is temporarily unavailable.", 503);
    }

    if (!claim.is_allowed) {
        return NextResponse.json(
            {
                ok: false,
                error: "Please wait before requesting another verification email.",
                retryAfterSeconds: claim.retry_after_seconds,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(claim.retry_after_seconds),
                },
            }
        );
    }

    const requestUrl = new URL(request.url);
    const nextPath = safeReturnPath(requestUrl.searchParams.get("next"));
    const callbackUrl = new URL("/auth/callback", trustedRequestOrigin(requestUrl));
    callbackUrl.searchParams.set("next", nextPath);

    const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
            emailRedirectTo: callbackUrl.toString(),
        },
    });

    const outcome = resendError ? "failed" : "sent";
    const { error: completionError } = await admin.rpc(
        "complete_email_verification_resend",
        {
            p_event_id: claim.event_id,
            p_email_hash: normalizedEmailHash,
            p_outcome: outcome,
            p_failure_reason: resendError?.message ?? null,
        }
    );

    if (completionError) {
        return jsonError("Verification resend could not be recorded. Please try again later.", 503);
    }

    if (resendError) {
        return jsonError("We could not send a verification email. Please try again later.", 502);
    }

    return NextResponse.json({
        ok: true,
        message: "A new verification email has been sent. Check your inbox and spam folder.",
    });
}
