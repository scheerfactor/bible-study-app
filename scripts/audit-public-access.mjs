import { chromium } from "playwright";

const baseUrl = new URL(process.env.PUBLIC_ACCESS_AUDIT_BASE_URL ?? "http://127.0.0.1:3000");
const privateDeepLinks = [
  "/#admin-import",
  "/#library-acquisition",
  "/?open=library-acquisition",
];
const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "desktop", width: 1280, height: 900 },
];
const forbiddenPublicText = [
  "Library Acquisition Center",
  "Rights Management Center",
  "Media Intake Center",
  "OCR Review Queue",
  "For Stephen/admin use",
  "st396@hotmail.com",
];

function fail(message) {
  console.error(`Public access audit failed: ${message}`);
  process.exitCode = 1;
}

const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    for (const deepLink of privateDeepLinks) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const targetUrl = new URL(deepLink, baseUrl);
      const response = await page.goto(targetUrl.href, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      if (!response?.ok()) {
        fail(`${viewport.label} ${deepLink} returned HTTP ${response?.status() ?? "unknown"}.`);
        await context.close();
        continue;
      }

      await page.waitForFunction(
        () => document.body.innerText.includes("Library"),
        undefined,
        { timeout: 60_000 },
      );
      await page.waitForTimeout(1_000);

      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      const finalUrl = new URL(page.url());

      if (["#admin-import", "#library-acquisition"].includes(finalUrl.hash.toLowerCase())) {
        fail(`${viewport.label} ${deepLink} left the private hash in the public URL.`);
      }
      if (finalUrl.searchParams.get("open") === "library-acquisition") {
        fail(`${viewport.label} ${deepLink} left the private query parameter in the public URL.`);
      }

      for (const forbiddenText of forbiddenPublicText) {
        if (bodyText.includes(forbiddenText.toLowerCase())) {
          fail(`${viewport.label} ${deepLink} exposed private text: ${forbiddenText}.`);
        }
      }

      if (pageErrors.length) {
        fail(`${viewport.label} ${deepLink} raised page errors: ${pageErrors.join(" | ")}`);
      }

      if (!process.exitCode) {
        console.log(`- ${viewport.label} ${deepLink}: public Library only`);
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (process.exitCode) process.exit(process.exitCode);

console.log(`Public access audit passed for ${baseUrl.origin}.`);
