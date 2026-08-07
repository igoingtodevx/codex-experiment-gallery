import { chromium, devices } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const checks = [];

for (const [name, options] of Object.entries({
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { ...devices["iPhone 13"] },
})) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? "failed"}`));

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const cards = page.locator(".experiment-card");
  const search = page.locator(".search-box input");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const categoryNav = page.locator(".category-nav");
  const categoryScroll = await categoryNav.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }));
  const categoryHintVisible = await page.locator(".category-scroll-hint").isVisible();
  const touchHeights = await page.locator(".category-link").evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().height)));
  const hasOldProviderBadge = await page.getByText("provider-backed", { exact: true }).count();

  await search.fill("vision");
  const filteredCards = await cards.count();
  await search.fill("");
  await page.getByRole("button", { name: "Generate artifacts" }).click();
  const generatePressed = await page.getByRole("button", { name: "Generate artifacts" }).getAttribute("aria-pressed");
  const categoryCards = await cards.count();

  await page.goto(`${baseUrl}/experiments/explain-stacktrace`, { waitUntil: "networkidle" });
  const emptyState = await page.getByRole("heading", { name: "No result yet" }).isVisible();
  const workspaceOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  const runButtonVisible = await page.getByRole("button", { name: /^Run$/ }).isVisible();

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  checks.push({ name, cards: await cards.count(), filteredCards, categoryCards, generatePressed, overflow, workspaceOverflow, categoryScroll, categoryHintVisible, touchHeights, hasOldProviderBadge, emptyState, runButtonVisible, consoleErrors, failedRequests });
  await context.close();
}

await browser.close();
for (const check of checks) console.log(JSON.stringify(check));
const failed = checks.some((check) => check.overflow || check.workspaceOverflow || check.cards !== 10 || check.filteredCards !== 1 || check.categoryCards !== 3 || check.generatePressed !== "true" || check.hasOldProviderBadge || !check.emptyState || !check.runButtonVisible || check.consoleErrors.length || check.failedRequests.length || (check.name === "mobile" && check.touchHeights.some((height) => height < 44)));
if (failed) process.exit(1);
