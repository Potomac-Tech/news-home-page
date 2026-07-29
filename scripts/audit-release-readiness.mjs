import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const baseUrl = new URL(process.env.RELEASE_AUDIT_BASE_URL ?? "http://127.0.0.1:3001");
const edgeExecutable = process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ?? (process.platform === "win32"
        ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        : undefined);
const issues = [];

const routeSpecs = [
    { path: "/", kind: "public" },
    { path: "/terminal", kind: "public" },
    { path: "/search", kind: "public" },
    { path: "/news", kind: "public", expectedPath: "/" },
    { path: "/datasets", kind: "public" },
    { path: "/calculators", kind: "public" },
    { path: "/pricing", kind: "enterprise" },
    { path: "/upgrade", kind: "gated-enterprise" },
    { path: "/command", kind: "gated-enterprise" },
    { path: "/request-access", kind: "public" },
    { path: "/member", kind: "gated" },
    { path: "/tracker/launches", kind: "gated" },
    { path: "/alerts", kind: "gated" },
    { path: "/account", kind: "public-safe-gate" },
    { path: "/nexus", kind: "public-safe-gate" },
    { path: "/team", kind: "public" },
    { path: "/legal/terms", kind: "public" },
    { path: "/legal/privacy", kind: "public" },
    { path: "/spacecraft", kind: "hidden" },
    { path: "/companies", kind: "hidden" },
    { path: "/procurement", kind: "hidden" },
    { path: "/regulatory", kind: "hidden" },
    { path: "/tracker/contracts", kind: "hidden" },
    { path: "/member/marketplace", kind: "hidden" },
];
const placeholderPattern = /\b(lorem ipsum|coming soon|launch pending|placeholder content|replace me|queued for review|representative record)\b|curated quote feed not connected|commodity setup queued|https?:\/\/(?:www\.)?example\.com/i;
const oldTierPattern = /\$(?:1,495|3,495|7,495)\b|\bProfessional membership\b|\bEnterprise membership\b/i;
const paidResendPattern = /pay[- ]as[- ]you[- ]go|dedicated[- ]ip|marketing[- ]broadcast|paid[- ]add[- ]on/i;

function addIssue(kind, location, detail) {
    issues.push({ kind, location, detail });
}

async function source(path) {
    return readFile(new URL(path, root), "utf8");
}

function requirePattern(text, pattern, location, detail) {
    if (!pattern.test(text)) addIssue("source-contract", location, detail);
}

function forbidPattern(text, pattern, location, detail) {
    if (pattern.test(text)) addIssue("forbidden-source", location, detail);
}

