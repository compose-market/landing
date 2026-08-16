import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("compose_consent_v1", JSON.stringify({ preference: "essential", timestamp: new Date(0).toISOString() }));
  });
});

async function ready(page: import("@playwright/test").Page) {
  for (let i = 0; i < 80; i += 1) {
    const ok = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const heading = document.querySelector("h1");
      const hero = document.querySelector(".hero");
      return canvas instanceof HTMLCanvasElement &&
        hero?.getAttribute("data-renderer") === "three-webgl" &&
        Boolean(heading?.textContent?.includes("FINANCIAL RAILS"));
    }).catch(() => false);

    if (ok) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error("Landing page did not mount");
}

async function scrollInfo(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>(".scroll");
    const panels = [...document.querySelectorAll<HTMLElement>(".panel")];

    if (!scroller) {
      throw new Error("Missing scroll container");
    }

    return {
      snap: getComputedStyle(scroller).scrollSnapType,
      top: Math.round(scroller.scrollTop),
      width: Math.round(scroller.scrollWidth),
      clientWidth: Math.round(scroller.clientWidth),
      height: Math.round(scroller.clientHeight),
      panels: panels.map((panel) => {
        const rect = panel.getBoundingClientRect();
        return {
          cls: panel.className,
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          width: Math.round(rect.width)
        };
      })
    };
  });
}

async function scrollToPanel(page: import("@playwright/test").Page, selector: string) {
  await page.evaluate((targetSelector) => {
    const scroller = document.querySelector<HTMLElement>(".scroll");
    const target = document.querySelector<HTMLElement>(targetSelector);

    if (!scroller || !target) {
      throw new Error(`Missing scroll target: ${targetSelector}`);
    }

    scroller.scrollTo({ top: target.offsetTop, behavior: "instant" });
  }, selector);
  await page.waitForTimeout(650);
}

test("desktop and mobile render the inference landing", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);
  const mounted = await page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent ?? "",
    market: document.querySelector<HTMLAnchorElement>(".primary")?.textContent ?? "",
    compose: document.querySelector<HTMLAnchorElement>(".secondary")?.textContent ?? "",
    canvas: document.querySelector("canvas") instanceof HTMLCanvasElement
  }));
  expect(mounted.heading).toContain("FINANCIAL RAILS");
  expect(mounted.market).toContain("Set your Key");
  expect(mounted.compose).toContain("Inference Docs");
  expect(mounted.canvas).toBe(true);
  await expect(page.locator(".hero")).toHaveAttribute("data-renderer", "three-webgl");
});

test("model count and metric glyphs use the requested live sources", async ({ page }) => {
  await page.route("https://models.compose.market/health", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ service: "models", ok: true, models: 750 })
  }));
  await page.goto("/?test=1");

  const models = page.locator('[data-metric="models"]');
  const downloads = page.locator('[data-metric="downloads"]');
  await expect(models.locator(".stat-label")).toHaveText("Models Served");
  await expect(models.locator("strong")).toHaveText("750");
  await expect(page.locator('[data-metric="agents"]')).toHaveCount(0);

  const paths = async (selector: string) => page.locator(selector).locator("path").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("d"))
  );
  expect(await paths('[data-metric="models"] .stat-icon svg')).toEqual(
    await paths('.workflow-panel .hero-chip:has-text("Model Analytics") svg')
  );
  expect(await paths('[data-metric="downloads"] .stat-icon svg')).toEqual(
    await paths('.card-c .hero-chip:has-text("SDK") svg')
  );
  await expect(downloads.locator(".stat-label")).toHaveText("SDK Downloads");
});

test("normal production frames omit test instrumentation", async ({ page }) => {
  await page.goto("/");
  await ready(page);

  const canvas = page.locator('canvas[data-scene-canvas="inference"]');
  await expect(canvas).not.toHaveAttribute("data-particle-spread", /.+/);
  await expect(canvas).not.toHaveAttribute("data-active-circuits", /.+/);
  await expect(canvas).not.toHaveAttribute("data-ambient-circuits", /.+/);
});

test("ambient rails cross behind the cube without drawing a rectangular frame", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);

  const paths = await page.locator('[data-ambient-rail="true"] .inference-ambient-rail__trace').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("d") ?? "")
  );
  expect(paths.length).toBeGreaterThan(12);
  for (const path of paths) {
    const horizontal = (path.match(/H/g) ?? []).length;
    const vertical = (path.match(/V/g) ?? []).length;
    expect(horizontal > 1 && vertical > 1).toBe(false);
  }
});

