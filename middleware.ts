import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/proxy";
import { isHiddenLaunchPath } from "./app/_data/launchVisibility";
import {
    isTrustedRequestHostHeader,
    isTrustedRequestHostname,
} from "./lib/http/request-origin";

export async function middleware(request: NextRequest) {
    if (
        !isTrustedRequestHostname(request.nextUrl.hostname) ||
        !isTrustedRequestHostHeader(request.headers.get("host")) ||
        !isTrustedRequestHostHeader(request.headers.get("x-forwarded-host"))
    ) {
        return new NextResponse("Misdirected Request", {
            status: 421,
            headers: { "Cache-Control": "no-store" },
        });
    }
    if (request.nextUrl.hostname === "cabeusexplorer.com") {
        const canonicalUrl = request.nextUrl.clone();
        canonicalUrl.hostname = "www.cabeusexplorer.com";
        canonicalUrl.protocol = "https:";
        canonicalUrl.port = "";
        return NextResponse.redirect(canonicalUrl, 308);
    }
    if (isHiddenLaunchPath(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL("/", request.url), 307);
    }
    return updateSession(request);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)",
    ],
};
