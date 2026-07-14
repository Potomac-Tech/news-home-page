import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = new URL(process.env.QUALITY_BASE_URL ?? "http://127.0.0.1:3001");
const routes = (process.env.QUALITY_ROUTES ?? "/,/news,/request-access,/member,/admin/applications")
    .split(",").map((route) => route.trim()).filter(Boolean);
const edgeExecutable = process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ?? (process.platform === "win32" ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" : undefined);
const budgets = { FCP: 1800, LCP: 2500, CLS: 0.1, initialJsKb: 250, documentKb: 100 };
const browser = await chromium.launch({ executablePath: edgeExecutable, headless: true });
const results = [];

for (const viewport of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 900 }]) {
    for (const route of routes) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        await page.addInitScript(() => {
            window.__qualityMetrics = { cls: 0, lcp: 0, shifts: [] };
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) window.__qualityMetrics.lcp = entry.startTime;
            }).observe({ type: "largest-contentful-paint", buffered: true });
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        window.__qualityMetrics.cls += entry.value;
                        window.__qualityMetrics.shifts.push({
                            value: entry.value,
                            sources: (entry.sources ?? []).map((source) => {
                                const node = source.node;
                                const target = !node ? "unknown" : node.id ? `#${node.id}` : `${node.tagName?.toLowerCase() ?? "node"}.${[...node.classList].slice(0, 3).join(".")}`;
                                return { target, previousRect: source.previousRect, currentRect: source.currentRect };
                            }),
                        });
                    }
                }
            }).observe({ type: "layout-shift", buffered: true });
        });
        const url = new URL(route, baseUrl).href;
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(500);
        const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
        const measurements = await page.evaluate(() => {
            const resources = performance.getEntriesByType("resource");
            const paints = performance.getEntriesByType("paint");
            const navigation = performance.getEntriesByType("navigation")[0];
            const jsBytes = resources.filter((entry) => entry.initiatorType === "script").reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0);
            return {
                FCP: paints.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null,
                LCP: window.__qualityMetrics?.lcp || null,
                CLS: window.__qualityMetrics?.cls ?? null,
                shifts: window.__qualityMetrics?.shifts ?? [],
                initialJsKb: jsBytes / 1024,
                documentKb: navigation ? (navigation.transferSize || navigation.encodedBodySize || 0) / 1024 : null,
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            };
        });
        const violations = accessibility.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
        const budgetFailures = Object.entries(budgets).filter(([name, limit]) => {
            const value = measurements[name];
            return typeof value === "number" && value > limit;
        }).map(([name, limit]) => ({ name, value: measurements[name], limit }));
        if (measurements.scrollWidth > measurements.clientWidth + 1) {
            budgetFailures.push({ name: "horizontalOverflow", value: measurements.scrollWidth, limit: measurements.clientWidth });
        }
        results.push({ viewport: viewport.name, route, status: response?.status() ?? null, measurements, accessibilityViolations: violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.length, targets: nodes.slice(0, 12).map((node) => node.target) })), budgetFailures });
        await page.close();
        await context.close();
    }
}

await browser.close();
const failures = results.filter((result) => result.status >= 400 || result.accessibilityViolations.length || result.budgetFailures.length);
const report = { baseUrl: baseUrl.href, budgets, results, failureCount: failures.length };
await mkdir(".tmp", { recursive: true });
await writeFile(".tmp/quality-audit.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