test("rapid target changes keep one egress source and one precise outward cubie", async ({ page }, info) => {
  await page.goto("/?test=1");
  await ready(page);

  const canvas = page.locator('canvas[data-scene-canvas="inference"]');
  const first = page.locator(info.project.name === "mobile" ? ".primary" : ".card-a");
  const second = page.locator(info.project.name === "mobile" ? ".secondary" : ".card-d");
  const activate = async (target: typeof first) => {
    if (info.project.name === "mobile") {
      await target.focus();
    } else {
      const box = await target.boundingBox();
      if (!box) throw new Error("Missing interaction target");
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    }
  };

  await activate(first);
  const egress = page.locator('[data-rail-layer="inference"] [data-direction="egress"]');
  await expect.poll(() => egress.count()).toBeGreaterThanOrEqual(2);
  const firstCubie = await canvas.getAttribute("data-active-cubie");
  expect(firstCubie).not.toBe("none");
  expect(new Set(await egress.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-cubie-index"))))).toEqual(
    new Set([firstCubie])
  );
  const retiringRails = await egress.elementHandles();

  await activate(second);
  expect(await Promise.all(retiringRails.map((rail) => rail.evaluate((node) => node.isConnected)))).not.toContain(false);
  await expect.poll(() => canvas.getAttribute("data-active-cubie")).not.toBe(firstCubie);
  const secondCubie = await canvas.getAttribute("data-active-cubie");
  expect(secondCubie).not.toBe("none");
  const secondEgress = page.locator(`[data-rail-layer="inference"] [data-direction="egress"][data-cubie-index="${secondCubie}"]`);
  await expect.poll(() => secondEgress.count()).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(160);
  expect(Number(await canvas.getAttribute("data-outward-cubies"))).toBeLessThanOrEqual(1);

  const currentRails = await secondEgress.elementHandles();
  if (info.project.name === "mobile") {
    await second.focus();
  } else {
    const box = await second.boundingBox();
    if (!box) throw new Error("Missing interaction target");
    await page.mouse.move(box.x + box.width * 0.58, box.y + box.height * 0.58);
  }
  await page.waitForTimeout(100);
  await expect.poll(() => secondEgress.count()).toBeGreaterThanOrEqual(2);
  expect(await Promise.all(currentRails.map((rail) => rail.evaluate((node) => node.isConnected)))).not.toContain(false);
});

test("native glass cubies light and move out of the assembly", async ({ page }, info) => {
  await page.goto("/?test=1");
  await ready(page);

  const canvas = page.locator('canvas[data-scene-canvas="inference"]');
  await expect(canvas).toHaveAttribute("data-geometry", "native-3d");
  await expect(canvas).toHaveAttribute("data-cubie-count", "27");
  await expect(canvas).toHaveAttribute("data-particle-count", "72");
  await expect(canvas).toHaveAttribute("data-circuit-mode", "pointer-driven");
  await expect(page.locator('[data-ambient-rail-layer="inference"]')).toHaveCount(1);
  await expect.poll(async () => Number(await canvas.getAttribute("data-ambient-circuits"))).toBeGreaterThan(0);
  const idleSpread = Number(await canvas.getAttribute("data-particle-spread"));
  expect(idleSpread).toBeGreaterThan(0.8);

  const viewport = page.viewportSize();
  const x = (viewport?.width ?? 1) * 0.5;
  const y = info.project.name === "mobile"
    ? Number(await canvas.getAttribute("data-scene-center-y"))
    : (viewport?.height ?? 1) * 0.5;

  if (info.project.name === "mobile") {
    await page.touchscreen.tap(x, y);
  } else {
    await page.evaluate(() => {
      const sceneCanvas = document.querySelector<HTMLCanvasElement>('canvas[data-scene-canvas="inference"]');
      const samples: number[] = [];
      const timer = window.setInterval(() => {
        samples.push(Number(sceneCanvas?.dataset.particleSpread));
      }, 20);

      window.setTimeout(() => {
        window.clearInterval(timer);
        if (sceneCanvas) {
          sceneCanvas.dataset.testMinimumSpread = String(Math.min(...samples));
        }
      }, 900);
    });
    await page.mouse.move(x, y);
  }

  await expect(canvas).not.toHaveAttribute("data-active-cubie", "none");
  let gatheredSpread = idleSpread;

  if (info.project.name !== "mobile") {
    await expect(canvas).toHaveAttribute("data-test-minimum-spread", /\d/, { timeout: 2_000 });
    gatheredSpread = Number(await canvas.getAttribute("data-test-minimum-spread"));
  }

  await expect(canvas).toHaveAttribute("data-rail-direction", "ingress");
  await expect.poll(async () => Number(await canvas.getAttribute("data-active-offset"))).toBeGreaterThan(0.08);
  await expect.poll(async () => Number(await canvas.getAttribute("data-active-circuits"))).toBeGreaterThan(0);
  await expect(page.locator('[data-rail-layer="inference"] [data-direction="ingress"]')).not.toHaveCount(0);

  if (info.project.name === "mobile") {
    await expect(canvas).toHaveAttribute("data-active-cubie", "none", { timeout: 4_000 });
    await expect.poll(async () => Number(await canvas.getAttribute("data-particle-spread")), { timeout: 5_000 })
      .toBeGreaterThan(idleSpread * 0.72);
  } else {
    expect(gatheredSpread).toBeLessThan(idleSpread * 0.9);
    await expect.poll(async () => Number(await canvas.getAttribute("data-particle-spread")), { timeout: 5_000 })
      .toBeGreaterThan(Math.max(gatheredSpread * 1.08, idleSpread * 0.88));
    await expect(canvas).not.toHaveAttribute("data-active-cubie", "none");
    await page.mouse.move(8, 8);
    await expect(canvas).toHaveAttribute("data-active-cubie", "none");
    await expect.poll(async () => Number(await canvas.getAttribute("data-active-offset"))).toBeLessThan(0.02);
    await page.locator(".primary").hover();
    await expect(canvas).toHaveAttribute("data-rail-direction", "egress");
    await expect.poll(async () => Number(await canvas.getAttribute("data-active-circuits"))).toBeGreaterThan(0);
    await expect(page.locator('[data-rail-layer="inference"] [data-direction="egress"]')).not.toHaveCount(0);
  }
});

test("reduced motion keeps particles dispersed and disables ambient propagation", async ({ page }) => {
  await page.goto("/?test=1&motion=reduce");
  await ready(page);

  const canvas = page.locator('canvas[data-scene-canvas="inference"]');
  await expect(page.locator(".shell")).toHaveAttribute("data-motion", "reduce");
  await expect(canvas).toHaveAttribute("data-ambient-circuits", "0");
  await expect(page.locator('[data-ambient-rail="true"]')).toHaveCount(0);
  await expect.poll(async () => Number(await canvas.getAttribute("data-particle-spread"))).toBeGreaterThan(0.8);
  await page.waitForTimeout(1_100);
  await expect(canvas).toHaveAttribute("data-ambient-circuits", "0");
});

test("small hero scenes center in the content gap and keep their backgrounds moving", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");

  for (const viewport of [{ width: 412, height: 915 }, { width: 360, height: 640 }]) {
    await page.setViewportSize(viewport);

    for (const route of ["/", "/manowar/"]) {
      await page.goto(`${route}?test=1`);
      const canvas = page.locator(`canvas[data-scene-canvas="${route === "/" ? "inference" : "manowar"}"]`);
      await expect(canvas).toBeAttached();

      const geometry = await page.evaluate(() => {
        const title = document.querySelector<HTMLElement>(".hero-title")?.getBoundingClientRect();
        const description = document.querySelector<HTMLElement>(".protocol")?.getBoundingClientRect();
        const sceneCanvas = document.querySelector<HTMLCanvasElement>("canvas[data-scene-canvas]");
        return {
          expected: title && description ? (title.bottom + description.top) * 0.5 : 0,
          actual: Number(sceneCanvas?.dataset.sceneCenterY)
        };
      });

      expect(Math.abs(geometry.actual - geometry.expected)).toBeLessThan(2);

      if (route === "/") {
        const packet = page.locator("[data-ambient-rail-layer] .inference-ambient-rail__packet").first();
        await expect(packet).toBeAttached();
        const before = await packet.evaluate((node) => node.style.strokeDashoffset);
        await page.waitForTimeout(450);
        const after = await packet.evaluate((node) => node.style.strokeDashoffset);
        expect(after).not.toBe(before);
      } else {
        const before = Number(await canvas.getAttribute("data-binary-pulse-x"));
        await page.waitForTimeout(450);
        const after = Number(await canvas.getAttribute("data-binary-pulse-x"));
        expect(Math.abs(after - before)).toBeGreaterThan(1);
      }
    }
  }
});

