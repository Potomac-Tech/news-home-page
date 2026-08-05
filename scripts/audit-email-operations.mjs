import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const issues = [];

async function source(path) {
    return readFile(new URL(path, root), "utf8");
}

function requirePattern(text, pattern, location, detail) {
    if (!pattern.test(text)) issues.push({ kind: "missing-contract", location, detail });
}

function forbidPattern(text, pattern, location, detail) {
    if (pattern.test(text)) issues.push({ kind: "forbidden-contract", location, detail });
}

const paths = [
    "app/_data/tiers.ts",
    "app/command/actions.ts",
    "app/command/CommandInterestForm.tsx",
    "app/admin/email/page.tsx",
    "lib/email/resend.ts",
    "lib/email/resend-quota.ts",
    "supabase/migrations/20260710184052_resend_free_quota_governor.sql",
    "supabase/migrations/20260710184638_admin_resend_email_operations_rpc.sql",
    "supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql",
    "supabase/migrations/20260713141133_member_alert_digest_delivery.sql",
    "docs/resend-free-operations.md",
    ".env.example",
];
const files = Object.fromEntries(await Promise.all(paths.map(async (path) => [path, await source(path)])));
const allRuntime = Object.entries(files)
    .filter(([path]) => !path.startsWith("docs/") && path !== ".env.example")
    .map(([, text]) => text)
    .join("\n");
const command = `${files["app/command/actions.ts"]}\n${files["app/command/CommandInterestForm.tsx"]}`;

requirePattern(files["app/_data/tiers.ts"], /enterprisePublicName[^=]*=\s*"Cabeus Council"/, "app/_data/tiers.ts", "Public enterprise label is not Cabeus Council.");
forbidPattern(command, /mailto:|stripe|checkout|invoice|payment-provider/i, "app/command", "Cabeus Council exposes a public payment or mailto workflow.");
requirePattern(files["app/command/actions.ts"], /replyTo:\s*contactEmail/, "app/command/actions.ts", "Cabeus Council does not use the validated business email as Reply-To.");
requirePattern(files["app/command/actions.ts"], /create_meridian_delivery_event[\s\S]*claim_meridian_delivery_quota[\s\S]*sendOperationalEmail[\s\S]*complete_meridian_delivery/, "app/command/actions.ts", "Lead, quota, send, and audit operations are out of order or missing.");
requirePattern(files["lib/email/resend.ts"], /RESEND_API_KEY/, "lib/email/resend.ts", "Server-only Resend key is missing.");
requirePattern(files["lib/email/resend.ts"], /info@potomacdb\.com/, "lib/email/resend.ts", "Approved sender fallback is missing.");
forbidPattern(allRuntime, /NEXT_PUBLIC_RESEND|NEXT_PUBLIC_[A-Z_]*EMAIL_API_KEY/, "runtime source", "A Resend/email secret uses a public environment prefix.");
forbidPattern(allRuntime, /pay[- ]as[- ]you[- ]go|dedicated[- ]ip|marketing[- ]broadcast|paid[- ]add[- ]on/i, "runtime source", "Paid Resend feature usage found.");
requirePattern(files["lib/email/resend-quota.ts"], /RESEND_PLAN[\s\S]*free[\s\S]*RESEND_INBOUND_RECEIVING[\s\S]*disabled[\s\S]*RESEND_SENDING_DOMAIN_COUNT[\s\S]*1/, "lib/email/resend-quota.ts", "Free-plan runtime guard is incomplete.");
for (const token of ["daily_soft_cap", "monthly_soft_cap", "daily_hard_cap", "monthly_hard_cap", "operational_daily_reserve", "operational_monthly_reserve", "idempotency_key", "next_retry_at"]) {
    requirePattern(files["supabase/migrations/20260710184052_resend_free_quota_governor.sql"], new RegExp(token), "quota migration", `Quota contract ${token} is missing.`);
}
const adminOperationsSql = `${files["supabase/migrations/20260710184638_admin_resend_email_operations_rpc.sql"]}\n${files["supabase/migrations/20260713141133_member_alert_digest_delivery.sql"]}`;
for (const token of ["provider_message_id", "delivery_status", "failure_reason", "alert_config", "alert_queue"]) {
    requirePattern(adminOperationsSql, new RegExp(token), "admin operations RPC", `Admin operation ${token} is missing.`);
}
requirePattern(files["app/admin/email/page.tsx"], /Daily sent \/ reserved[\s\S]*Monthly sent \/ reserved[\s\S]*Queue health/, "app/admin/email/page.tsx", "Admin quota dashboard is incomplete.");
requirePattern(files["supabase/migrations/20260713141133_member_alert_digest_delivery.sql"], /digest_cadence_hours[\s\S]*low_budget_buffer/, "alert digest migration", "Alert digest controls are incomplete.");
for (const line of ["RESEND_PLAN=free", "RESEND_INBOUND_RECEIVING=disabled", "RESEND_SENDING_DOMAIN_COUNT=1"]) {
    requirePattern(files[".env.example"], new RegExp(line), ".env.example", `Missing release setting ${line}.`);
}
for (const heading of ["Daily and monthly resets", "Manual resend", "Upgrade escalation", "Capped delivery behavior", "Live release verification"]) {
    requirePattern(files["docs/resend-free-operations.md"], new RegExp(`## ${heading}`), "docs/resend-free-operations.md", `Operations section ${heading} is missing.`);
}

const report = { checkedAt: new Date().toISOString(), issueCount: issues.length, issues };
await mkdir(new URL(".tmp/", root), { recursive: true });
await writeFile(new URL(".tmp/email-operations-audit.json", root), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = issues.length ? 1 : 0;
