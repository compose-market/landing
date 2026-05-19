import { expect, test } from "@playwright/test";

async function ready(page: import("@playwright/test").Page) {
  for (let i = 0; i < 80; i += 1) {
    const ok = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      const heading = document.querySelector("h1");
      return canvas instanceof HTMLCanvasElement && Boolean(heading?.textContent?.includes("COMPOSE"));
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

test("desktop and mobile render the landing scene", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);
  const mounted = await page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent ?? "",
    market: document.querySelector<HTMLAnchorElement>(".primary")?.textContent ?? "",
    compose: document.querySelector<HTMLAnchorElement>(".secondary")?.textContent ?? "",
    canvas: document.querySelector("canvas") instanceof HTMLCanvasElement
  }));
  expect(mounted.heading).toContain("COMPOSE");
  expect(mounted.market).toContain("Explore Market");
  expect(mounted.compose).toContain("Open Composer");
  expect(mounted.canvas).toBe(true);
  await expect(page.locator(".hero")).toHaveAttribute("data-renderer", "three-webgl");
  await page.waitForTimeout(600);

  const rect = await bounds(page);
  const painted = await sum(page, rect.width * 0.64, rect.height * 0.18, 260, 170);
  expect(painted).toBeGreaterThan(20_000);
});

test("pointer-highlighted blocks pull tentacles across the canvas", async ({ page }, info) => {
  await page.goto("/?test=1");
  await ready(page);
  await page.waitForTimeout(220);

  const rect = await bounds(page);
  const target = {
    x: rect.width * 0.74,
    y: rect.height * (info.project.name === "mobile" ? 0.48 : 0.68)
  };
  const blockBefore = await sum(page, target.x, target.y, 180, 180);
  const limbBefore = await sum(page, rect.width * 0.44, rect.height * 0.48, rect.width * 0.42, rect.height * 0.34);

  const points = [
    { x: rect.x + rect.width * 0.25, y: rect.y + rect.height * 0.72 },
    { x: rect.x + rect.width * 0.48, y: rect.y + rect.height * 0.58 },
    { x: rect.x + target.x, y: rect.y + target.y }
  ];

  for (const point of points) {
    if (info.project.name === "mobile") {
      await page.touchscreen.tap(point.x, point.y);
    } else {
      await page.mouse.move(point.x, point.y);
    }
    await page.waitForTimeout(140);
  }

  await page.waitForTimeout(320);

  const blockAfter = await sum(page, target.x, target.y, 180, 180);
  const limbAfter = await sum(page, rect.width * 0.44, rect.height * 0.48, rect.width * 0.42, rect.height * 0.34);

  expect(Math.abs(blockAfter - blockBefore)).toBeGreaterThan(info.project.name === "mobile" ? 500 : 1_000);
  expect(Math.abs(limbAfter - limbBefore)).toBeGreaterThan(5_000);
});

test("calls to action remain clickable above the animation", async ({ page }) => {
  await page.goto("/?test=1");
  await ready(page);
  const box = await bounds(page);

  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.65);
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>(".primary")?.click());
  await expect(page).toHaveURL(/\/market$/);
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
    await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.7);
    await page.waitForTimeout(320);
    const after = await sum(page, box.width * 0.48, box.height * 0.7, 160, 160);
    const block = await sum(page, box.width * 0.72, box.height * 0.7);

    expect(Math.abs(after - before)).toBeLessThan(55_000);
    expect(block).toBeGreaterThan(12_000);
  });
});
