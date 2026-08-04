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
                !message.includes("404")
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
        POTOMAC_E2E_CONTENT_FALLBACKS: "1",
        NEXT_PUBLIC_SUPABASE_URL: "https://xlpkdoeldtlhearqajat.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "e2e-placeholder-key",
    };

    server = spawn(
        process.execPath,
        [
            nextCliPath,
            "start",
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

test("public article teaser omits article promotions and preserves the member gate", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/news/clps-2-lunar-logistics-market`, {
            waitUntil: "domcontentloaded",
        });

        assert.match(await page.title(), /CLPS 2\.0 points toward/i);
        assert.equal(await page.getByText(/^Public summary$/i).count(), 0);
        assert.equal(await page.getByText(/^Public intro$/i).count(), 0);
        assert.equal(await page.getByText("Source Citations", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Access Path", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Publisher promotion", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Sponsored content", { exact: true }).count(), 0);
        await assertVisibleText(
            page,
            "Full analysis is reserved for approved members."
        );

        await page
            .getByRole("article")
            .getByRole("link", { name: /^Sign in$/i })
            .click();
        await page.waitForURL(/\/request-access\?tab=signin&next=%2Fnews%2Fclps-2-lunar-logistics-market/);
        await assertVisibleText(page, "Sign in");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("Explorer article unlock journey redirects signed-out readers to login", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/news/clps-2-lunar-logistics-market`, {
            waitUntil: "domcontentloaded",
        });

        await page
            .getByRole("article")
            .getByRole("link", { name: /^Sign in$/i })
            .click();
        await page.waitForURL(/\/request-access\?tab=signin&next=%2Fnews%2Fclps-2-lunar-logistics-market/);
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

        await page.waitForURL(/\/request-access\?tab=signin&next=%2Fmember%2Fdeveloper/);
        await assertVisibleText(page, "Sign in");
        await assertVisibleText(page, "Sign in to Cabeus Explorer");
        await assertVisibleText(page, "Use a secure email link or your password");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("chat, forums, and RFQs expose their access gates without blank screens", { timeout: 60000 }, async () => {
    const routes = [
        "/member/chat",
        "/member/forums",
        "/member/rfqs",
    ];

    for (const route of routes) {
        const { page, consoleMessages } = await newPage();

        try {
            await page.goto(`${baseUrl}${route}`, {
                waitUntil: "domcontentloaded",
            });
            await page.waitForURL(/\/request-access\?tab=signin&next=%2Fmember%2F/);
            await assertVisibleText(page, "Sign in");
            await assertVisibleText(page, "Sign in to Cabeus Explorer");
            await expectNoFrameworkOverlay(page, consoleMessages);
        } finally {
            await closePage(page);
        }
    }
});

test("Intelligence page and module routes remain hidden", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/terminal`, { waitUntil: "domcontentloaded" });

        assert.equal(page.url(), `${baseUrl}/terminal`);
        await assertVisibleText(page, "Page not found");

        await page.goto(`${baseUrl}/terminal/diligence`, { waitUntil: "domcontentloaded" });
        assert.equal(page.url(), `${baseUrl}/terminal/diligence`);
        await assertVisibleText(page, "Page not found");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("Council and protected Meridian flows preserve the approved access path", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.goto(`${baseUrl}/pricing`, { waitUntil: "domcontentloaded" });
        await assertVisibleText(page, "We choose to go to the Moon");
        await assertVisibleText(page, "Apply");
        assert.equal(await page.getByText("Access comparison", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Request Meridian", { exact: true }).count(), 0);

        await page.goto(`${baseUrl}/command`, { waitUntil: "domcontentloaded" });
        await page.waitForURL(/\/request-access\?tab=signin&next=%2Fcommand/);
        await assertVisibleText(page, "Sign in");

        await page.goto(`${baseUrl}/admin/command`, {
            waitUntil: "domcontentloaded",
        });
        await page.waitForURL(
            /\/request-access\?tab=signin&next=(%2F|\/)admin(%2F|\/)applications/
        );
        await assertVisibleText(page, "Sign in");
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});

test("Events opens on hover and never persists after pointer exit", { timeout: 60000 }, async () => {
    const { page, consoleMessages } = await newPage();

    try {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

        const trigger = page.getByRole("button", { name: "Events", exact: true });
        const menuItem = page.getByRole("menuitem", {
            name: "Space Industrialist Week",
            exact: true,
        });
        const homeLink = page.getByRole("link", { name: "Home Base", exact: true });

        await assertVisibleText(page, "Events");
        assert.equal(await menuItem.isVisible(), false);

        await trigger.hover();
        assert.equal(await menuItem.isVisible(), true);

        await menuItem.hover();
        assert.equal(await menuItem.isVisible(), true);

        await homeLink.hover();
        assert.equal(await menuItem.isVisible(), false);

        await trigger.hover();
        await trigger.click();
        await homeLink.hover();
        assert.equal(await menuItem.isVisible(), false);
        await expectNoFrameworkOverlay(page, consoleMessages);
    } finally {
        await closePage(page);
    }
});
