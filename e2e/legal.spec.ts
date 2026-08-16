import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("compose_consent_v1", JSON.stringify({ preference: "essential", timestamp: new Date(0).toISOString() }));
  });
});

for (const route of [
  { path: "/terms/", heading: "TERMS OF SERVICE", title: "Terms of Service" },
  { path: "/privacy/", heading: "PRIVACY POLICY", title: "Privacy Policy" }
]) {
  test(`${route.title} keeps document chrome fixed and scrolls only its themed container`, async ({ page }) => {
    await page.goto(`${route.path}?test=1`);

    await expect(page.locator(".legal-panel h1")).toContainText(route.heading);
    await expect(page).toHaveTitle(new RegExp(route.title));
    await expect(page.locator(".legal-container.cm-glass.neon-border.cm-cell")).toHaveCount(1);
    await expect(page.locator("canvas")).toHaveCount(0);

    const initial = await page.evaluate(() => {
      const outer = document.querySelector<HTMLElement>(".scroll");
      const panel = document.querySelector<HTMLElement>(".legal-panel");
      const container = document.querySelector<HTMLElement>(".legal-container");
      const paragraphs = [...document.querySelectorAll(".legal-panel p")];

      if (!outer || !panel || !container) throw new Error("Legal layout did not mount");

      return {
        viewportHeight: window.innerHeight,
        panelHeight: panel.getBoundingClientRect().height,
        outerOverflowY: getComputedStyle(outer).overflowY,
        outerScrollTop: outer.scrollTop,
        containerOverflowY: getComputedStyle(container).overflowY,
        containerClientHeight: container.clientHeight,
        containerScrollHeight: container.scrollHeight,
        allParagraphsInsideContainer: paragraphs.every((paragraph) => container.contains(paragraph))
      };
    });

    expect(Math.abs(initial.panelHeight - initial.viewportHeight)).toBeLessThanOrEqual(1);
    expect(initial.outerOverflowY).toBe("hidden");
    expect(initial.outerScrollTop).toBe(0);
    expect(initial.containerOverflowY).toBe("auto");
    expect(initial.containerScrollHeight).toBeGreaterThan(initial.containerClientHeight);
    expect(initial.allParagraphsInsideContainer).toBe(true);

    await page.locator(".legal-container").evaluate((container) => {
      container.scrollTop = container.scrollHeight;
    });

    const scrolled = await page.evaluate(() => ({
      outer: document.querySelector<HTMLElement>(".scroll")?.scrollTop ?? -1,
      container: document.querySelector<HTMLElement>(".legal-container")?.scrollTop ?? 0
    }));

    expect(scrolled.outer).toBe(0);
    expect(scrolled.container).toBeGreaterThan(0);
  });
}

test("legal footer navigation swaps PageModules without replacing the persistent shell", async ({ page }, info) => {
  test.skip(info.project.name === "mobile");
  await page.goto("/terms/?test=1");
  await expect(page.locator(".legal-panel h1")).toContainText("TERMS OF SERVICE");

  await page.locator(".shell").evaluate((shell) => {
    shell.setAttribute("data-persist", "legal-shell");
  });

  await page.locator('.footer [data-page-link="privacy"]').click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page.locator(".legal-panel h1")).toContainText("PRIVACY POLICY");
  await expect(page.locator(".shell")).toHaveAttribute("data-persist", "legal-shell");
  await expect(page.locator("canvas")).toHaveCount(0);
});