test("reduced motion disables the Manowar binary pulse", async ({ page }) => {
  await page.goto("/manowar/?test=1&motion=reduce");
  const canvas = page.locator('canvas[data-scene-canvas="manowar"]');
  await expect(canvas).toHaveAttribute("data-binary-pulse-x", "none");
  await page.waitForTimeout(500);
  await expect(canvas).toHaveAttribute("data-binary-pulse-x", "none");
});

test("workflow steps share the mobile inset on both routes", async ({ page }) => {
  for (const route of ["/", "/manowar/"]) {
    await page.goto(`${route}?test=1`);
    const geometry = await page.locator(".workflow").evaluate((workflow) => {
      const firstColumn = workflow.firstElementChild?.getBoundingClientRect();
      const steps = workflow.querySelector<HTMLElement>(".steps")?.getBoundingClientRect();
      const card = workflow.getBoundingClientRect();
      return {
        inset: firstColumn ? firstColumn.left - card.left : 0,
        stepsLeft: steps && firstColumn ? steps.left - firstColumn.left : 0,
        stepsRight: steps && firstColumn ? steps.right - firstColumn.right : 0
      };
    });

    expect(geometry.inset).toBeGreaterThan(15);
    expect(geometry.inset).toBeLessThan(18);
    expect(Math.abs(geometry.stepsLeft)).toBeLessThan(1);
    expect(Math.abs(geometry.stepsRight)).toBeLessThan(1);
  }
});

