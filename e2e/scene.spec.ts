import { expect, test } from "@playwright/test";

async function ready(page: import("@playwright/test").Page) {
  for (let i = 0; i < 80; i += 1) {
    const ok = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const heading = document.querySelector("h1");
      const hero = document.querySelector(".hero");
      return canvas instanceof HTMLCanvasElement &&
        hero?.getAttribute("data-renderer") === "three-webgl" &&
        Boolean(heading?.textContent?.includes("AUTONOMY"));
    }).catch(() => false);

    if (ok) {
      return;
    }

    await page.waitForTimeout(100);
  }

  throw new Error("Scene did not mount");
}

async function bounds(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Missing canvas");
    }

    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
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

async function sum(page: import("@playwright/test").Page, x: number, y: number, w = 90, h = 90) {
  return page.evaluate(
    (box) => {
      const node = document.querySelector("canvas");

      if (!(node instanceof HTMLCanvasElement)) {
        return 0;
      }

      const gl = node.getContext("webgl2", { preserveDrawingBuffer: true }) ?? node.getContext("webgl", { preserveDrawingBuffer: true });

      if (!gl) {
        return 0;
      }

      const rect = node.getBoundingClientRect();
      const sx = gl.drawingBufferWidth / rect.width;
      const sy = gl.drawingBufferHeight / rect.height;
      const x = Math.max(0, Math.min(gl.drawingBufferWidth - 1, Math.floor(box.x * sx)));
      const h = Math.max(1, Math.min(gl.drawingBufferHeight, Math.floor(box.h * sy)));
      const y = Math.max(0, Math.min(gl.drawingBufferHeight - h, Math.floor(gl.drawingBufferHeight - (box.y + box.h) * sy)));
      const w = Math.max(1, Math.min(gl.drawingBufferWidth - x, Math.floor(box.w * sx)));
      const data = new Uint8Array(w * h * 4);
      gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let total = 0;

      for (let i = 0; i < data.length; i += 64) {
        total += data[i] + data[i + 1] + data[i + 2] + data[i + 3];
      }

      return total;
    },
    { x, y, w, h }
  );
}

test("desktop and mobile render the landing scene", async ({ page }, info) => {
  await page.goto("/?test=1");
  await ready(page);
  const mounted = await page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent ?? "",
    market: document.querySelector<HTMLAnchorElement>(".primary")?.textContent ?? "",
    compose: document.querySelector<HTMLAnchorElement>(".secondary")?.textContent ?? "",
    canvas: document.querySelector("canvas") instanceof HTMLCanvasElement
  }));
  expect(mounted.heading).toContain("AUTONOMY");
  expect(mounted.market).toContain("Explore Market");
  expect(mounted.compose).toContain("Build with Manowar");
  expect(mounted.canvas).toBe(true);
  await expect(page.locator(".hero")).toHaveAttribute("data-renderer", "three-webgl");
  await page.waitForTimeout(600);

  const rect = await bounds(page);
  const painted = await sum(page, rect.width * 0.4, rect.height * 0.18, 320, 220);
  expect(painted).toBeGreaterThan(20_000);
});

test("poster fallback starts at the same scale as the WebGL scene", async ({ page }) => {
  await page.route(/\/src\/scene\.ts(\?.*)?$/, (route) => route.abort());
  await page.goto("/?test=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".scene-poster__head")).toBeVisible();

  const snapshot = await page.evaluate(() => {
    const head = document.querySelector<HTMLElement>(".scene-poster__head");
    const sheet = document.querySelector<HTMLElement>(".scene-poster__tentacles");
    const hero = document.querySelector<HTMLElement>(".hero");

    if (!head || !sheet || !hero) {
      throw new Error("Missing poster elements");
    }

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const wide = window.innerWidth >= 860;
    const bodyWidth = clamp(window.innerWidth * (wide ? 0.414 : 0.738), 288, 630);
    const expectedHeadWidth = bodyWidth * 0.9;
    const headRect = head.getBoundingClientRect();
    const headStyle = getComputedStyle(head);
    const sheetStyle = getComputedStyle(sheet);

    return {
      headWidth: Number.parseFloat(headStyle.width) || headRect.width,
      expectedHeadWidth,
      sheetWidth: Number.parseFloat(sheetStyle.width),
      expectedSheetWidth: bodyWidth,
      heroClientWidth: hero.clientWidth,
      heroScrollWidth: hero.scrollWidth,
      bodyScrollWidth: document.documentElement.scrollWidth
    };
  });

  expect(Math.abs(snapshot.headWidth - snapshot.expectedHeadWidth)).toBeLessThan(3);
  expect(Math.abs(snapshot.sheetWidth - snapshot.expectedSheetWidth)).toBeLessThan(3);
  expect(snapshot.heroScrollWidth).toBeLessThanOrEqual(snapshot.heroClientWidth + 1);
  expect(snapshot.bodyScrollWidth).toBeLessThanOrEqual((page.viewportSize()?.width ?? snapshot.bodyScrollWidth) + 1);
});

test("hero rich copy exposes code, numeric accents, and inference chips", async ({ page }) => {
  await page.goto("/?test=1", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".hero-code")).toHaveText("npm i -g @compose-market/sdk");
  await expect(page.locator(".hero-chip")).toHaveCount(3);
  await expect(page.locator(".hero-chip").nth(0)).toContainText("Reasoning");
  await expect(page.locator(".hero-chip").nth(1)).toContainText("Media-gen");
  await expect(page.locator(".hero-chip").nth(2)).toContainText("Embeddings");
  await expect(page.locator(".hero-number")).toHaveCount(8);

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

test("partner badges use NVIDIA and Microsoft and fill their frames", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);
  await scrollToPanel(page, ".partners-panel");
  await expect(page.locator(".cm-partner-badge img")).toHaveCount(2);
  await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".cm-partner-badge img")]
    .every((node) => node.complete && node.naturalWidth > 0));

  const badges = await page.locator(".cm-partner-badge img").evaluateAll((nodes) => nodes.map((node) => {
    const image = node.getBoundingClientRect();
    const frame = node.closest(".cm-partner-badge")?.getBoundingClientRect();
    return {
      alt: node.getAttribute("alt") ?? "",
      widthFill: frame ? image.width / frame.width : 0,
      heightFill: frame ? image.height / frame.height : 0
    };
  }));

  expect(badges.map((badge) => badge.alt)).toEqual([
    "NVIDIA Inception Program",
    "Microsoft for Startups"
  ]);
  expect(badges.every((badge) => Math.max(badge.widthFill, badge.heightFill) > 0.55)).toBe(true);
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

