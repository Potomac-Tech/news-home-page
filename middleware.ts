import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/proxy";
import { isHiddenLaunchPath } from "./app/_data/launchVisibility";

export async function middleware(request: NextRequest) {
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
