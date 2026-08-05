const USA_SPENDING_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
const INGESTION_URL = "https://www.cabeusexplorer.com/api/internal/trackers/ingest";

declare const Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve(async (request) => {
    const secret = Deno.env.get("TRACKER_INGESTION_SECRET")?.trim();
    if (!secret || request.headers.get("x-ingestion-secret") !== secret) {
        return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
    const response = await fetch(USA_SPENDING_URL, {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "user-agent": "CabeusExplorer/1.0 info@potomacdb.com",
        },
        body: JSON.stringify({
            filters: {
                keywords: ["lunar", "moon", "cislunar", "artemis", "clps", "gateway"],
                award_type_codes: ["A", "B", "C", "D"],
                time_period: [{ start_date: startDate, end_date: endDate }],
            },
            fields: [
                "Award ID",
                "Recipient Name",
                "Start Date",
                "End Date",
                "Award Amount",
                "Awarding Agency",
                "Awarding Sub Agency",
                "Award Type",
                "Description",
            ],
            page: 1,
            limit: 10,
            sort: "Start Date",
            order: "desc",
        }),
    });
    if (!response.ok) {
        return Response.json({ error: `USAspending returned ${response.status}.` }, { status: 502 });
    }

    const payload = await response.json();
    const ingestionResponse = await fetch(INGESTION_URL, {
        method: "POST",
        headers: {
            authorization: `Bearer ${secret}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ job: "contract-awards", payload }),
    });
    return new Response(await ingestionResponse.text(), {
        status: ingestionResponse.status,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
});