test("pointer-highlighted blocks pull tentacles across the canvas", async ({ page }, info) => {
  await page.goto("/?test=1");
  await ready(page);
  await page.waitForTimeout(220);

  const rect = await bounds(page);
  const selector = info.project.name === "mobile" ? ".secondary" : ".card-b";
  await page.locator(selector).scrollIntoViewIfNeeded();
  const targetBox = await page.locator(selector).boundingBox();

  if (!targetBox) {
    throw new Error(`Missing interaction target: ${selector}`);
  }

  const target = {
    x: targetBox.x - rect.x + targetBox.width * 0.5,
    y: targetBox.y - rect.y + targetBox.height * 0.5
  };
  const blockBefore = await sum(page, target.x, target.y, 180, 180);
  const limbBefore = await sum(page, rect.width * 0.44, rect.height * 0.48, rect.width * 0.42, rect.height * 0.34);

  const point = {
    x: targetBox.x + targetBox.width * 0.5,
    y: targetBox.y + targetBox.height * 0.5
  };

  if (info.project.name === "mobile") {
    await page.locator(selector).evaluate((node) => {
      node.addEventListener("click", (event) => event.preventDefault(), { once: true });
    });
    await page.touchscreen.tap(point.x, point.y);
  } else {
    for (let i = 0; i < 4; i += 1) {
      await page.mouse.move(point.x + i * 2, point.y + i * 2);
      await page.waitForTimeout(120);
    }
  }

  let blockDelta = 0;
  let limbDelta = 0;

  for (let i = 0; i < 8; i += 1) {
    await page.waitForTimeout(160);
    const blockAfter = await sum(page, target.x, target.y, 180, 180);
    const limbAfter = await sum(page, rect.width * 0.44, rect.height * 0.48, rect.width * 0.42, rect.height * 0.34);
    blockDelta = Math.max(blockDelta, Math.abs(blockAfter - blockBefore));
    limbDelta = Math.max(limbDelta, Math.abs(limbAfter - limbBefore));

    if (blockDelta > (info.project.name === "mobile" ? 250 : 400) && limbDelta > 2_000) {
      break;
    }
  }

  expect(blockDelta).toBeGreaterThan(info.project.name === "mobile" ? 250 : 400);
  expect(limbDelta).toBeGreaterThan(2_000);
});

test("calls to action remain clickable above the animation", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);
  const box = await bounds(page);

  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.65);
  await expect(page.locator(".primary")).toHaveAttribute("href", "https://app.compose.market/market");
  await page.locator(".primary").evaluate((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      (node as HTMLElement).dataset.clicked = "true";
    }, { once: true });
  });
  await page.locator(".primary").click();
  await expect(page.locator(".primary")).toHaveAttribute("data-clicked", "true");
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("keeps the scene calm while preserving block feedback", async ({ page }) => {
    await page.goto("/?test=1&motion=reduce");
    await ready(page);
    const motion = await page.evaluate(() => document.querySelector(".hero")?.getAttribute("data-motion"));
    expect(motion).toBe("reduce");
    await page.waitForTimeout(220);

    const box = await bounds(page);

    const before = await sum(page, box.width * 0.48, box.height * 0.7, 160, 160);
    const selector = page.viewportSize()?.width && page.viewportSize()!.width <= 700
      ? ".secondary"
      : ".card-b";
    await page.locator(selector).scrollIntoViewIfNeeded();
    const target = await page.locator(selector).boundingBox();

    if (!target) {
      throw new Error("Missing reduced-motion interaction target");
    }

    await page.mouse.move(target.x + target.width * 0.5, target.y + target.height * 0.5);
    await page.waitForTimeout(320);
    const after = await sum(page, box.width * 0.48, box.height * 0.7, 160, 160);
    const feedback = await page.locator(selector).evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        hover: node.matches(":hover"),
        shadow: style.boxShadow
      };
    });

    expect(Math.abs(after - before)).toBeLessThan(80_000);
    expect(feedback.hover).toBe(true);
    expect(feedback.shadow).not.toBe("none");
  });
});
