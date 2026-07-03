import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { after, before, test } from "node:test";
import { chromium } from "@playwright/test";

const root = new URL("..", import.meta.url);
const rootPath = fileURLToPath(root);
const nextCliPath = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url)
);
const isWindows = process.platform === "win32";
const serverOutput = [];

let server;
let browser;
let baseUrl;

function getFreePort() {
    return new Promise((resolve, reject) => {
        const socket = net.createServer();

        socket.once("error", reject);
        socket.listen(0, () => {
            const address = socket.address();
            socket.close(() => {
                if (address && typeof address === "object") {
                    resolve(address.port);
                    return;
                }

                reject(new Error("Could not resolve a free test port."));
            });
        });
    });
}

async function waitForServer(url, timeoutMs = 90000) {
    const started = Date.now();
    let lastError;

    while (Date.now() - started < timeoutMs) {
        try {
            const response = await fetch(url, { redirect: "manual" });

            if (response.status < 500) {
                return;
            }
        } catch (error) {
            lastError = error;
        }

        await new Promise((resolve) => setTimeout(resolve, 750));
    }

    throw new Error(
        `Next E2E server did not become ready. Last error: ${
            lastError instanceof Error ? lastError.message : "unknown"
        }\n${serverOutput.slice(-20).join("\n")}`
    );
}

async function launchBrowser() {
    try {
        return await chromium.launch();
    } catch {
        return chromium.launch({ channel: "msedge" });
    }
}

async function newPage() {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const consoleMessages = [];
    page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) {
            consoleMessages.push(`${message.type()}: ${message.text()}`);
        }
    });
    page.on("pageerror", (error) => {
        consoleMessages.push(`pageerror: ${error.message}`);
    });

    return {
        page,
        consoleMessages,
    };
}

async function closePage(page) {
    if (!page.isClosed()) {
        await page.close();
    }
}

async function expectNoFrameworkOverlay(page, consoleMessages) {
    await assertVisibleText(page, "body");
    const body = await page.locator("body").innerText();

    assert.doesNotMatch(body, /Unhandled Runtime Error|Application error|Next\.js/i);
    assert.deepEqual(
        consoleMessages.filter(
            (message) =>
                !message.includes("Download the React DevTools") &&
                !message.includes("404") &&
                !message.includes(
                    "upgrade-insecure-requests' is ignored when delivered in a report-only policy"
                )
        ),
        []
    );
}

async function assertVisibleText(page, selectorOrText) {
    if (selectorOrText === "body") {
        await assert.doesNotReject(() => page.locator("body").waitFor());
        const text = await page.locator("body").innerText();
        assert.ok(text.trim().length > 100, "page should render meaningful content");
        return;
    }

    await assert.doesNotReject(() =>
        page.getByText(selectorOrText, { exact: false }).first().waitFor()
    );
}

before(async () => {
    const port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const serverEnv = {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SUPABASE_URL: "https://xlpkdoeldtlhearqajat.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "e2e-placeholder-key",
    };

    server = spawn(
        process.execPath,
        [
            nextCliPath,
            "start",
            "next-app",
            "-p",
            String(port),
            "--hostname",
            "127.0.0.1",
        ],
        {
            cwd: rootPath,
            env: serverEnv,
            stdio: ["ignore", "pipe", "pipe"],
        }
    );

    server.stdout.on("data", (chunk) => {
        serverOutput.push(chunk.toString());
    });
    server.stderr.on("data", (chunk) => {
        serverOutput.push(chunk.toString());
    });

    await waitForServer(baseUrl);
    browser = await launchBrowser();
});

after(async () => {
    if (browser) {
        await browser.close();
    }

    if (server && !server.killed) {
        if (isWindows) {
            spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
                stdio: "ignore",
            });
        } else {
            server.kill("SIGTERM");
        }
    }
});

test("public article teaser shows citations and member-gated full story", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/news/vipc-grant-winner`, {
            waitUntil: "domcontentloaded",
        });

        assert.match(await page.title(), /VIPC Launch Grant/i);
        await assertVisibleText(page, "Public summary");
        await assertVisibleText(page, "Public intro");
        await assertVisibleText(page, "Source Citations");
        await assertVisibleText(
            page,
            "Full analysis is reserved for approved members."
        );

        await page
            .getByRole("article")
            .getByRole("link", { name: /^Sign in$/i })
            .click();
        await page.waitForURL(/\/auth\/login\?next=%2Fnews%2Fvipc-grant-winner/);
        await assertVisibleText(page, "Sign in");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("Explorer article unlock journey redirects signed-out readers to login", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/news/vipc-grant-winner`, {
            waitUntil: "domcontentloaded",
        });

        await page
            .getByRole("article")
            .getByRole("link", { name: /^Sign in$/i })
            .click();
        await page.waitForURL(/\/auth\/login\?next=%2Fnews%2Fvipc-grant-winner/);
        await assertVisibleText(page, "Sign in");
        await assertVisibleText(page, "Magic link");
        await assertVisibleText(page, "Password");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("Scout dashboard path is browser-reachable and protected", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/member/developer`, {
            waitUntil: "domcontentloaded",
        });

        await page.waitForURL(/\/auth\/login\?next=%2Fmember%2Fdeveloper/);
        await assertVisibleText(page, "Sign in");
        await assertVisibleText(page, "Member access");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("chat, forums, and RFQs expose their access gates without blank screens", { timeout: 60000 }, async () => {
    const routes = [
        ["/member/chat", "Member access"],
        ["/member/forums", "Member access"],
        ["/member/rfqs", "Member access"],
    ];

    for (const [route, detail] of routes) {
        const { page, consoleMessages } = await newPage();

        try {
            await page.goto(`${baseUrl}${route}`, {
                waitUntil: "domcontentloaded",
            });
            await page.waitForURL(/\/auth\/login\?next=%2Fmember%2F/);
            await assertVisibleText(page, "Sign in");
            await assertVisibleText(page, detail);
            await expectNoFrameworkOverlay(page, consoleMessages);
        } finally {
            await closePage(page);
        }
    }
});

test("lunar terminal navigation exposes the core intelligence modules", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/terminal`, { waitUntil: "domcontentloaded" });

        await assertVisibleText(page, "Potomac lunar industry terminal");
        await assertVisibleText(page, "Lunar industry terminal");
        await assertVisibleText(page, "Launches");
        await assertVisibleText(page, "Spacecraft and landers");
        await assertVisibleText(page, "Companies");
        await assertVisibleText(page, "Marketplace");

        await page
            .getByRole("link", { name: /Spacecraft and landers/i })
            .first()
            .click();
        await page.waitForURL(/\/spacecraft/);
        await assertVisibleText(page, "Lunar spacecraft");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("Command public and admin flows render the request path and admin protection", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/command`, { waitUntil: "domcontentloaded" });
        await assertVisibleText(page, "Command Access");
        await assertVisibleText(page, "Request Command access");

        await page.getByLabel("Contact name").fill("Automation Reviewer");
        await page.getByLabel("Contact email").fill("reviewer@example.com");
        await page.getByLabel("Organization").fill("Potomac Automation");
        await page.getByLabel("Title").fill("Program Lead");
        await page.getByLabel("Estimated seats").fill("12");
        await page
            .getByLabel("Mission need")
            .fill("Validate Command request intake.");

        await page.goto(`${baseUrl}/admin/command`, {
            waitUntil: "domcontentloaded",
        });
        await page.waitForURL(
            /\/auth\/login\?next=(%2F|\/)admin(%2F|\/)applications/
        );
        await assertVisibleText(page, "Sign in");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});