async function checkSourceContracts() {
    const files = Object.fromEntries(await Promise.all([
        "app/_data/tiers.ts",
        "app/_data/channels.ts",
        "app/_data/homepage.ts",
        "app/news/_data/articles.ts",
        "app/_data/weeklyLaunchTracker.ts",
        "app/_data/contractAwards.ts",
        "app/_data/homepageCarousel.ts",
        "app/_data/contentSubmissions.ts",
        "app/_data/sponsorAds.ts",
        "lib/auth/profile-completion.ts",
        "lib/email/resend.ts",
        "lib/email/resend-quota.ts",
        "app/command/actions.ts",
        "app/command/CommandInterestForm.tsx",
        "supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql",
        "scripts/check-promotional-expiration.mjs",
        "lib/content/production-import.ts",
        "app/admin/content/actions.ts",
        "supabase/migrations/20260714202917_production_content_import_workflow.sql",
    ].map(async (path) => [path, await source(path)])));

    requirePattern(files["app/_data/tiers.ts"], /enterprisePublicName[^=]*=\s*"Meridian"/, "app/_data/tiers.ts", "Public enterprise label must remain Meridian.");
    requirePattern(files["app/_data/tiers.ts"], /price:\s*"\$25,000"/, "app/_data/tiers.ts", "Scout price must remain $25,000.");
    requirePattern(files["app/_data/channels.ts"], /https:\/\/www\.linkedin\.com\/company\/cabeus-explorer/, "app/_data/channels.ts", "LinkedIn must use the approved Cabeus Explorer URL.");
    requirePattern(files["app/_data/channels.ts"], /NEXT_PUBLIC_SUBSTACK_URL[\s\S]*substack\.com/, "app/_data/channels.ts", "Substack must use an allow-listed HTTPS URL.");
    requirePattern(files["app/_data/channels.ts"], /NEXT_PUBLIC_PODCAST_URL[\s\S]*podcasts\.apple\.com/, "app/_data/channels.ts", "Podcast must use an allow-listed HTTPS URL.");
    forbidPattern(files["app/_data/channels.ts"], /\b(?:twitter|x\.com)\b/i, "app/_data/channels.ts", "Unapproved X/Twitter channel found.");

    for (const path of ["app/_data/homepage.ts", "app/news/_data/articles.ts"]) {
        forbidPattern(files[path], placeholderPattern, path, "Placeholder copy or URL found in public fallback content.");
        forbidPattern(files[path], oldTierPattern, path, "Legacy tier name or price found in public fallback content.");
    }

    for (const path of ["app/_data/weeklyLaunchTracker.ts", "app/_data/contractAwards.ts"]) {
        requirePattern(files[path], /citation(?:s|_url)/i, path, "Intelligence loader must include citations.");
        requirePattern(files[path], /(?:sourceCheckedAt|source_checked_at|reviewedAt|reviewed_at)/, path, "Intelligence loader must include source freshness or review time.");
        requirePattern(files[path], /(?:value_state|state: value\.value_state)/, path, "Intelligence loader must preserve value-basis state.");
        requirePattern(files[path], /(?:analyst_estimate|estimate: value\.)/, path, "Intelligence loader must keep analyst estimates in gated value records.");
    }

    requirePattern(files["app/_data/homepageCarousel.ts"], /expiresAt|expires_at/, "app/_data/homepageCarousel.ts", "Carousel records must include expiration metadata.");
    requirePattern(files["app/_data/contentSubmissions.ts"], /expires_at/, "app/_data/contentSubmissions.ts", "Published content must enforce expiration metadata.");
    requirePattern(files["app/_data/sponsorAds.ts"], /expiresAt/, "app/_data/sponsorAds.ts", "Promotional fallbacks must include expiration metadata.");
    requirePattern(files["scripts/check-promotional-expiration.mjs"], /expiration > Date\.now\(\)/, "scripts/check-promotional-expiration.mjs", "Expired promotional content must fail release checks.");

    requirePattern(files["lib/auth/profile-completion.ts"], /email_unverified/, "lib/auth/profile-completion.ts", "Email verification gate is missing.");
    requirePattern(files["lib/auth/profile-completion.ts"], /profile_incomplete/, "lib/auth/profile-completion.ts", "Profile completion gate is missing.");
    requirePattern(files["lib/email/resend.ts"], /RESEND_API_KEY/, "lib/email/resend.ts", "Server-side Resend adapter is missing.");
    requirePattern(files["lib/email/resend.ts"], /info@potomacdb\.com/, "lib/email/resend.ts", "Approved Resend sender/destination is missing.");
    requirePattern(files["lib/email/resend-quota.ts"], /RESEND_PLAN[\s\S]*"free"/, "lib/email/resend-quota.ts", "Resend Free-plan enforcement is missing.");
    requirePattern(files["app/command/actions.ts"], /hasValidResendFreePlanConfig/, "app/command/actions.ts", "Meridian inquiry must preflight Resend Free quota.");
    requirePattern(files["supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql"], /meridian_email_domain_rules[\s\S]*decision in \('deny', 'allow'\)/, "supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql", "Meridian inquiry must retain the business-email denylist.");
    requirePattern(files["supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql"], /if v_rule = 'deny'[\s\S]*business or organization email is required/, "supabase/migrations/20260710185238_meridian_authenticated_inquiry_workflow.sql", "Meridian inquiry RPC must reject denied personal domains.");
    requirePattern(files["app/command/actions.ts"], /replyTo:/, "app/command/actions.ts", "Meridian inquiry must set a safe Reply-To.");
    forbidPattern(`${files["app/command/actions.ts"]}\n${files["app/command/CommandInterestForm.tsx"]}`, /mailto:|stripe|checkout|invoice|payment-provider/i, "app/command", "Meridian inquiry exposes a forbidden payment or mailto workflow.");
    forbidPattern(`${files["lib/email/resend.ts"]}\n${files["lib/email/resend-quota.ts"]}`, paidResendPattern, "lib/email", "Paid Resend feature language found in the runtime email implementation.");
    requirePattern(files["lib/content/production-import.ts"], /placeholder_copy_prohibited[\s\S]*reviewed_asset_reference_required/, "lib/content/production-import.ts", "Production imports must reject placeholder copy and missing reviewed assets.");
    requirePattern(files["app/admin/content/actions.ts"], /license_status === "approved"[\s\S]*analyst_review_state === "approved"[\s\S]*publication_status === "published"/, "app/admin/content/actions.ts", "Production imports must require approved source-registry records.");
    requirePattern(files["supabase/migrations/20260714202917_production_content_import_workflow.sql"], /enable row level security/g, "production content import migration", "Production import audit tables must use RLS.");
}

