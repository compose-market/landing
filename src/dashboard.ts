/**
 * Dashboard showcase — a decorative, static miniature of the real
 * web/src/pages/dashboard.tsx (Inference Analytics), rendered inline in the
 * "Three values. Any client." band on the home page.
 *
 * Data is a build-time snapshot of the Neon inference analytics store for a
 * real account (0x3f9D…C797B), 30d range — the same aggregates the live
 * dashboard renders from /api/analytics/inference.
 */

/** Daily spend (USDC) over the last 30d — drives the Spend area chart. */
const SPEND_TIMELINE: number[] = [
  25.9, 32.8, 9.76, 38.87, 11.15, 0, 12.25, 4.78, 81.64, 26.87, 372.25,
  33.72, 30.53, 0, 0, 38.64, 60.84, 215.75, 0, 267.33, 57.46, 63.13, 73.05,
  10.97
];

/** Per-day sparkline for the Total Spent card (same series, finer is fine). */
const SPARKLINE: number[] = SPEND_TIMELINE;

interface ModelRow {
  id: string;
  family: string;
  cost: string;
  calls: string;
}

const MODELS: ModelRow[] = [
  { id: "gpt-5.6-sol", family: "openai", cost: "$1,418.91", calls: "7,826" },
  { id: "kimi-k3", family: "moonshot", cost: "$27.72", calls: "44" },
  { id: "Qwen3.8-Max", family: "alibaba", cost: "$6.72", calls: "162" },
  { id: "happyhorse-1.1-t2v", family: "alibaba", cost: "$1.94", calls: "2" },
];

interface FeedRow {
  model: string;
  family: string;
  age: string;
  ttft: string;
  amount: string;
  tone: "emerald" | "amber" | "danger";
  streamed: boolean;
}

const FEED: FeedRow[] = [
  { model: "Qwen3.8-Max", family: "alibaba", age: "just now", ttft: "3.5s", amount: "$0.0433", tone: "emerald", streamed: true },
  { model: "Qwen3.8-Max", family: "alibaba", age: "2m ago", ttft: "4.2s", amount: "$0.0354", tone: "emerald", streamed: true },
  { model: "Qwen3.8-Max", family: "alibaba", age: "3m ago", ttft: "4.2s", amount: "$0.0228", tone: "emerald", streamed: true },
  { model: "Qwen3.8-Max", family: "alibaba", age: "3m ago", ttft: "2.8s", amount: "$0.0238", tone: "emerald", streamed: true },
  { model: "Qwen3.8-Max", family: "alibaba", age: "3m ago", ttft: "4.1s", amount: "$0.0217", tone: "emerald", streamed: true }
];

/* ── Icons (lucide paths, stroke 2 — same set the app uses) ── */

