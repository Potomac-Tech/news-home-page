import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runMemberAlertEvaluator } from "../../../../../lib/alerts/evaluator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
    const expected = process.env.ALERT_EVALUATOR_SECRET?.trim();
    const authorization = request.headers.get("authorization") ?? "";
    const supplied = authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";
    if (!expected || !supplied) return false;
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length
        && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    try {
        return NextResponse.json(await runMemberAlertEvaluator(), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Member alert evaluator failed", error);
        return NextResponse.json(
            { error: "Alert evaluation failed." },
            { status: 500 }
        );
    }
}
