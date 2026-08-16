import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import test from "node:test";
import {
  Strand,
  fade,
  focus,
  formatMetricCount,
  formatMetricUsdc,
  metricDeltas,
  metricValues,
  metricsUrl,
  modelCount,
  modelsHealthUrl,
  net,
  pulse,
  type Hit
} from "../src/pages/home.ts";

test("metrics helpers format live totals", () => {
  assert.equal(metricsUrl("https://api.compose.market/"), "https://api.compose.market/api/metrics");
  assert.equal(metricsUrl("api.compose.market"), "https://api.compose.market/api/metrics");
  assert.equal(modelsHealthUrl("https://models.compose.market/"), "https://models.compose.market/health");
  assert.equal(modelsHealthUrl("models.compose.market"), "https://models.compose.market/health");
  assert.equal(modelCount({ models: 750 }), 750);
  assert.equal(modelCount({ models: -1 }), undefined);
  assert.equal(modelCount({ models: "750" }), undefined);
  assert.equal(formatMetricCount(2258), "2,258");
  assert.equal(formatMetricUsdc("5885.25"), "$5.885K");
  const payload = {
    totals: {
      agents: 54,
      payments: {
        transactions: 120,
        amountAtomic: "1234500000",
        amountUsdc: "1234.5"
      },
      sessions: 19,
      downloads: 2258
    },
    daily: {
      agents: 2,
      payments: {
        transactions: 35,
        amountAtomic: "456789",
        amountUsdc: "0.456789"
      },
      sessions: 7,
      downloads: 26
    }
  };
  assert.deepEqual(metricValues(payload, 750), {
    models: "750",
    volume: "$1.235K",
    settlements: "120",
    downloads: "2,258"
  });
  assert.deepEqual(metricDeltas(payload), {
    models: "",
    volume: "+$0.457 today",
    settlements: "+35 today",
    downloads: "+26 today"
  });
});

test("metric deltas show zero until daily metrics are provided", () => {
  assert.deepEqual(metricDeltas({
    totals: {
      agents: 1,
      payments: {
        transactions: 1,
        amountAtomic: "1",
        amountUsdc: "0.000001"
      },
      sessions: 1,
      downloads: 1
    }
  }), {
    models: "",
    volume: "+$0 today",
    settlements: "+0 today",
    downloads: "+0 today"
  });
});

test("block activation selects the hovered cluster", () => {
  const grid = net(320, 240, 40);

  pulse(grid, { x: 122, y: 88 }, 1);
  const hit = focus(grid);
  const active = [...grid.cells].filter((value) => value > 0.08).length;

  assert.ok(hit);
  assert.ok(hit.x > 95 && hit.x < 150);
  assert.ok(hit.y > 60 && hit.y < 115);
  assert.ok(active > 3);
});

test("grid activation decays smoothly", () => {
  const grid = net(240, 180, 45);

  pulse(grid, { x: 90, y: 90 }, 1);
  const before = focus(grid)?.total ?? 0;
  fade(grid, 0.5);
  const after = focus(grid)?.total ?? 0;

  assert.ok(before > 0);
  assert.ok(after > 0);
  assert.ok(after < before);
});

test("tentacle constraints preserve segment length", () => {
  const strand = new Strand({ x: 0, y: 0 }, 10, 180, 7);
  const target: Hit = { x: 130, y: 190, strength: 1, total: 8 };

  for (let i = 0; i < 18; i += 1) {
    strand.step(1 / 60, target, 1, false, i * 16, { w: 360, h: 320 });
  }

  const expected = strand.seg;
  const errors = strand.parts.slice(1).map((part, index) => {
    const prev = strand.parts[index];
    return Math.abs(Math.hypot(part.x - prev.x, part.y - prev.y) - expected);
  });

  assert.ok(Math.max(...errors) < 1.2);
});

test("activation extends and decay retracts the tentacle", () => {
  const strand = new Strand({ x: 20, y: 20 }, 12, 220, 11);
  const target: Hit = { x: 180, y: 220, strength: 1, total: 8 };
  const start = strand.reach;

  for (let i = 0; i < 25; i += 1) {
    strand.step(1 / 60, target, 1, false, i * 16, { w: 360, h: 360 });
  }

  const peak = strand.reach;

  for (let i = 0; i < 90; i += 1) {
    strand.step(1 / 60, null, 0, false, i * 16, { w: 360, h: 360 });
  }

  assert.ok(peak > start + 0.18);
  assert.ok(strand.reach < peak - 0.18);
});

test("reduced motion disables target chasing", () => {
  const normal = new Strand({ x: 0, y: 0 }, 10, 190, 19);
  const reduced = new Strand({ x: 0, y: 0 }, 10, 190, 19);
  const target: Hit = { x: 220, y: 180, strength: 1, total: 8 };

  for (let i = 0; i < 30; i += 1) {
    normal.step(1 / 60, target, 1, false, i * 16, { w: 360, h: 320 });
    reduced.step(1 / 60, target, 1, true, i * 16, { w: 360, h: 320 });
  }

  assert.ok(normal.tip().x > reduced.tip().x + 24);
  assert.ok(normal.reach > reduced.reach + 0.2);
});

test("runtime image assets stay within the landing budget", () => {
  const sceneFiles = [
    "public/artifacts/head.webp",
    "public/artifacts/tentacles.webp",
    "public/artifacts/cord-01.webp",
    "public/artifacts/cord-02.webp",
    "public/artifacts/cord-03.webp"
  ];
  const sceneBytes = sceneFiles.reduce((total, file) => total + statSync(file).size, 0);
  const partnerBytes = [
    ...readdirSync("public/partners").filter((file) => file.endsWith(".webp")).map((file) => `public/partners/${file}`),
    ...readdirSync("public/partners/badges").filter((file) => file.endsWith(".webp")).map((file) => `public/partners/badges/${file}`)
  ].reduce((total, file) => total + statSync(file).size, 0);

  assert.ok(sceneBytes < 500 * 1024, `scene textures are ${Math.round(sceneBytes / 1024)}KB`);
  assert.ok(partnerBytes < 1_200 * 1024, `partner assets are ${Math.round(partnerBytes / 1024)}KB`);
});