test("workflow band shows the dashboard showcase instead of code cards", async ({ page }) => {
  await page.goto("/?test=1", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".workflow .dash-demo")).toHaveCount(1);
  await expect(page.locator(".workflow .dd-header")).toContainText("Dashboard");
  await expect(page.locator(".workflow .dd-stat")).toHaveCount(5);
  await expect(page.locator(".workflow .dd-block")).toHaveCount(3);
  await expect(page.locator(".workflow .dd-table tbody tr")).toHaveCount(5);
  await expect(page.locator(".workflow .dd-feed__item").first()).toContainText("Qwen3.8-Max");
  await expect(page.locator(".workflow .code-card")).toHaveCount(0);
});

test("hero rich copy exposes code, numeric accents, and inference chips", async ({ page }) => {
  await page.goto("/?test=1", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".card-c .hero-code")).toHaveText("npm i @compose-market/sdk");
  const modelChips = page.locator(".card-a .hero-chip");
  await expect(modelChips).toHaveCount(3);
  await expect(modelChips.nth(0)).toContainText("LLM");
  await expect(modelChips.nth(1)).toContainText("Media");
  await expect(modelChips.nth(2)).toContainText("Embeddings");
  expect(await page.locator(".hero-number").count()).toBeGreaterThanOrEqual(3);

  const copy = await page.locator(".hero").textContent();
  expect(copy).not.toContain("*any*");
  expect(copy).not.toContain("'*");
  expect(copy).not.toContain("'npm");

  const layout = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    const visibleFloats = [...document.querySelectorAll<HTMLElement>(".float-card")]
      .filter((node) => getComputedStyle(node).display !== "none")
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          scrollWidth: node.scrollWidth,
          scrollHeight: node.scrollHeight
        };
      });

    return {
      heroClientWidth: hero?.clientWidth ?? 0,
      heroScrollWidth: hero?.scrollWidth ?? 0,
      visibleFloats
    };
  });

  expect(layout.heroScrollWidth).toBeLessThanOrEqual(layout.heroClientWidth + 1);
  for (const card of layout.visibleFloats) {
    expect(card.scrollWidth).toBeLessThanOrEqual(card.width + 2);
    expect(card.scrollHeight).toBeLessThanOrEqual(card.height + 6);
  }
});

