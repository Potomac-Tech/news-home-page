import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
    runTrackerIngestion,
    type TrackerIngestionJob,
} from "../../../../../lib/trackers/production-ingestion";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
    const expected = process.env.TRACKER_INGESTION_SECRET?.trim();
    const authorization = request.headers.get("authorization") ?? "";
    const supplied = authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";
    if (!expected || !supplied) return false;
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    return (
        expectedBuffer.length === suppliedBuffer.length &&
        timingSafeEqual(expectedBuffer, suppliedBuffer)
    );
}

function isJob(value: unknown): value is TrackerIngestionJob {
    return (
        value === "launches" ||
        value === "space-weather" ||
        value === "contract-awards" ||
        value === "stock-quotes"
    );
}

export async function POST(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = (await request.json().catch(() => null)) as
        | { job?: unknown; payload?: unknown }
        | null;
    if (!isJob(body?.job)) {
        return NextResponse.json({ error: "Unknown tracker job." }, { status: 400 });
    }
    try {
        return NextResponse.json(await runTrackerIngestion(body.job, body.payload), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        const detail =
            error instanceof Error
                ? error.message
                : error && typeof error === "object" && "message" in error
                  ? String(error.message)
                  : "Unknown error";
        console.error("Tracker ingestion failed", {
            job: body.job,
            message: detail,
        });
        return NextResponse.json(
            {
                error: "Tracker ingestion failed.",
                job: body.job,
                detail,
            },
            { status: 500 }
        );
    }
}