function safeInternalUrl(href) {
    try {
        const url = new URL(href, baseUrl);
        return url.origin === baseUrl.origin && !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/_next/");
    } catch {
        return false;
    }
}

async function checkRenderedRoutes() {
    const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const checkedLinks = new Map();

    try {
        for (const spec of routeSpecs) {
            const page = await context.newPage();
            const pageIssues = [];
            page.on("pageerror", (error) => pageIssues.push(`Runtime error: ${error.message}`));
            page.on("console", (message) => {
                if (message.type() === "error") pageIssues.push(`Console error: ${message.text()}`);
            });

            const requested = new URL(spec.path, baseUrl);
            const response = await page.goto(requested.href, { waitUntil: "networkidle", timeout: 30_000 });
            await page.waitForTimeout(250);
            const finalUrl = new URL(page.url());
            const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
            const dimensions = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));
            const anchors = await page.locator("a[href]").evaluateAll((elements) => elements.map((element) => ({
                href: element.getAttribute("href") ?? "",
                text: (element.textContent ?? "").trim(),
            })));
            const accessibility = await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze();

            if (!response || response.status() >= 400) pageIssues.push(`Route returned ${response?.status() ?? "no response"}.`);
            if (placeholderPattern.test(bodyText)) pageIssues.push("Visible placeholder copy is present.");
            if (oldTierPattern.test(bodyText)) pageIssues.push("Visible legacy tier name or price is present.");
            if (dimensions.scrollWidth > dimensions.clientWidth + 1) pageIssues.push(`Horizontal overflow ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px.`);
            const seriousViolations = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
            if (seriousViolations.length) pageIssues.push(`Accessibility: ${seriousViolations.map((violation) => `${violation.id} (${violation.nodes.length}) targets ${violation.nodes.slice(0, 4).map((node) => node.target.join(" ")).join("; ")}`).join(", ")}.`);
            if (spec.kind.includes("enterprise") && anchors.some((anchor) => /^mailto:/i.test(anchor.href))) pageIssues.push("Meridian route exposes a mailto workflow.");
            if (spec.kind.includes("enterprise") && /\bMeridian\s+(?:checkout|invoice|payment)|(?:checkout|invoice|payment)\s+for\s+Meridian\b/i.test(bodyText)) pageIssues.push("Meridian route exposes a self-serve payment workflow.");
            if (spec.kind === "hidden" && finalUrl.pathname !== "/terminal") pageIssues.push(`Hidden route ended at ${finalUrl.pathname} instead of /terminal.`);
            if (spec.kind.includes("gated") && !["/request-access", "/account/profile/complete"].includes(finalUrl.pathname)) pageIssues.push(`Anonymous gated route ended at ${finalUrl.pathname}.`);
            const expectedPath = spec.expectedPath ?? requested.pathname;
            if (spec.kind !== "hidden" && !spec.kind.includes("gated") && finalUrl.pathname !== expectedPath) pageIssues.push(`Public route ended at ${finalUrl.pathname} instead of ${expectedPath}.`);

            for (const anchor of anchors) {
                if (/^(?:#|javascript:)/i.test(anchor.href)) pageIssues.push(`Unsafe or placeholder link: ${anchor.text || anchor.href}.`);
                if (/example\.com/i.test(anchor.href)) pageIssues.push(`Example link remains: ${anchor.href}.`);
                if (safeInternalUrl(anchor.href)) checkedLinks.set(new URL(anchor.href, baseUrl).href, spec.path);
            }
            for (const detail of pageIssues) addIssue("rendered-route", spec.path, detail);
            await page.close();
        }

        for (const [href, sourceRoute] of checkedLinks) {
            const url = new URL(href);
            url.hash = "";
            if (url.pathname === "/auth/logout") continue;
            const response = await context.request.get(url.href, { maxRedirects: 5, timeout: 15_000 });
            if (response.status() >= 400) addIssue("broken-internal-link", sourceRoute, `${url.pathname} returned ${response.status()}.`);
        }
    } finally {
        await browser.close();
    }
}

await checkSourceContracts();
await checkRenderedRoutes();

const report = {
    baseUrl: baseUrl.href,
    checkedAt: new Date().toISOString(),
    routeCount: routeSpecs.length,
    issueCount: issues.length,
    issues,
};
await mkdir(new URL(".tmp/", root), { recursive: true });
await writeFile(new URL(".tmp/release-readiness-audit.json", root), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = issues.length ? 1 : 0;