test("snap sections fill the viewport without stale selected states", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);

  const info = await scrollInfo(page);
  expect(info.snap).toContain("mandatory");
  expect(info.width).toBeLessThanOrEqual(info.clientWidth + 1);

  for (const panel of info.panels) {
    expect(panel.height).toBe(info.height);
  }

  await expect(page.locator('[data-state="active"]')).toHaveCount(0);
  await expect(page.locator(".rail")).toHaveCount(0);
});

test("scrolling lands on panel snap points", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);

  const viewport = page.viewportSize();
  const height = viewport?.height ?? 900;

  for (const offset of [height * 0.66, height * 1.66, height * 2.66, height * 3.66]) {
    await page.evaluate((top) => document.querySelector<HTMLElement>(".scroll")?.scrollTo({ top, behavior: "instant" }), offset);
    await page.waitForTimeout(520);
    const top = await page.evaluate(() => Math.round(document.querySelector<HTMLElement>(".scroll")?.scrollTop ?? -1));
    expect(Math.abs(top / height - Math.round(top / height))).toBeLessThan(0.04);
  }
});

test("partner badges tightly and responsively fill their frames", async ({ page }, info) => {
  const viewports = info.project.name === "mobile"
    ? [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 412, height: 915 }]
    : [{ width: 768, height: 700 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/?test=1");
    await ready(page);
    await scrollToPanel(page, ".partners-panel");
    await expect(page.locator(".cm-partner-badge img")).toHaveCount(2);
    await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".cm-partner-badge img")]
      .every((node) => node.complete && node.naturalWidth > 0));

    const layout = await page.locator(".cm-partner-badge img").evaluateAll((nodes) => nodes.map((node) => {
      const badgeImage = node as HTMLImageElement;
      const image = badgeImage.getBoundingClientRect();
      const frameNode = node.closest<HTMLElement>(".cm-partner-badge");
      const group = node.closest<HTMLElement>(".cm-partners__badges");
      const frame = frameNode?.getBoundingClientRect();
      const style = frameNode ? getComputedStyle(frameNode) : null;
      const borderX = style ? parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth) : 0;
      const borderY = style ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) : 0;
      return {
        alt: badgeImage.alt,
        declaredWidth: Number(badgeImage.getAttribute("width")),
        declaredHeight: Number(badgeImage.getAttribute("height")),
        naturalRatio: badgeImage.naturalWidth / badgeImage.naturalHeight,
        renderedRatio: image.width / image.height,
        widthGap: frame ? Math.abs(frame.width - borderX - image.width) : Infinity,
        heightGap: frame ? Math.abs(frame.height - borderY - image.height) : Infinity,
        insideFrame: frame
          ? image.left >= frame.left && image.right <= frame.right && image.top >= frame.top && image.bottom <= frame.bottom
          : false,
        groupOverflow: group ? group.scrollWidth - group.clientWidth : Infinity
      };
    }));

    expect(layout.map((badge) => badge.alt)).toEqual([
      "NVIDIA Inception Program",
      "Microsoft for Startups"
    ]);
    for (const badge of layout) {
      expect(badge.declaredWidth).toBeGreaterThan(0);
      expect(badge.declaredHeight).toBeGreaterThan(0);
      expect(badge.widthGap).toBeLessThanOrEqual(1);
      expect(badge.heightGap).toBeLessThanOrEqual(1);
      expect(Math.abs(badge.renderedRatio - badge.naturalRatio)).toBeLessThan(0.01);
      expect(badge.insideFrame).toBe(true);
      expect(badge.groupOverflow).toBeLessThanOrEqual(1);
    }
  }
});

