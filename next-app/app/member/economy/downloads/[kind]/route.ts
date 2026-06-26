import { NextResponse } from "next/server";
import { getEconomySubscriberAccessContext } from "../../../../../lib/auth/economy";
import { hasPotomacSupabasePublicConfig } from "../../../../../lib/supabase/config";
import { createClient } from "../../../../../lib/supabase/server";
import {
    buildEconomyCsv,
    isEconomyCsvKind,
    loadDetailedEconomyDashboard,
} from "../../../../_data/economy";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    context: { params: Promise<{ kind: string }> }
) {
    const { kind } = await context.params;

    if (!isEconomyCsvKind(kind)) {
        return new NextResponse("Unknown economy download.", { status: 404 });
    }

    if (!hasPotomacSupabasePublicConfig()) {
        return new NextResponse("Supabase configuration is required.", {
            status: 503,
        });
    }

    const requestUrl = new URL(request.url);
    const supabase = await createClient();
    const access = await getEconomySubscriberAccessContext({
        supabase,
        nextPath: "/member/economy",
    });

    if (access.state === "signed_out") {
        return NextResponse.redirect(
            new URL(access.loginHref, requestUrl.origin)
        );
    }

    if (!access.canReadEconomyDashboard) {
        return new NextResponse("Scout or Command access is required.", {
            status: 403,
        });
    }

    const dashboard = await loadDetailedEconomyDashboard(supabase);
    const csv = buildEconomyCsv(kind, dashboard);

    return new NextResponse(csv, {
        headers: {
            "Cache-Control": "private, no-store",
            "Content-Disposition": `attachment; filename="potomac-lunar-economy-${kind}.csv"`,
            "Content-Type": "text/csv; charset=utf-8",
        },
    });
}
