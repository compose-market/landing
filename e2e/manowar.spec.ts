import { expect, test } from "@playwright/test";

async function ready(page: import("@playwright/test").Page, marker: string, expectScene = true) {
  for (let i = 0; i < 80; i += 1) {
    const ok = await page.evaluate(({ text, expectScene }) => {
      const canvas = document.querySelector("canvas");
      const heading = document.querySelector("h1");
      const hero = document.querySelector(".hero");
      return (!expectScene || (canvas instanceof HTMLCanvasElement && hero?.getAttribute("data-renderer") === "three-webgl")) &&
        Boolean(heading?.textContent?.includes(text));
    }, { text: marker, expectScene }).catch(() => false);

    if (ok) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error("Scene did not mount");
}

test("manowar page renders the agent landing with moved copy", async ({ page }) => {
  await page.goto("/manowar/?test=1");
  await ready(page, "AUTONOMY");

  const mounted = await page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent ?? "",
    primary: document.querySelector<HTMLAnchorElement>(".primary")?.textContent ?? "",
    primaryHref: document.querySelector<HTMLAnchorElement>(".primary")?.href ?? "",
    secondary: document.querySelector<HTMLAnchorElement>(".secondary")?.textContent ?? ""
  }));

  expect(mounted.heading).toContain("AUTONOMY");
  expect(mounted.primary).toContain("Mint an Agent");
  expect(mounted.primaryHref).toBe("https://app.compose.market/create-agent");
  expect(mounted.secondary).toContain("Build with Manowar");

  // Moved agent blocks are present
  await expect(page.locator("[data-organism-dot]")).toHaveCount(2);
  await expect(page.locator(".composer")).toHaveCount(1);
  await expect(page.locator(".final")).toContainText("MINT AN");

  // Metrics and partners stay on the main page only
  await expect(page.locator("[data-metric]")).toHaveCount(0);
  await expect(page.locator("[data-partner-marquee]")).toHaveCount(0);
});

test("navdock swaps route-specific content without reloading the shell", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page, "FINANCIAL RAILS");

  const tabs = page.locator(".cm-app-chrome__navitem");
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveAttribute("href", "/");
  await expect(tabs.nth(0)).toHaveAttribute("aria-current", "page");
  await expect(tabs.nth(1)).toHaveAttribute("href", "/manowar/");
  await expect(tabs.nth(1)).not.toHaveAttribute("aria-current", "page");

  // The shell persists while route content and the Manowar scene are swapped.
  await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".shell");
    if (shell) {
      shell.dataset.persist = "shell";
    }
  });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator('canvas[data-scene-canvas="inference"]')).toHaveCount(1);
  await expect(page.locator('[data-ambient-rail-layer="inference"]')).toHaveCount(1);

  await tabs.nth(1).click();
  await expect(page).toHaveURL(/\/manowar\/$/);
  await ready(page, "AUTONOMY");
  await expect(page.locator("h1")).toContainText("AUTONOMY");
  await expect(tabs.nth(1)).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".composer")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator('canvas[data-scene-canvas="inference"]')).toHaveCount(0);
  await expect(page.locator('[data-ambient-rail-layer="inference"]')).toHaveCount(0);
  await expect(page.locator('[data-rail-layer="inference"]')).toHaveCount(0);
  await expect(page.locator(".shell")).toHaveAttribute("data-scene", "manowar");
  await expect(page.locator(".shell")).toHaveAttribute("data-persist", "shell");
  expect(await page.title()).toContain("financial rails of AI autonomy");

  // Paginate back to the inference page — still no reload.
  await tabs.nth(0).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("h1")).toContainText("FINANCIAL RAILS");
  await expect(tabs.nth(0)).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-metric]")).toHaveCount(4);
  await ready(page, "FINANCIAL RAILS");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator('canvas[data-scene-canvas="inference"]')).toHaveCount(1);
  await expect(page.locator('[data-ambient-rail-layer="inference"]')).toHaveCount(1);
  await expect(page.locator(".shell")).toHaveAttribute("data-scene", "inference");
  await expect(page.locator(".shell")).toHaveAttribute("data-persist", "shell");
  expect(await page.title()).toContain("Inference");

  // History navigation follows the same pagination.
  await page.goBack();
  await expect(page).toHaveURL(/\/manowar\/$/);
  await ready(page, "AUTONOMY");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator('canvas[data-scene-canvas="inference"]')).toHaveCount(0);
  await expect(page.locator('[data-ambient-rail-layer="inference"]')).toHaveCount(0);
  await expect(page.locator(".shell")).toHaveAttribute("data-scene", "manowar");
});
