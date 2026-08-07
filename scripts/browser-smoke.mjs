import { chromium, devices } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const checks = [];

for (const [name, contextOptions] of Object.entries({
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { ...devices["iPhone 13"] },
})) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `/tmp/codex-gallery-${name}-gallery.png`, fullPage: true });
  const galleryCards = await page.locator(".experiment-card").count();
  const galleryOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  checks.push(`${name}: gallery cards=${galleryCards}, horizontalOverflow=${galleryOverflow}`);

  await page.goto(`${baseUrl}/experiments/explain-stacktrace`, { waitUntil: "networkidle" });
  const runVisible = await page.getByRole("button", { name: /^Run$/ }).isVisible();
  const textarea = await page.getByRole("textbox", { name: "Stacktrace or error log" }).isVisible();
  const workspaceOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await page.screenshot({ path: `/tmp/codex-gallery-${name}-workspace.png`, fullPage: true });
  checks.push(`${name}: runVisible=${runVisible}, textareaVisible=${textarea}, workspaceOverflow=${workspaceOverflow}`);
  await context.close();
}

await browser.close();
for (const check of checks) console.log(check);
if (checks.some((check) => check.includes("horizontalOverflow=true") || check.includes("workspaceOverflow=true") || check.includes("runVisible=false") || check.includes("textareaVisible=false"))) process.exit(1);
