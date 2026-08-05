import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = new URL(
    process.env.CRAWL_BASE_URL ?? "https://www.cabeusexplorer.com/"
);
const edgeExecutable =
    process.env.PLAYWRIGHT_EXECUTABLE_PATH ??
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const hostResolverRules = process.env.CRAWL_HOST_RESOLVER_RULES?.trim();
const maxPages = Number(process.env.CRAWL_MAX_PAGES ?? 60);
const issues = [];
const visited = new Set();
const seedPaths = (process.env.CRAWL_SEED_PATHS ?? "").split(",").map((path) => path.trim()).filter(Boolean);
const seedUrls = [baseUrl.href, ...seedPaths.map((path) => new URL(path, baseUrl).href)];
const queued = new Set(seedUrls);
const queue = [...seedUrls];

function recordIssue(kind, detail, pageUrl) {
    const key = `${kind}|${detail}|${pageUrl}`;
    if (!issues.some((issue) => issue.key === key)) {
        issues.push({ key, kind, detail, pageUrl });
    }
}

function isInternalRoute(href) {
    try {
        const url = new URL(href, baseUrl);
        return (
            url.origin === baseUrl.origin &&
            ["http:", "https:"].includes(url.protocol) &&
            !url.pathname.startsWith("/api/") &&
            !url.pathname.startsWith("/_next/") &&
            !url.pathname.startsWith("/auth/logout")
        );
    } catch {
        return false;
    }
}

function enqueue(href) {
    const url = new URL(href, baseUrl);
    url.hash = "";
    if (!visited.has(url.href) && !queued.has(url.href)) {
        queued.add(url.href);
        queue.push(url.href);
    }
}

function isSafeButton(button) {
    const text = button.text.trim().toLowerCase();
    const type = (button.type ?? "button").toLowerCase();
    const blocked = /delete|send|submit|request|apply|upgrade|checkout|resend|save|create|post|report|block|pause/;
    return type !== "submit" && !blocked.test(text);
}

const browser = await chromium.launch({
    executablePath: edgeExecutable,
    headless: true,
    args: hostResolverRules ? [`--host-resolver-rules=${hostResolverRules}`] : [],
});
const context = await browser.newContext();
const page = await context.newPage();

page.on("console", (message) => {
    const text = message.text();
    const genericResourceError =
        text === "Failed to load resource: the server responded with a status of 503 ()";
    if (
        !genericResourceError &&
        (message.type() === "error" || /content security policy|csp/i.test(text))
    ) {
        recordIssue(`console:${message.type()}`, text, page.url());
    }
});
page.on("pageerror", (error) => {
    recordIssue("pageerror", error.message, page.url());
});
page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (
        status >= 400 &&
        !response.request().isNavigationRequest() &&
        new URL(url).origin === baseUrl.origin
    ) {
        recordIssue(`response:${status}`, `${response.request().resourceType()} ${url}`, page.url());
    }
});
page.on("requestfailed", (request) => {
    if (request.failure()?.errorText === "net::ERR_ABORTED") {
        return;
    }
    if (new URL(request.url()).origin === baseUrl.origin) {
        recordIssue(
            "requestfailed",
            `${request.resourceType()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
            page.url()
        );
    }
});

while (queue.length && visited.size < maxPages) {
    const target = queue.shift();
    if (!target || visited.has(target)) continue;

    visited.add(target);
    try {
        let response;
        for (let attempt = 0; attempt < 3; attempt += 1) {
            response = await page.goto(target, {
                waitUntil: "domcontentloaded",
                timeout: 20000,
            });
            if (!response || response.status() < 500 || attempt === 2) break;
            await page.waitForTimeout(1000 * (attempt + 1));
        }
        if (response && response.status() >= 400) {
            recordIssue(`document:${response.status()}`, target, target);
        }
        await page.waitForTimeout(500);

        const links = await page.locator("a[href]").evaluateAll((elements) =>
            elements.map((element) => (element instanceof HTMLAnchorElement ? element.href : ""))
        );
        for (const href of links) {
            if (isInternalRoute(href)) enqueue(href);
        }

        const buttons = await page.locator("button:not([disabled])").evaluateAll((elements) =>
            elements.map((element, index) => {
                const button = element instanceof HTMLButtonElement ? element : null;
                return {
                    index,
                    text: button?.innerText ?? "",
                    type: button?.type ?? "button",
                };
            })
        );
        for (const button of buttons.filter(isSafeButton)) {
            const locator = page.locator("button:not([disabled])").nth(button.index);
            try {
                await locator.click({ timeout: 1500 });
                await page.waitForTimeout(100);
            } catch (error) {
                recordIssue("interaction", `${button.text || "button"}: ${String(error)}`, target);
            }
        }
    } catch (error) {
        recordIssue("navigation", `${target}: ${String(error)}`, target);
    }
}

await browser.close();
await mkdir(".tmp", { recursive: true });
const report = {
    baseUrl: baseUrl.href,
    visited: [...visited],
    issues: issues.map(({ key: _key, ...issue }) => issue),
};
await writeFile(".tmp/production-crawl.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.issues.length ? 1 : 0;