function icon(paths: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

const I = {
  chart: icon('<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'),
  filter: icon('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
  refresh: icon('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
  dollar: icon('<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  activity: icon('<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>'),
  gauge: icon('<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'),
  rocket: icon('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),
  coins: icon('<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>'),
  zap: icon('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'),
  search: icon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  chevron: icon('<path d="m6 9 6 6 6-6"/>'),
  box: icon('<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>')
};

/* ── SVG helpers (match recharts output shapes) ── */

/** Axis-less sparkline area+line (mirrors overview.tsx Sparkline, 100×28). */
function sparkline(values: number[]): string {
  const w = 100;
  const h = 28;
  const max = Math.max(...values, 0);
  if (max <= 0) return "";
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 4) - 2).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return `
      <svg class="dd-spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="dd-spark-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--dd-primary)" stop-opacity="0.35" />
            <stop offset="100%" stop-color="var(--dd-primary)" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#dd-spark-g)" />
        <path d="${line}" fill="none" stroke="var(--dd-primary)" stroke-opacity="0.75" stroke-width="1.4" vector-effect="non-scaling-stroke" />
      </svg>`;
}

/** Spend area chart (mirrors usage.tsx "spend" tab): grid, axes, gradient area. */
function areaChart(values: number[]): string {
  const w = 560;
  const h = 168;
  const padL = 40;
  const padR = 8;
  const padT = 6;
  const padB = 18;
  const cw = w - padL - padR;
  const ch = h - padT - padB;
  const max = Math.max(...values);
  const n = values.length;
  const x = (i: number) => padL + (i / (n - 1)) * cw;
  const y = (v: number) => padT + ch - (v / max) * ch;
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${x(n - 1).toFixed(1)} ${padT + ch} L ${padL} ${padT + ch} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = max * f;
    const label = v >= 100 ? `$${Math.round(v)}` : v >= 1 ? `$${v.toFixed(0)}` : "$0";
    return { y: y(v), label };
  });
  const grid = yTicks.map((t) => `<line x1="${padL}" y1="${t.y.toFixed(1)}" x2="${w - padR}" y2="${t.y.toFixed(1)}" class="dd-chart-grid" />`).join("");
  const yLabels = yTicks.map((t) => `<text x="${padL - 6}" y="${(t.y + 3).toFixed(1)}" text-anchor="end" class="dd-chart-tick">${t.label}</text>`).join("");
  const xLabels = [0, Math.floor((n - 1) / 2), n - 1].map((i, k) => {
    const labels = ["Jul 13", "Jul 28", "Aug 11"];
    const anchor = k === 0 ? "start" : k === 2 ? "end" : "middle";
    return `<text x="${x(i).toFixed(1)}" y="${h - 4}" text-anchor="${anchor}" class="dd-chart-tick">${labels[k]}</text>`;
  }).join("");

  return `
      <svg class="dd-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="dd-area-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--dd-primary)" stop-opacity="0.32" />
            <stop offset="100%" stop-color="var(--dd-primary)" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${grid}
        <path d="${area}" fill="url(#dd-area-g)" />
        <path d="${line}" fill="none" stroke="var(--dd-primary)" stroke-width="1.6" vector-effect="non-scaling-stroke" />
        ${yLabels}
        ${xLabels}
        <line x1="${padL}" y1="${padT + ch}" x2="${w - padR}" y2="${padT + ch}" class="dd-chart-axis" />
      </svg>`;
}

/* ── Blocks (mirror web/src/components/dashboard/*) ── */

function pill(label: string, glyph: string, active = false): string {
  return `<span class="dd-pill${active ? " is-active" : ""}">${glyph}${label}</span>`;
}

function statCard(label: string, glyph: string, value: string, sub: string, tone = ""): string {
  return `
        <div class="dd-stat">
          <span class="dd-stat__label">${glyph}${label}</span>
          <span class="dd-stat__value"${tone ? ` data-tone="${tone}"` : ""}>${value}</span>
          <span class="dd-stat__sub">${sub}</span>
        </div>`;
}

function modelRow(row: ModelRow): string {
  return `
            <tr>
              <td><span class="dd-model"><span class="dd-model__icon">${I.box}</span><span class="dd-model__name"><b>${row.id}</b><i>${row.family}</i></span></span></td>
              <td class="dd-cost">${row.cost}</td>
              <td class="dd-calls">${row.calls}</td>
            </tr>`;
}

function feedRow(row: FeedRow): string {
  return `
          <div class="dd-feed__item">
            <div class="dd-feed__top">
              <span class="dd-feed__model"><span class="dd-dot" data-tone="${row.tone}"></span>${row.model}</span>
              <span class="dd-feed__amount">${row.amount}</span>
            </div>
            <div class="dd-feed__bottom">
              <span class="dd-feed__meta">${row.age}<span class="dd-modality" data-tone="text">Text</span>${row.family}</span>
              <span class="dd-feed__badges"><span class="dd-badge" data-tone="violet">TTFT ${row.ttft}</span>${row.streamed ? `<span class="dd-zap">${I.zap}</span>` : ""}<span class="dd-badge" data-tone="${row.tone}">Succeeded</span></span>
            </div>
          </div>`;
}

export function dashboardDemo(): string {
  return `
    <div class="dash-demo" aria-hidden="true">
      <div class="dd">
        <header class="dd-header">
          <span class="dd-title">${I.chart}<b>Dashboard</b></span>
          <span class="dd-actions">
            ${pill("All networks", I.filter)}
            <span class="dd-range">
              <span>24h</span><span>7d</span><span class="is-active">30d</span><span>180d</span>
            </span>
            ${pill("", I.refresh, false).replace("dd-pill", "dd-pill dd-icon-pill")}
          </span>
        </header>

        <div class="dd-stats">
          ${statCard("Total Spent", I.dollar, "$1,457.83", "8,606 requests settled", "primary").replace("</div>", `${sparkline(SPARKLINE)}</div>`)}
          ${statCard("Requests", I.activity, "8,606", '<span class="dd-rate" data-tone="amber">93.5% success</span> · 99.7% streamed')}
          ${statCard("Avg Latency", I.gauge, "1.8s", "P95 9.5s")}
          ${statCard("Avg TTFT", I.rocket, "10.8s", "time to first token", "accent")}
          ${statCard("Tokens", I.coins, "348.2M", "342.5M in → 5.6M out")}
        </div>

        <section class="dd-block dd-chart-block">
          <header class="dd-block__head">
            <span class="dd-range dd-range--tabs">
              <span class="is-active">Spend</span><span>Requests</span><span>Tokens</span><span>Latency</span>
            </span>
            <span class="dd-badge-total">$1,457.83</span>
          </header>
          ${areaChart(SPEND_TIMELINE)}
        </section>

        <section class="dd-block dd-models-block">
          <header class="dd-block__head">
            ${pill("Models", I.chevron, true).replace("dd-pill", "dd-pill dd-view")}
            <span class="dd-side">${pill("", I.search).replace("dd-pill", "dd-pill dd-icon-pill")}${pill("Cost", I.chevron)}</span>
          </header>
          <table class="dd-table">
            <thead><tr><th>Model</th><th>Cost</th><th>Calls</th></tr></thead>
            <tbody>${MODELS.map(modelRow).join("")}</tbody>
          </table>
        </section>

        <section class="dd-block dd-feed-block">
          <header class="dd-block__head">
            ${pill("Requests", I.chevron, true).replace("dd-pill", "dd-pill dd-view")}
            ${pill("Filter · All", I.chevron)}
          </header>
          <div class="dd-feed">${FEED.map(feedRow).join("")}</div>
        </section>
      </div>
    </div>`;
}
