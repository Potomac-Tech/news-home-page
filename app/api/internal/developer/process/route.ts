import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDeveloperWorker } from "../../../../../lib/developer/worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
    const expected = process.env.DEVELOPER_WORKER_SECRET?.trim() ?? "";
    const authorization = request.headers.get("authorization") ?? "";
    const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!expected || !supplied) return false;
    const left = Buffer.from(expected); const right = Buffer.from(supplied);
    return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
    if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    try { return NextResponse.json(await runDeveloperWorker(), { headers: { "Cache-Control": "no-store" } }); }
    catch (error) {
        console.error("Developer worker failed", error);
        return NextResponse.json({ error: "Developer worker failed." }, { status: 500 });
    }
}
