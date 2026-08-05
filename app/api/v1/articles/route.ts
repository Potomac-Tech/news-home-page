import { runDeveloperDataRoute } from "../../../../lib/developer/route-handler";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return runDeveloperDataRoute(request, "lunar_articles"); }