test("partner logos match the web home tile treatment", async ({ page }, info) => {
  await page.goto("/?test=1");
  await ready(page);
  await scrollToPanel(page, ".partners-panel");
  await expect(page.locator(".cm-partner-logo img").first()).toBeVisible();

  const unique = await page.locator(".cm-partner-logo img").evaluateAll((nodes) => {
    return [...new Set(nodes.map((node) => node.getAttribute("alt") ?? ""))];
  });

  expect(unique).not.toContain("Hugging Face");
  expect(unique).not.toContain("LangChain");
  expect(unique).not.toContain("Qdrant");

  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>(".cm-marquee-track, .cm-marquee-track-reverse").forEach((node) => {
      node.style.animation = "none";
      node.style.animationPlayState = "paused";
      node.style.transform = "translate3d(0, 0, 0)";
    });
  });

  const logo = page.locator(".cm-partner-logo").first();
  const img = logo.locator("img");
  const rest = await img.evaluate((node) => {
    const tile = node.closest(".cm-partner-logo");
    const tileStyle = tile ? getComputedStyle(tile) : null;
    const style = getComputedStyle(node);
    return {
      background: tileStyle?.backgroundColor ?? "",
      filter: style.filter,
      opacity: style.opacity
    };
  });

  expect(rest.background).toContain("rgba");
  expect(rest.filter).toContain("grayscale(1)");
  expect(Number(rest.opacity)).toBeLessThan(0.8);

  if (info.project.name !== "mobile") {
    await logo.hover();
    await page.waitForTimeout(500);
    const hover = await img.evaluate((node) => {
      const tile = node.closest(".cm-partner-logo");
      const tileStyle = tile ? getComputedStyle(tile) : null;
      const style = getComputedStyle(node);
      return {
        shadow: tileStyle?.boxShadow ?? "",
        filter: style.filter,
        opacity: style.opacity
      };
    });

    expect(hover.shadow).not.toBe("none");
    expect(hover.filter).toContain("grayscale(0)");
    expect(Number(hover.opacity)).toBeGreaterThan(0.95);
  }
});

test("mobile footers keep only external links and copyright in one row", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");

  for (const viewport of [{ width: 320, height: 568 }, { width: 412, height: 915 }]) {
    await page.setViewportSize(viewport);

    for (const route of ["/", "/terms/"]) {
      await page.goto(`${route}?test=1`);
      if (route === "/") {
        await ready(page);
        await scrollToPanel(page, ".final-panel");
      }

      const footer = page.locator(".footer");
      await expect(footer).toBeVisible();
      await expect(footer.locator("a:visible")).toHaveText(["Docs", "GitHub", "X"]);
      await expect(footer.locator("[data-page-link]:visible")).toHaveCount(0);

      const layout = await footer.evaluate((node) => {
        const nav = node.querySelector("nav")?.getBoundingClientRect();
        const links = [...node.querySelectorAll<HTMLAnchorElement>("nav a")]
          .filter((link) => getComputedStyle(link).display !== "none")
          .map((link) => link.getBoundingClientRect());
        const copyright = node.querySelector(":scope > span")?.getBoundingClientRect();
        const bounds = node.getBoundingClientRect();
        return {
          display: getComputedStyle(node).display,
          direction: getComputedStyle(node).flexDirection,
          fontSize: parseFloat(getComputedStyle(node).fontSize),
          sameRow: nav && copyright ? Math.abs((nav.top + nav.height / 2) - (copyright.top + copyright.height / 2)) : Infinity,
          linkGaps: links.slice(1).map((link, index) => link.left - links[index]!.right),
          overflow: node.scrollWidth - node.clientWidth,
          contained: nav && copyright
            ? nav.left >= bounds.left && copyright.right <= bounds.right
            : false
        };
      });

      expect(layout.display).toBe("flex");
      expect(layout.direction).toBe("row");
      expect(layout.fontSize).toBeGreaterThanOrEqual(10.8);
      expect(layout.sameRow).toBeLessThanOrEqual(1);
      expect(Math.max(...layout.linkGaps)).toBeLessThanOrEqual(layout.fontSize * 1.1);
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.contained).toBe(true);
    }
  }
});

test("mobile navdock keeps active buttons without the outer halo", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/?test=1");
  await ready(page);

  const navItems = page.locator(".cm-app-chrome__navitem");
  await expect(navItems).toHaveCount(2);
  const styles = await navItems.evaluateAll((nodes) => nodes.map((node) => ({
    halo: getComputedStyle(node, "::before").display,
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
    active: node.getAttribute("data-active")
  })));

  expect(styles.every((style) => style.halo === "none")).toBe(true);
  expect(styles.every((style) => style.width > 35 && style.height > 35)).toBe(true);
  expect(styles.some((style) => style.active === "true")).toBe(true);
});

test("calls to action remain clickable", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);

  await expect(page.locator(".primary")).toHaveAttribute("href", "https://app.compose.market/keys");
  await page.locator(".primary").evaluate((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      (node as HTMLElement).dataset.clicked = "true";
    }, { once: true });
  });
  await page.locator(".primary").click();
  await expect(page.locator(".primary")).toHaveAttribute("data-clicked", "true");
});
