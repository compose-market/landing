import * as THREE from "three";

export type Vec = {
  x: number;
  y: number;
};

export type Hit = Vec & {
  strength: number;
  total: number;
};

export type Net = {
  w: number;
  h: number;
  size: number;
  cols: number;
  rows: number;
  cells: Float32Array;
};

export type Mount = {
  destroy: () => void;
};

export type MountOptions = {
  image?: string;
  tentacles?: string;
  cords?: string[];
  market?: string;
  compose?: string;
  reduced?: boolean;
  seed?: number;
};

export type MetricsPayload = {
  totals: {
    downloads: number;
    agents: number;
    payments: {
      transactions: number;
      amountAtomic: string;
      amountUsdc: string;
    };
    sessions: number;
  };
  daily?: {
    downloads: number;
    agents: number;
    payments: {
      transactions: number;
      amountAtomic: string;
      amountUsdc: string;
    };
    sessions: number;
  };
};

export type MetricKey = "agents" | "volume" | "sessions" | "downloads";

type Part = Vec & {
  px: number;
  py: number;
};

type Body = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Bounds = {
  w: number;
  h: number;
};

type Zone = "head" | "cord" | "braid" | "thread";

type Wake = Vec & {
  zone: Zone;
};

type Ribbon = {
  strand: Strand;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  position: THREE.BufferAttribute;
  side: THREE.BufferAttribute;
  along: THREE.BufferAttribute;
  shade: THREE.BufferAttribute;
  family: "vine" | "lace" | "braid" | "flow";
};

type Cord = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, SceneMaterial>;
  root: number;
  length: number;
  width: number;
  phase: number;
  depth: number;
  sway: number;
  base: Vec;
  size: Vec;
  rot: number;
};

type SceneMaterial = THREE.ShaderMaterial & {
  uniforms: Record<string, { value: unknown }>;
};

const tau = Math.PI * 2;
const pollMs = 15_000;
const headRatio = 330 / 900;
const sheetRatio = 1180 / 900;
const sheetTopUv = 346 / 1180;
const metrics = ["agents", "volume", "sessions", "downloads"] as const;
const icons: Record<MetricKey, string> = {
  agents: '<path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />',
  volume: '<path d="M20 12v6a2 2 0 0 1-2 2H6a4 4 0 0 1 0-8h14Z" /><path d="M4 12V8a2 2 0 0 1 2-2h12v6" /><path d="M18 16h.01" /><path d="M8 6V4h8v2" />',
  sessions: '<path d="M15 7a4 4 0 1 1-3.46 6" /><path d="M2 20l7.5-7.5" /><path d="M6 16l2 2" /><path d="M8 14l2 2" />',
  downloads: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M8 15l4 4 4-4" />'
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

type PartnerLogo = { src: string; alt: string };
type PartnerBadge = PartnerLogo & {
  href: string;
  tone: "green" | "blue" | "cyan" | "purple";
};

const partnerLogos: PartnerLogo[] = [
  { src: "/partners/11labs.png", alt: "ElevenLabs" },
  { src: "/partners/aiven.png", alt: "AIven" },
  { src: "/partners/algolia.svg", alt: "Algolia" },
  { src: "/partners/alibaba.png", alt: "Alibaba Cloud" },
  { src: "/partners/anam.png", alt: "Anam" },
  { src: "/partners/apify.svg", alt: "Apify" },
  { src: "/partners/asicloud.png", alt: "ASI:Cloud" },
  { src: "/partners/avalanche.svg", alt: "Avalanche" },
  { src: "/partners/azure-ai.png", alt: "Azure AI" },
  { src: "/partners/cartesia.png", alt: "Cartesia" },
  { src: "/partners/chroma.png", alt: "ChromaDB" },
  { src: "/partners/cloudflare.png", alt: "Cloudflare" },
  { src: "/partners/composio.png", alt: "Composio" },
  { src: "/partners/confluent.png", alt: "Confluent" },
  { src: "/partners/confidence.png", alt: "Confidence" },
  { src: "/partners/couchbase.png", alt: "Couchbase" },
  { src: "/partners/datadog.png", alt: "Datadog" },
  { src: "/partners/daytona.svg", alt: "Daytona" },
  { src: "/partners/deepgram.png", alt: "Deepgram" },
  { src: "/partners/digitalocean.png", alt: "DigitalOcean" },
  { src: "/partners/fireworks-ai.png", alt: "Fireworks AI" },
  { src: "/partners/intercom.png", alt: "Intercom" },
  { src: "/partners/lambda.png", alt: "Lambda AI" },
  { src: "/partners/linkup.png", alt: "Linkup" },
  { src: "/partners/massive.png", alt: "Massive" },
  { src: "/partners/mem0.png", alt: "Mem0" },
  { src: "/partners/mixpanel.png", alt: "Mixpanel" },
  { src: "/partners/modal.png", alt: "Modal" },
  { src: "/partners/mongodb.png", alt: "MongoDB" },
  { src: "/partners/neo4j.png", alt: "Neo4j" },
  { src: "/partners/neon.png", alt: "Neon" },
  { src: "/partners/nvidia.png", alt: "NVIDIA" },
  { src: "/partners/openai.png", alt: "OpenAI" },
  { src: "/partners/perplexity.png", alt: "Perplexity" },
  { src: "/partners/posthog.png", alt: "PostHog" },
  { src: "/partners/quicknode.png", alt: "Quicknode" },
  { src: "/partners/redis.png", alt: "Redis" },
  { src: "/partners/roboflow.png", alt: "Roboflow" },
  { src: "/partners/telnyx.png", alt: "Telnyx" },
  { src: "/partners/temporal.png", alt: "Temporal" },
  { src: "/partners/thirdweb.png", alt: "Thirdweb" },
  { src: "/partners/vertex-ai.png", alt: "Vertex AI" },
];

const partnerBadges: PartnerBadge[] = [
  {
    src: "/partners/badges/nvidia-badge.png",
    alt: "NVIDIA Inception Program",
    href: "https://www.nvidia.com/en-us/startups/",
    tone: "green"
  },
  {
    src: "/partners/badges/microsoft-badge.png",
    alt: "Microsoft for Startups",
    href: "https://www.microsoft.com/en-us/startups",
    tone: "blue"
  }
];

const smooth = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function spin(point: Vec, origin: Vec, angle: number): Vec {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: origin.x + dx * c - dy * s,
    y: origin.y + dx * s + dy * c
  };
}

function sample(parts: Part[], index: number, radius: number): Vec {
  if (radius <= 0) {
    return parts[index];
  }

  let x = 0;
  let y = 0;
  let total = 0;

  for (let offset = -radius; offset <= radius; offset += 1) {
    const part = parts[clamp(index + offset, 0, parts.length - 1)];
    const weight = radius + 1 - Math.abs(offset);
    x += part.x * weight;
    y += part.y * weight;
    total += weight;
  }

  return { x: x / total, y: y / total };
}

function tint(a: number, b: number, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

function env() {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_URL;
}

function glyph(key: MetricKey): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[key]}</svg>`;
}

function logoTag(logo: PartnerLogo): string {
  return `<div class="cm-partner-logo"><img src="${logo.src}" alt="${logo.alt}" title="${logo.alt}" loading="lazy" decoding="async" draggable="false" /></div>`;
}

function badgeTag(badge: PartnerBadge): string {
  return `
    <a class="cm-partner-badge" data-tone="${badge.tone}" href="${badge.href}" target="_blank" rel="noopener noreferrer">
      <img src="${badge.src}" alt="${badge.alt}" loading="lazy" decoding="async" draggable="false" />
    </a>`;
}

function marquee(): string {
  const mid = Math.ceil(partnerLogos.length / 2);
  const top = partnerLogos.slice(0, mid);
  const bottom = partnerLogos.slice(mid);
  const topHtml = top.map(logoTag).join("");
  const bottomHtml = bottom.map(logoTag).join("");
  return `
    <div class="cm-partner-marquee" aria-label="Partner logos">
      <div class="cm-partner-marquee__row">
        <div class="cm-marquee-track cm-partner-marquee__inner" style="animation-duration:80s">${topHtml}${topHtml}</div>
      </div>
      <div class="cm-partner-marquee__row">
        <div class="cm-marquee-track-reverse cm-partner-marquee__inner" style="animation-duration:90s">${bottomHtml}${bottomHtml}</div>
      </div>
    </div>`;
}

export function metricsUrl(base = env()): string | undefined {
  const raw = base?.trim();

  if (!raw) {
    return undefined;
  }

  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  return `${url.replace(/\/+$/, "")}/api/metrics`;
}

export function formatMetricCount(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Math.trunc(value).toLocaleString("en-US");
}

export function formatMetricUsdc(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const abs = Math.abs(amount);

  if (abs >= 1_000_000) {
    return `$${(amount / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 3
    })}M`;
  }

  if (abs >= 1_000) {
    return `$${(amount / 1_000).toLocaleString("en-US", { maximumFractionDigits: 3 })}K`;
  }

  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 3
  })}`;
}

export function metricValues(payload: MetricsPayload): Record<MetricKey, string> {
  return {
    agents: formatMetricCount(payload.totals.agents),
    volume: formatMetricUsdc(payload.totals.payments.amountUsdc),
    sessions: formatMetricCount(payload.totals.sessions),
    downloads: formatMetricCount(payload.totals.downloads)
  };
}

export function metricDeltas(payload: MetricsPayload): Record<MetricKey, string> {
  const daily = payload.daily;
  return {
    agents: `+${formatMetricCount(daily?.agents ?? 0)} today`,
    volume: `+${formatMetricUsdc(daily?.payments.amountUsdc ?? "0")} today`,
    sessions: `+${formatMetricCount(daily?.sessions ?? 0)} today`,
    downloads: `+${formatMetricCount(daily?.downloads ?? 0)} today`
  };
}

function writeMetric(root: ParentNode, key: MetricKey, value: string, delta: string) {
  const node = root.querySelector<HTMLElement>(`[data-metric="${key}"] strong`);
  const deltaNode = root.querySelector<HTMLElement>(`[data-metric="${key}"] [data-delta]`);

  if (node) {
    node.textContent = value;
  }
  if (deltaNode) {
    deltaNode.textContent = delta;
  }
}

function writeMetrics(root: ParentNode, payload: MetricsPayload) {
  const values = metricValues(payload);
  const deltas = metricDeltas(payload);

  for (const key of metrics) {
    writeMetric(root, key, values[key], deltas[key]);
  }
}

function pollMetrics(root: ParentNode) {
  const url = metricsUrl();

  if (!url) {
    return () => { };
  }

  let stopped = false;
  let timer = 0;

  const load = async () => {
    try {
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const payload = await response.json() as MetricsPayload;

      if (!stopped) {
        writeMetrics(root, payload);
      }
    } catch {
      // Keep the last live values visible during transient API failures.
    } finally {
      if (!stopped) {
        timer = window.setTimeout(load, pollMs);
      }
    }
  };

  void load();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}

export function net(w: number, h: number, size = 62): Net {
  const cols = Math.max(1, Math.ceil(w / size));
  const rows = Math.max(1, Math.ceil(h / size));
  return {
    w,
    h,
    size,
    cols,
    rows,
    cells: new Float32Array(cols * rows)
  };
}

export function pulse(grid: Net, point: Vec, power = 1) {
  const radius = grid.size * 1.8;
  const minX = clamp(Math.floor((point.x - radius) / grid.size), 0, grid.cols - 1);
  const maxX = clamp(Math.floor((point.x + radius) / grid.size), 0, grid.cols - 1);
  const minY = clamp(Math.floor((point.y - radius) / grid.size), 0, grid.rows - 1);
  const maxY = clamp(Math.floor((point.y + radius) / grid.size), 0, grid.rows - 1);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const cx = Math.min(grid.w, x * grid.size + grid.size * 0.5);
      const cy = Math.min(grid.h, y * grid.size + grid.size * 0.5);
      const d = Math.hypot(cx - point.x, cy - point.y);
      const value = smooth(1 - d / radius) * power;
      const index = y * grid.cols + x;
      grid.cells[index] = Math.max(grid.cells[index], value);
    }
  }
}

export function fade(grid: Net, keep = 0.92) {
  for (let i = 0; i < grid.cells.length; i += 1) {
    const value = grid.cells[i] * keep;
    grid.cells[i] = value > 0.004 ? value : 0;
  }
}

export function focus(grid: Net): Hit | null {
  let x = 0;
  let y = 0;
  let total = 0;

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const raw = grid.cells[row * grid.cols + col];

      if (raw <= 0.002) {
        continue;
      }

      const value = raw ** 1.35;
      total += value;
      x += Math.min(grid.w, col * grid.size + grid.size * 0.5) * value;
      y += Math.min(grid.h, row * grid.size + grid.size * 0.5) * value;
    }
  }

  if (total <= 0.01) {
    return null;
  }

  return {
    x: x / total,
    y: y / total,
    total,
    strength: clamp(total / 7.5, 0, 1)
  };
}

export function rng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export class Strand {
  root: Vec;
  parts: Part[];
  base: number;
  reach = 0.74;
  phase: number;
  width: number;
  color: number;
  lean: number;
  curl: number;
  depth: number;
  bead: number;

  constructor(root: Vec, count = 18, span = 260, seed = 1) {
    const rand = rng(seed);
    this.root = { ...root };
    this.base = span;
    this.phase = rand() * tau;
    this.width = mix(0.8, 5.2, rand());
    this.color = rand();
    this.lean = mix(-1, 1, rand());
    this.curl = mix(0.45, 1.7, rand());
    this.depth = mix(-18, 34, rand());
    this.bead = rand();
    this.parts = [];

    for (let i = 0; i < count; i += 1) {
      const along = i / Math.max(1, count - 1);
      const x = root.x + Math.sin(along * Math.PI + this.phase) * 8 * along;
      const y = root.y + span * 0.78 * along;
      this.parts.push({ x, y, px: x, py: y });
    }
  }

  get seg() {
    return (this.base * this.reach) / Math.max(1, this.parts.length - 1);
  }

  tip() {
    return this.parts[this.parts.length - 1];
  }

  place(root: Vec, span = this.base) {
    const dx = root.x - this.root.x;
    const dy = root.y - this.root.y;
    this.root = { ...root };
    this.base = span;

    for (const part of this.parts) {
      part.x += dx;
      part.y += dy;
      part.px += dx;
      part.py += dy;
    }
  }

  step(dt: number, target: Hit | null, active = 0, reduced = false, time = 0, bounds?: Bounds) {
    const rate = clamp(dt * 60, 0.25, 2);
    const want = reduced ? 0.66 : 0.72 + active * 1.36;
    this.reach += (want - this.reach) * (reduced ? 0.025 : 0.074) * rate;

    const drag = reduced ? 0.84 : 0.908;
    const pullTarget = target && !reduced && active > 0.01
      ? {
        x: target.x,
        y: target.y
      }
      : null;

    this.parts[0].x = this.root.x;
    this.parts[0].y = this.root.y;
    this.parts[0].px = this.root.x;
    this.parts[0].py = this.root.y;

    for (let i = 1; i < this.parts.length; i += 1) {
      const part = this.parts[i];
      const along = i / (this.parts.length - 1);
      const vx = (part.x - part.px) * drag;
      const vy = (part.y - part.py) * drag;
      const wave = Math.sin(time * 0.00115 + this.phase + along * (7.2 + this.curl * 2.4));
      const slow = Math.sin(time * 0.00042 + this.phase * 1.7 + along * 2.8);
      const cross = Math.cos(time * 0.00077 + this.phase * 0.7 + along * 4);
      const depth = clamp((part.y - this.root.y) / Math.max(1, this.base), 0, 1);
      const eddy = Math.sin(time * 0.00024 + this.phase * 2.3 + depth * 5.7);
      const current = reduced ? 0.09 : 0.82 + depth * 0.28;

      part.px = part.x;
      part.py = part.y;
      part.x += vx + (wave * 0.62 + cross * 0.25 + slow * this.curl * 0.48 + eddy * 0.34 + this.lean * 0.07) * current * rate;
      part.y += vy + (0.08 + along * 0.12 + Math.abs(eddy) * 0.022) * current * rate;

      if (pullTarget) {
        const lag = smooth(along * 0.88 + Math.sin(this.phase + time * 0.00038) * 0.08);
        const pull = active * lag ** 2.05 * 0.092 * rate;
        const spread = Math.sin(this.phase + along * 2.7) * 58 * along * active;
        const lift = Math.sin(time * 0.00062 + this.phase + along * 3.8) * 30 * active * along;
        part.x += (pullTarget.x + spread - part.x) * pull;
        part.y += (pullTarget.y + lift - part.y) * pull * 0.82;
      }

      if (bounds) {
        part.x = clamp(part.x, -140, bounds.w + 140);
        part.y = clamp(part.y, -140, bounds.h + 260);
      }
    }

    this.solve();
  }

  solve(iterations = 14) {
    const seg = this.seg;

    for (let pass = 0; pass < iterations; pass += 1) {
      this.parts[0].x = this.root.x;
      this.parts[0].y = this.root.y;

      for (let i = 1; i < this.parts.length; i += 1) {
        const a = this.parts[i - 1];
        const b = this.parts[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const diff = (dist - seg) / dist;

        if (i === 1) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
    }
  }
}

function body(w: number, h: number): Body {
  const wide = w >= 860;
  const bw = clamp(w * (wide ? 0.414 : 0.738), 288, 630);
  const bh = bw * 0.42;
  const cx = w * 0.5;
  const y = wide ? h * 0.22 : h * 0.25;
  return { x: cx - bw * 0.5, y, w: bw, h: bh };
}

function outline(u: number) {
  const s = Math.sin(Math.PI * u);
  const swell = Math.max(0, s) ** 0.72;
  const left = (1 - u) ** 2.9;
  const right = u ** 2.4;
  const center = 0.026 + (u - 0.5) * 0.042 - Math.sin(u * tau) * 0.012 + right * 0.028 - left * 0.02;
  const half = 0.011 + swell * (0.165 - u * 0.018) + right * 0.016;
  const top = center - half * (0.94 + left * 0.28 - right * 0.1);
  const bottom = center + half * (0.74 + right * 0.26) + left * 0.012;
  return { top, bottom };
}

function bodyGeometry() {
  const xSeg = 150;
  const ySeg = 58;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const ratio = 330 / 900;

  for (let y = 0; y <= ySeg; y += 1) {
    const v = y / ySeg;
    for (let x = 0; x <= xSeg; x += 1) {
      const u = x / xSeg;
      const lift = Math.sin(Math.PI * u) ** 0.55;
      const shell = Math.sin(Math.PI * v) ** 0.72;
      const xv = u - 0.5 + shell * (u - 0.42) * 0.018;
      const yv = (v - 0.5) * ratio;
      const z = shell * lift * 0.115 - v * 0.016;
      positions.push(xv, yv, z);
      normals.push(0, 0, 1);
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < ySeg; y += 1) {
    for (let x = 0; x < xSeg; x += 1) {
      const a = y * (xSeg + 1) + x;
      indices.push(a, a + 1, a + xSeg + 1, a + 1, a + xSeg + 2, a + xSeg + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function seaMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uTarget: { value: new THREE.Vector2(0.72, 0.65) },
      uResolution: { value: new THREE.Vector2(1, 1) }
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;
      uniform vec2 uTarget;
      uniform vec2 uResolution;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 r = mat2(0.82, -0.57, 0.57, 0.82);
        for (int i = 0; i < 5; i++) {
          v += noise(p) * a;
          p = r * p * 2.05 + 7.1;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        vec2 ratio = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
        vec2 p = (uv - 0.5) * ratio;
        float t = uTime * 0.055;
        float current = fbm(vec2(p.x * 2.1 + t * 1.6, p.y * 3.4 - t));
        float storm = fbm(vec2(p.x * 5.8 - t * 2.2, p.y * 1.8 + t * 0.7));
        float streak = smoothstep(0.62, 0.93, sin((uv.y + current * 0.12) * 28.0 + uTime * 0.92) * 0.5 + 0.5);
        float sheet = smoothstep(0.48, 0.98, current + storm * 0.32);
        float focus = 1.0 - smoothstep(0.0, 0.42, distance(uv, uTarget));

        vec3 deep = vec3(0.004, 0.014, 0.019);
        vec3 blue = vec3(0.018, 0.075, 0.13);
        vec3 cyan = vec3(0.04, 0.42, 0.52);
        vec3 violet = vec3(0.12, 0.04, 0.31);
        vec3 color = mix(deep, blue, sheet);
        color += cyan * streak * (0.035 + 0.12 * storm);
        color += violet * smoothstep(0.58, 1.0, storm) * 0.12;
        color += vec3(0.05, 0.82, 0.96) * focus * uActive * 0.18;
        color *= 1.0 - uv.y * 0.2;

        float alpha = clamp(0.34 + sheet * 0.2 + streak * 0.08 + focus * uActive * 0.12, 0.34, 0.68);
        gl_FragColor = vec4(color, alpha);
      }
    `
  }) as SceneMaterial;
}

function bodyMaterial(map: THREE.Texture): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uActive: { value: 0 },
      uTarget: { value: new THREE.Vector2(0.5, 0.7) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vLocal;
      uniform float uTime;
      uniform float uActive;
      uniform vec2 uTarget;

      void main() {
        vUv = uv;
        vec3 p = position;
        float swell = sin(uv.x * 3.14159265);
        float breath = sin(uTime * 1.18 + uv.x * 5.4) * sin(uv.y * 3.14159265);
        float pulse = 1.0 - smoothstep(0.0, 0.54, distance(uv, uTarget));
        p.z += breath * 0.01 + pulse * uActive * 0.038;
        p.y += breath * 0.004 + pulse * uActive * 0.009;
        p.x += sin(uTime * 0.76 + uv.y * 8.0) * swell * 0.0025;
        vLocal = p;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vLocal;
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uActive;
      uniform vec2 uTarget;

      float band(float x, float center, float width) {
        return 1.0 - smoothstep(0.0, width, abs(x - center));
      }

      float spot(vec2 uv, vec2 c, vec2 r) {
        vec2 q = (uv - c) / r;
        return exp(-dot(q, q));
      }

      void main() {
        vec2 mapUv = vUv;
        float target = 1.0 - smoothstep(0.0, 0.5, distance(vUv, uTarget));
        mapUv.x += sin(uTime * 0.38 + vUv.y * 8.0) * 0.004 + target * uActive * 0.008;
        mapUv.y += sin(uTime * 0.31 + vUv.x * 10.0) * 0.003 - target * uActive * 0.005;
        vec4 tex = texture2D(uMap, clamp(mapUv, 0.0, 1.0));
        if (tex.a < 0.012) discard;

        float tip = smoothstep(0.0, 0.045, vUv.x) * (1.0 - smoothstep(0.968, 1.0, vUv.x));
        float belly = sin(vUv.y * 3.14159265);
        float shell = pow(max(0.0, belly), 0.42) * tip;
        float mask = smoothstep(0.02, 0.42, tex.a) * tip;

        float rib = pow(max(0.0, sin(vUv.x * 96.0 + sin(vUv.y * 5.0) * 1.6)), 14.0);
        rib *= smoothstep(0.0, 0.34, 0.5 - vUv.y) * smoothstep(0.08, 0.35, vUv.x) * (1.0 - smoothstep(0.82, 0.98, vUv.x)) * mask;

        float seam = band(vUv.y + sin(vUv.x * 15.0 + uTime * 0.22) * 0.018, 0.46, 0.09);
        float vein = pow(max(0.0, sin((vUv.x + vUv.y * 0.22) * 42.0 - uTime * 0.85)), 8.0) * 0.38;
        float bright =
          spot(vUv, vec2(0.19, 0.38), vec2(0.08, 0.08)) * 1.25 +
          spot(vUv, vec2(0.48, 0.52), vec2(0.16, 0.13)) * 0.92 +
          spot(vUv, vec2(0.69, 0.35), vec2(0.11, 0.1)) * 0.9 +
          spot(vUv, vec2(0.9, 0.36), vec2(0.06, 0.08)) * 1.1;
        float glint = pow(max(0.0, sin(vUv.x * 20.0 - uTime * 1.6 + vUv.y * 8.0)), 18.0) * (0.36 + uActive * 0.2);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.8);

        vec3 cyan = vec3(0.02, 0.85, 1.0);
        vec3 violet = vec3(0.72, 0.12, 1.0);
        vec3 pearl = vec3(0.94, 0.98, 1.0);

        vec3 color = tex.rgb * (1.14 + shell * 0.1 + target * uActive * 0.08);
        color += pearl * (bright * 0.42 + glint * 0.58 + fresnel * 0.22) * mask;
        color += cyan * target * uActive * 0.18 * mask;
        color += violet * seam * 0.1 * mask + cyan * vein * 0.055 * mask + pearl * rib * 0.16;
        float alpha = tex.a * (0.94 + fresnel * 0.22 + bright * 0.09 + glint * 0.08 + target * uActive * 0.06);
        alpha = clamp(alpha, 0.0, 0.98);

        gl_FragColor = vec4(color, alpha);
      }
    `
  }) as SceneMaterial;
}

function cordMaterial(map: THREE.Texture): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uStill: { value: 0 },
      uSeed: { value: 0 },
      uActive: { value: 0 },
      uTop: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vEdge;
      varying float vHang;
      uniform float uTime;
      uniform float uStill;
      uniform float uSeed;
      uniform float uActive;
      uniform float uTop;

      void main() {
        vUv = vec2(uv.x, mix(uTop, 1.0, uv.y));
        vec3 p = position;
        vHang = clamp(p.y, 0.0, 1.0);
        float hang = vHang;
        float free = smoothstep(0.14, 0.28, hang);
        float side = uv.x - 0.5;
        float flow = mix(1.0, 0.22, uStill);
        float react = uActive * (1.0 - uStill);
        float wide = smoothstep(0.16, 0.92, hang);
        float body = pow(hang, 1.18);
        float curl = sin(uTime * 0.58 + uSeed + hang * 6.2) * (0.042 + react * 0.22);
        float tide = sin(uTime * 0.31 + uSeed * 1.7 + hang * 10.4) * (0.026 + react * 0.16);
        float tremor = sin(uTime * 1.25 + uSeed * 0.6 + hang * 18.0) * (0.011 + react * 0.05);
        float reach = sin(uTime * 1.02 + uSeed * 0.7 + hang * 8.2) * 0.48 * react * wide;
        float sideCurl = side * sin(uTime * 0.76 + uSeed * 0.4 + hang * 5.6) * 0.22 * react * body;
        p.x += (curl + tide + tremor + reach + sideCurl) * wide * free * flow;
        p.z += (sin(uTime * 0.42 + uSeed + hang * 5.0) * 0.052 * hang + abs(side) * 0.024 + react * hang * 0.34) * free * flow;
        p.y += (sin(uTime * 0.24 + uSeed + hang * 3.7) * 0.022 * hang + react * hang * 0.16) * free * flow;
        vEdge = 1.0 - smoothstep(0.28, 0.5, abs(side));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      varying float vEdge;
      varying float vHang;
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uSeed;
      uniform float uActive;

      float band(float x) {
        return pow(max(0.0, sin(x)), 14.0);
      }

      void main() {
        vec2 uv = vUv;
        float hang = clamp(vHang, 0.0, 1.0);
        float free = smoothstep(0.14, 0.28, hang);
        uv.x += sin(uTime * 0.16 + uSeed + hang * 5.8) * (0.006 + uActive * 0.008) * free;
        vec4 tex = texture2D(uMap, clamp(uv, 0.0, 1.0));
        float mask = smoothstep(0.18, 0.46, tex.a);
        if (mask <= 0.002) {
          discard;
        }
        float end = 1.0;
        float root = 1.0 - smoothstep(0.18, 0.28, hang);
        float gloss = band(hang * 34.0 - uTime * 0.48 + uSeed) * (0.08 + uActive * 0.08) * free;
        float rootGlass = band(hang * 28.0 + uSeed * 0.7) * 0.035 * root;
        float pearl = pow(vEdge, 4.0) * 0.045;
        vec3 cyan = vec3(0.0, 0.9, 1.0);
        vec3 violet = vec3(0.64, 0.13, 1.0);
        vec3 color = tex.rgb * 1.04;
        color += mix(cyan, violet, clamp(tex.r + uSeed * 0.04, 0.0, 1.0)) * (gloss + rootGlass + pearl + root * 0.12 + uActive * 0.12 * hang * free);
        float alpha = tex.a * mask * end * (0.66 + gloss * 0.22 + rootGlass + pearl + root * 0.08 + uActive * 0.16 * free);
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.8));
      }
    `
  }) as SceneMaterial;
}

function shadowMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;

      void main() {
        vec2 p = (vUv - 0.5) / vec2(0.72, 0.28);
        float core = exp(-dot(p, p) * 2.4);
        float caustic = pow(max(0.0, sin((vUv.x + vUv.y * 0.35) * 48.0 + uTime * 0.9)), 18.0);
        vec3 color = vec3(0.02, 0.22, 0.28) * core + vec3(0.0, 0.8, 1.0) * caustic * core * 0.16;
        float alpha = core * (0.18 + uActive * 0.06);
        gl_FragColor = vec4(color, alpha);
      }
    `
  }) as SceneMaterial;
}

function mistMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;
      uniform vec2 uResolution;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(41.7, 289.3))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec2 ratio = vec2(uResolution.x / max(1.0, uResolution.y), 1.0);
        vec2 p = (vUv - 0.5) * ratio;
        float shaft = (1.0 - smoothstep(0.12, 0.92, vUv.y)) * smoothstep(-0.55, 0.28, p.x) * (1.0 - smoothstep(0.15, 0.9, p.x));
        float rays = pow(max(0.0, sin((p.x + p.y * 0.42) * 16.0 + uTime * 0.18)), 8.0);
        float haze = noise(p * 3.2 + vec2(uTime * 0.025, -uTime * 0.018));
        vec3 color = vec3(0.06, 0.72, 0.9) * shaft * (0.04 + rays * 0.05 + haze * 0.025);
        color += vec3(0.78, 0.22, 1.0) * haze * 0.012 * (1.0 - smoothstep(0.12, 0.85, vUv.y));
        gl_FragColor = vec4(color, 0.38 + uActive * 0.18);
      }
    `
  }) as SceneMaterial;
}

function crestMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;

      void main() {
        vUv = uv;
        vec3 p = position;
        float wave = sin(uTime * 1.1 + p.x * 17.0 + p.y * 4.0);
        p.z += wave * (0.004 + uActive * 0.007);
        p.y += wave * 0.002;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;

      void main() {
        float tip = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.84, 1.0, vUv.y));
        float ring = pow(max(0.0, sin(vUv.y * 26.0 - uTime * 1.4)), 12.0);
        vec3 color = mix(vec3(0.06, 0.78, 1.0), vec3(0.82, 0.28, 1.0), vUv.x);
        color += vec3(1.0) * ring * 0.35;
        float alpha = (0.07 + ring * 0.08 + uActive * 0.045) * tip;
        gl_FragColor = vec4(color, alpha);
      }
    `
  }) as SceneMaterial;
}

function sailMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;

      void main() {
        vUv = uv;
        vec3 p = position;
        float flap = sin(uTime * 0.95 + uv.x * 7.2) * sin(uv.y * 3.14159265);
        p.z += flap * (0.01 + uActive * 0.016);
        p.y += flap * 0.004;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform float uActive;

      void main() {
        float edge = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
        float ribs = pow(max(0.0, sin(vUv.x * 124.0 + sin(vUv.y * 4.0) * 1.4)), 13.0);
        float gloss = pow(max(0.0, sin(vUv.x * 12.0 - uTime * 0.85 + vUv.y * 5.0)), 10.0);
        vec3 cyan = vec3(0.08, 0.82, 1.0);
        vec3 violet = vec3(0.62, 0.2, 1.0);
        vec3 pearl = vec3(0.94, 0.98, 1.0);
        vec3 color = mix(cyan, violet, vUv.x * 0.9);
        color += pearl * (ribs * 0.4 + gloss * 0.36);
        float alpha = (0.11 + ribs * 0.22 + gloss * 0.11 + uActive * 0.06) * edge;
        gl_FragColor = vec4(color, alpha);
      }
    `
  }) as SceneMaterial;
}

function strandMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 }
    },
    vertexShader: `
      attribute float aSide;
      attribute float aAlong;
      attribute float aShade;
      varying float vSide;
      varying float vAlong;
      varying float vShade;

      void main() {
        vSide = aSide;
        vAlong = aAlong;
        vShade = aShade;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vSide;
      varying float vAlong;
      varying float vShade;
      uniform float uTime;
      uniform float uActive;

      void main() {
        float core = pow(1.0 - abs(vSide), 2.2);
        float taper = pow(1.0 - vAlong, 0.45);
        float pearl = pow(max(0.0, sin(vAlong * 90.0 - uTime * 4.1 + vShade * 6.2831853)), 18.0);
        float coil = pow(max(0.0, sin(vAlong * 30.0 + vShade * 9.0)), 8.0) * 0.45;
        vec3 cyan = vec3(0.14, 0.92, 1.0);
        vec3 blue = vec3(0.03, 0.16, 0.92);
        vec3 violet = vec3(0.64, 0.18, 1.0);
        vec3 color = mix(cyan, violet, vShade);
        color = mix(color, blue, smoothstep(0.46, 1.0, vAlong) * 0.45);
        color += vec3(0.95, 0.98, 1.0) * (pearl * 0.95 + coil * 0.25);
        float alpha = (0.08 + core * 0.42 + pearl * 0.28 + coil * 0.12) * taper;
        alpha *= 0.62 + uActive * 0.42;
        gl_FragColor = vec4(color, alpha);
      }
    `
  }) as SceneMaterial;
}

function braidMaterial(): SceneMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uActive: { value: 0 }
    },
    vertexShader: `
      attribute float aSide;
      attribute float aAlong;
      attribute float aShade;
      varying float vSide;
      varying float vAlong;
      varying float vShade;

      void main() {
        vSide = aSide;
        vAlong = aAlong;
        vShade = aShade;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vSide;
      varying float vAlong;
      varying float vShade;
      uniform float uTime;
      uniform float uActive;

      void main() {
        float side = abs(vSide);
        float core = pow(1.0 - side, 1.15);
        float edge = pow(1.0 - side, 6.0);
        float taper = pow(1.0 - vAlong, 0.34);
        float joints = pow(max(0.0, sin(vAlong * 118.0 + vShade * 8.0)), 14.0);
        float helix = pow(max(0.0, sin(vAlong * 46.0 + vSide * 5.4 - uTime * 1.2)), 8.0);
        float wet = pow(max(0.0, sin(vAlong * 19.0 - uTime * 0.7 + vShade * 4.0)), 18.0);
        vec3 midnight = vec3(0.015, 0.07, 0.28);
        vec3 blue = vec3(0.04, 0.28, 0.92);
        vec3 cyan = vec3(0.20, 0.94, 1.0);
        vec3 violet = vec3(0.56, 0.12, 1.0);
        vec3 pearl = vec3(0.92, 0.98, 1.0);
        vec3 color = mix(blue, violet, vShade * 0.68);
        color = mix(midnight, color, core);
        color += cyan * (edge * 0.18 + helix * 0.24);
        color += pearl * (joints * 0.72 + wet * 0.42);
        float alpha = (0.18 + core * 0.5 + joints * 0.26 + helix * 0.18 + wet * 0.16) * taper;
        alpha *= 0.72 + uActive * 0.38;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.88));
      }
    `
  }) as SceneMaterial;
}

function pointTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 128;
  const ctx = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;

  if (!ctx) {
    throw new Error("Unable to create point texture");
  }

  const grad = ctx.createRadialGradient(size * 0.34, size * 0.28, 1, size * 0.5, size * 0.5, size * 0.48);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.26, "rgba(140,250,255,0.82)");
  grad.addColorStop(0.58, "rgba(130,48,255,0.36)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCrest(material: SceneMaterial) {
  const group = new THREE.Group();
  const count = 36;

  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const u = mix(0.095, 0.88, t);
    const shape = outline(u);
    const s = Math.sin(Math.PI * u) ** 0.8;
    const x = u - 0.5;
    const base = shape.top + 0.006;
    const height = mix(0.018, 0.112, s);
    const lean = mix(-0.028, 0.03, t);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - 0.006, base + 0.012, 0.105 * s),
      new THREE.Vector3(x + lean * 0.38, base - height * 0.48, 0.16 * s),
      new THREE.Vector3(x + lean, base - height, 0.04 + 0.055 * s)
    ]);
    const tube = new THREE.TubeGeometry(curve, 12, mix(0.0032, 0.008, s), 7, false);
    const mesh = new THREE.Mesh(tube, material);
    mesh.renderOrder = 6;
    group.add(mesh);
  }

  return group;
}

function sailGeometry() {
  const xSeg = 72;
  const ySeg = 10;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= ySeg; y += 1) {
    const v = y / ySeg;
    for (let x = 0; x <= xSeg; x += 1) {
      const t = x / xSeg;
      const u = mix(0.085, 0.895, t);
      const shape = outline(u);
      const s = Math.sin(Math.PI * u) ** 0.78;
      const height = mix(0.04, 0.165, s);
      const lean = mix(-0.026, 0.034, t);
      const px = u - 0.5 + lean * v;
      const py = shape.top + 0.008 - height * v;
      const pz = 0.064 + s * 0.07 + Math.sin(t * Math.PI) * v * 0.035;
      positions.push(px, py, pz);
      uvs.push(t, v);
    }
  }

  for (let y = 0; y < ySeg; y += 1) {
    for (let x = 0; x < xSeg; x += 1) {
      const a = y * (xSeg + 1) + x;
      indices.push(a, a + 1, a + xSeg + 1, a + 1, a + xSeg + 2, a + xSeg + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRibbon(strand: Strand, material: SceneMaterial, family: Ribbon["family"] = "vine") {
  const count = strand.parts.length;
  const positions = new Float32Array(count * 2 * 3);
  const sides = new Float32Array(count * 2);
  const alongs = new Float32Array(count * 2);
  const shades = new Float32Array(count * 2);
  const indices: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const t = i / Math.max(1, count - 1);
    const base = i * 2;
    sides[base] = -1;
    sides[base + 1] = 1;
    alongs[base] = t;
    alongs[base + 1] = t;
    shades[base] = strand.color;
    shades[base + 1] = strand.color;
  }

  for (let i = 0; i < count - 1; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(positions, 3);
  const side = new THREE.BufferAttribute(sides, 1);
  const along = new THREE.BufferAttribute(alongs, 1);
  const shade = new THREE.BufferAttribute(shades, 1);
  geometry.setAttribute("position", position);
  geometry.setAttribute("aSide", side);
  geometry.setAttribute("aAlong", along);
  geometry.setAttribute("aShade", shade);
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = family === "flow" ? 1.7 : family === "lace" ? 4.2 : family === "braid" ? 3.85 : 3;

  return {
    strand,
    mesh,
    position,
    side,
    along,
    shade,
    family
  };
}

function updateRibbon(ribbon: Ribbon, active: number) {
  const { strand, position } = ribbon;
  const values = position.array as Float32Array;

  for (let i = 0; i < strand.parts.length; i += 1) {
    const smoothness = ribbon.family === "braid" ? 2 : 0;
    const p = sample(strand.parts, i, smoothness);
    const prev = sample(strand.parts, Math.max(0, i - (smoothness ? 2 : 1)), smoothness);
    const next = sample(strand.parts, Math.min(strand.parts.length - 1, i + (smoothness ? 2 : 1)), smoothness);
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const t = i / Math.max(1, strand.parts.length - 1);
    const taper = ribbon.family === "lace"
      ? 1 - t * 0.76
      : ribbon.family === "braid"
        ? 1 - t * 0.48
        : ribbon.family === "flow"
          ? 1 - t * 0.4
          : 1 - t * 0.66;
    const response = ribbon.family === "braid" ? 0.28 : ribbon.family === "lace" ? 0.32 : 0.46;
    const width = strand.width * (1.12 + active * response) * taper + (ribbon.family === "braid" ? 0.44 : ribbon.family === "lace" ? 0.18 : 0.24);
    const z = 8 + strand.depth + Math.sin(t * Math.PI + strand.phase) * (ribbon.family === "lace" ? 12 : 22);
    const base = i * 6;

    values[base] = p.x + nx * width;
    values[base + 1] = p.y + ny * width;
    values[base + 2] = z;
    values[base + 3] = p.x - nx * width;
    values[base + 4] = p.y - ny * width;
    values[base + 5] = z;
  }

  position.needsUpdate = true;
}

function updateBeads(geometry: THREE.BufferGeometry, ribbons: Ribbon[], active: number, time: number) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const color = geometry.getAttribute("color") as THREE.BufferAttribute;
  const positions = position.array as Float32Array;
  const colors = color.array as Float32Array;
  let cursor = 0;

  for (const ribbon of ribbons) {
    const { strand } = ribbon;
    const every = ribbon.family === "braid" ? 3 : ribbon.family === "lace" ? 4 : strand.width > 2.3 ? 5 : 8;

    for (let i = 3; i < strand.parts.length; i += every) {
      const p = strand.parts[i];
      const t = i / Math.max(1, strand.parts.length - 1);
      const bead = ribbon.family === "braid" ? 0.76 + active * 0.36 : ribbon.family === "lace" ? 0.62 + active * 0.44 : 0.36 + active * 0.54;
      const glint = Math.sin(time * 0.006 + strand.phase + t * 20) * bead;
      const c = tint(0x39f4ff, 0xa955ff, strand.color);
      const base = cursor * 3;
      positions[base] = p.x + Math.sin(strand.phase + i) * strand.width * (0.72 + active * 0.72);
      positions[base + 1] = p.y;
      positions[base + 2] = 20 + strand.depth + Math.sin(t * Math.PI + strand.phase) * 24;
      colors[base] = c.r + glint * 0.18;
      colors[base + 1] = c.g + glint * 0.18;
      colors[base + 2] = c.b + glint * 0.18;
      cursor += 1;
    }
  }

  for (let i = cursor * 3; i < positions.length; i += 3) {
    positions[i] = -10000;
    positions[i + 1] = -10000;
    positions[i + 2] = 0;
    colors[i] = 0;
    colors[i + 1] = 0;
    colors[i + 2] = 0;
  }

  position.needsUpdate = true;
  color.needsUpdate = true;
}

export function mount(root: HTMLElement, options: MountOptions = {}): Mount {
  const image = options.image ?? "/artifacts/head.png";
  const tentaclesImage = options.tentacles ?? "/artifacts/tentacles.png";
  const cordImages = options.cords ?? ["/artifacts/cord-01.png", "/artifacts/cord-02.png", "/artifacts/cord-03.png"];
  const market = options.market ?? "/market";
  const compose = options.compose ?? "/compose";
  const badges = partnerBadges.map(badgeTag).join("");

  root.innerHTML = `
    <main class="shell cm-app-shell cm-app-shell--luminescent">
      <div class="backdrop cm-app-shell__backdrop" aria-hidden="true">
        <div class="cm-app-shell__grid bg-grid-pattern"></div>
        <div class="cm-app-shell__gradient"></div>
        <div class="cm-app-shell__scanline"></div>
        <div class="stage" aria-hidden="true"></div>
        <div class="veil" aria-hidden="true"></div>
      </div>

      <div class="scroll cm-app-shell__content">
      <section class="panel hero" aria-label="Compose.Market Manowar landing">
        <div class="hero-title">
          <p class="cm-kicker">Symbiotic Superintelligence</p>
          <h1 class="cm-display">COMPOSE<br /><em>THE FUTURE</em></h1>
        </div>

        <article class="float-card card-a cm-glass cm-cell" aria-label="Agent mesh">
          <p class="cm-kicker">03</p>
          <p class="cm-copy">Agents observe, negotiate access, compose services, and settle through protocol-native identity and payments.</p>
        </article>
        <article class="float-card card-b cm-glass cm-cell" aria-label="Reactive flow">
          <p class="cm-kicker">Reactive Flow</p>
          <p class="cm-copy">Hover or press a block to pull the live tentacle chains into protocol flow.</p>
        </article>
        <article class="float-card card-c cm-glass cm-cell" aria-label="Payment state">
          <p class="cm-kicker">Payment</p>
          <p class="cm-copy">x402 routes budgets across composed autonomous services.</p>
        </article>
        <article class="card-chip chip-a cm-glass cm-cell" data-tone="purple" aria-hidden="true">
          <strong>Secure</strong>
          <span>ERC8004</span>
        </article>

        <div class="hero-mid">
          <p class="lede cm-copy">compose.market is marketplace for autonomous agents. Create, lease, and compose AI workflows powered by the Manowar Framework.</p>
          <p class="protocol">ERC8004 Identity &amp; x402 Payments on Avalanche</p>
          <div class="actions" aria-label="Primary actions">
            <a class="action cm-button cm-button-primary primary" href="${market}">Explore Market <span aria-hidden="true">-&gt;</span></a>
            <a class="action cm-button cm-button-secondary secondary" href="${compose}">Start Composing</a>
          </div>
        </div>

      </section>

        <section class="panel deck-panel" aria-label="Protocol highlights">
          <div class="panel-copy band cm-glass neon-border">
            <p class="cm-kicker">Living protocol surface</p>
            <h2 class="cm-display">EVERY BLOCK<br /><em>CONNECTED</em></h2>
            <p class="cm-copy">Each panel is part of the same organism: the background grid, luminescence, and Man O War remain locked while the product surface scrolls through it.</p>
          </div>
          <div class="features band">
          <article class="feature cm-glass cm-cell">
            <span class="cm-icon">01</span>
            <h3>ERC8004 Identity</h3>
            <p class="cm-copy">Agents own their reputation. On-chain verification keeps provenance attached to autonomous services.</p>
          </article>
          <article class="feature cm-glass cm-cell">
            <span class="cm-icon">02</span>
            <h3>x402 Payments</h3>
            <p class="cm-copy">Native streaming payments let agents pay agents autonomously for composed services rendered.</p>
          </article>
          <article class="feature cm-glass cm-cell">
            <span class="cm-icon">03</span>
            <h3>Composable Workflows</h3>
            <p class="cm-copy">Mint complex logic as Nested NFTs and lease entire swarms through a single living interface.</p>
          </article>
          </div>
        </section>

        <section class="panel metrics-panel" aria-label="Network metrics">
          <div class="stats band">
          <article class="stat cm-glass cm-cell" data-metric="agents" data-tone="cyan">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("agents")}</span><span class="stat-label">Global Agents</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://app.compose.market/market">Explore Market</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="volume" data-tone="violet">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("volume")}</span><span class="stat-label">x402 Volume</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://docs.compose.market/x402/introduction">Facilitator Docs</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="sessions" data-tone="cyan">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("sessions")}</span><span class="stat-label">Compose Key Sessions</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://docs.compose.market/inference/introduction">Inference Docs</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="downloads" data-tone="violet">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("downloads")}</span><span class="stat-label">SDK Downloads</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://www.npmjs.com/package/@compose-market/sdk">Build with our SDK</a>
          </article>
          </div>
        </section>

        <section class="panel workflow-panel" aria-label="Composer workflow">
        <div class="workflow band cm-glass neon-border">
          <div>
            <p class="cm-kicker">Composer Mesh</p>
            <h2 class="cm-display">COMPOSE THE <em>HIVE MIND</em></h2>
            <p class="cm-copy">Drag agents into a canvas, link their inputs and outputs, then deploy the full configuration to Manowar Protocol.</p>
            <div class="steps">
              <div class="step"><span class="cm-icon">01</span><span>Select specialized agents across finance, social, code, and data.</span></div>
              <div class="step"><span class="cm-icon">02</span><span>Connect logic pipes and budget limits with x402 settlement.</span></div>
              <div class="step"><span class="cm-icon">03</span><span>Deploy, lease, and earn royalties from reusable compositions.</span></div>
            </div>
          </div>
          <div class="composer cm-glass" aria-hidden="true">
            <svg class="wire" viewBox="0 0 620 360" preserveAspectRatio="none">
              <path d="M125 78 C 270 78, 230 180, 340 180" />
              <path d="M380 205 C 470 212, 438 292, 535 292" />
            </svg>
            <div class="module module-a cm-glass cm-cell"><span>Input Source</span><strong>Twitter_Stream</strong></div>
            <div class="module module-b cm-glass cm-cell"><span>Processor</span><strong>GPT-5_Analysis</strong></div>
            <div class="module module-c cm-glass cm-cell"><span>Action</span><strong>Exec_Trade</strong></div>
          </div>
        </div>
        </section>

        <section class="panel partners-panel" aria-label="Partners">
          <div class="partners band cm-glass neon-border cm-partners">
            <div class="cm-partners__backing">
              <div class="cm-partners__copy">
                <span class="cm-partners__label">Backed By</span>
                <h2 class="cm-partners__title">THE LEADERS BUILDING AI</h2>
              </div>
              <div class="cm-partners__badges">
                ${badges}
              </div>
            </div>
            ${marquee()}
          </div>
        </section>

        <section class="panel final-panel" aria-label="Final call to action">
          <div class="final band cm-glass neon-border">
            <div>
              <p class="cm-kicker">Ready to evolve?</p>
              <h2 class="cm-display">MINT AN <em>AGENT</em></h2>
              <p class="cm-copy">Join the symbiotic network. Deploy your agent or compose a new organism today.</p>
            </div>
            <a class="cm-button cm-button-primary" href="/create-agent">Mint Agent <span aria-hidden="true">-&gt;</span></a>
          </div>
          <footer class="footer band panel-foot">
            <nav aria-label="Footer links">
              <a href="https://docs.compose.market">Docs</a>
              <a href="https://github.com/compose-market">GitHub</a>
              <a href="https://x.com/compose_market">X</a>
            </nav>
            <span>COMPOSE.MARKET &copy; 2026</span>
          </footer>
        </section>
      </div>
    </main>
  `;

  const hero = root.querySelector<HTMLElement>(".shell");
  const panel = root.querySelector<HTMLElement>(".hero");
  const stage = root.querySelector<HTMLElement>(".stage");

  if (!hero || !panel || !stage) {
    throw new Error("Unable to mount Manowar scene");
  }

  const stopMetrics = pollMetrics(root);
  const params = new URLSearchParams(window.location.search);
  const testing = params.get("test") === "1";
  const forced = params.get("motion") === "reduce";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = options.reduced ?? (forced || media.matches);
  const rand = rng(options.seed ?? 13);
  const headScale = 0.9;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !testing,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: testing
  });

  renderer.domElement.className = "scene";
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000);
  camera.position.z = 500;

  const sea = seaMaterial();
  const seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sea);
  seaMesh.renderOrder = 0;
  scene.add(seaMesh);

  const mist = mistMaterial();
  const mistMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mist);
  mistMesh.renderOrder = 0.8;
  scene.add(mistMesh);

  const texture = new THREE.TextureLoader().load(image);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const tentaclesTexture = new THREE.TextureLoader().load(tentaclesImage);
  tentaclesTexture.flipY = false;
  tentaclesTexture.colorSpace = THREE.SRGBColorSpace;
  tentaclesTexture.generateMipmaps = true;
  tentaclesTexture.minFilter = THREE.LinearMipmapLinearFilter;
  tentaclesTexture.magFilter = THREE.LinearFilter;

  const cordTextures = cordImages.map((path) => {
    const cordTexture = new THREE.TextureLoader().load(path);
    cordTexture.flipY = false;
    cordTexture.colorSpace = THREE.SRGBColorSpace;
    cordTexture.generateMipmaps = true;
    cordTexture.minFilter = THREE.LinearMipmapLinearFilter;
    cordTexture.magFilter = THREE.LinearFilter;
    return cordTexture;
  });

  const bodyMat = bodyMaterial(texture);
  const float = new THREE.Mesh(bodyGeometry(), bodyMat);
  float.renderOrder = 5;
  scene.add(float);

  const shadowMat = shadowMaterial();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat);
  shadow.renderOrder = 2.1;
  scene.add(shadow);

  const sheetMat = cordMaterial(tentaclesTexture);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 96), sheetMat);
  sheet.renderOrder = 3.25;
  scene.add(sheet);

  const sailMat = sailMaterial();
  const sail = new THREE.Mesh(sailGeometry(), sailMat);
  sail.renderOrder = 5;

  const crestMat = crestMaterial();
  const crest = createCrest(crestMat);

  const gridGroup = new THREE.Group();
  scene.add(gridGroup);

  const flowGroup = new THREE.Group();
  scene.add(flowGroup);

  const tentacleGroup = new THREE.Group();
  scene.add(tentacleGroup);

  const cordGroup = new THREE.Group();
  scene.add(cordGroup);

  const flowMat = strandMaterial();
  const strandMat = strandMaterial();
  const braidMat = braidMaterial();
  const cordMat = cordTextures[0] ? cordMaterial(cordTextures[0]) : null;
  const beadGeometry = new THREE.BufferGeometry();
  const beadMaterial = new THREE.PointsMaterial({
    size: testing ? 3.2 : 5.4,
    map: pointTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const beads = new THREE.Points(beadGeometry, beadMaterial);
  beads.renderOrder = 4;
  scene.add(beads);
  const targetGlowMap = pointTexture();
  const targetGlowMat = new THREE.SpriteMaterial({
    map: targetGlowMap,
    color: 0x43efff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });
  const targetGlow = new THREE.Sprite(targetGlowMat);
  targetGlow.renderOrder = 4.65;
  scene.add(targetGlow);

  let grid = net(1, 1);
  let hover: Vec | null = null;
  let tap: Vec | null = null;
  let wake: Wake | null = null;
  let poke: Wake | null = null;
  let tapUntil = 0;
  let pokeUntil = 0;
  let hit: Hit | null = null;
  let head = 0;
  let cord = 0;
  let braid = 0;
  let line = 0;
  let b: Body = { x: 0, y: 0, w: 1, h: 1 };
  let headBox: Body = { x: 0, y: 0, w: 1, h: 1 };
  let flows: Ribbon[] = [];
  let ribbons: Ribbon[] = [];
  let cords: Cord[] = [];
  let blocks: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let dirty = true;

  hero.dataset.motion = reduced ? "reduce" : "full";
  hero.dataset.renderer = "three-webgl";
  panel.dataset.motion = hero.dataset.motion;
  panel.dataset.renderer = hero.dataset.renderer;

  const createBlocks = () => {
    gridGroup.clear();
    blocks = [];
    const geometry = new THREE.PlaneGeometry(grid.size - 4, grid.size - 4);

    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.cols; col += 1) {
        const block = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: 0x43efff,
            transparent: true,
            opacity: 0.018,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending
          })
        );
        block.position.set(col * grid.size + grid.size * 0.5, row * grid.size + grid.size * 0.5, -42);
        block.renderOrder = 4.4;
        blocks.push(block);
        gridGroup.add(block);
      }
    }
  };

  const createTentacles = (count: number) => {
    tentacleGroup.clear();
    ribbons = Array.from({ length: count }, (_, index) => {
      const root = count === 1 ? 0.5 : index / (count - 1);
      const central = 1 - clamp(Math.abs(root - 0.5) / 0.32, 0, 1);
      const braid = central > 0.16 && (index % 3 === 1 || central > 0.74);
      const lace = !braid && central > 0.34 && (index % 3 === 0 || central > 0.76);
      const sweep = !lace && !braid && (index % 7 === 0 || index % 11 === 0);
      const parts = testing
        ? (braid ? 24 : lace || sweep ? 20 : 16)
        : (braid ? 64 + Math.floor(rand() * 18) : lace ? 48 + Math.floor(rand() * 12) : sweep ? 74 + Math.floor(rand() * 22) : 46 + Math.floor(rand() * 20));
      const span = braid ? 760 + rand() * 920 : lace ? 280 + rand() * 260 : sweep ? 720 + rand() * 720 : 420 + rand() * 520;
      const strand = new Strand({ x: 0, y: 0 }, parts, span, index + 97);
      strand.width = braid ? mix(4.4, 8.8, rand()) : lace ? mix(1.0, 3.2, rand()) : sweep ? mix(1.0, 2.8, rand()) : mix(0.36, 1.5, rand());
      strand.color = braid ? mix(0.18, 0.62, rand()) : lace ? mix(0.44, 1, rand()) : sweep ? mix(0.02, 0.32, rand()) : rand() * 0.78;
      strand.curl = braid ? mix(0.42, 0.95, rand()) : lace ? mix(1.3, 3.4, rand()) : sweep ? mix(2.5, 5.1, rand()) : mix(0.45, 1.55, rand());
      strand.depth = braid ? mix(34, 68, rand()) : lace ? mix(16, 48, rand()) : sweep ? mix(4, 44, rand()) : mix(-34, 14, rand());
      const ribbon = createRibbon(strand, braid ? braidMat : strandMat, braid ? "braid" : lace ? "lace" : "vine");
      tentacleGroup.add(ribbon.mesh);
      return ribbon;
    });

    const beadCount = ribbons.reduce((total, ribbon) => {
      const every = ribbon.strand.width > 2.3 ? 3 : 7;
      return total + Math.ceil(ribbon.strand.parts.length / every);
    }, 0);
    beadGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(beadCount * 3), 3));
    beadGeometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(beadCount * 3), 3));
  };

  const createCords = (count: number) => {
    cordGroup.clear();
    const profiles = [
      { root: 0.37, length: 2.52, width: 0.072, rot: -0.016, depth: 33, sway: 0.58 },
      { root: 0.49, length: 2.62, width: 0.066, rot: 0.004, depth: 38, sway: 0.48 },
      { root: 0.62, length: 2.48, width: 0.082, rot: 0.018, depth: 32, sway: 0.54 }
    ];

    if (!cordMat) {
      cords = [];
      return;
    }

    cords = Array.from({ length: Math.min(count, cordTextures.length, profiles.length) }, (_, index) => {
      const profile = profiles[index]!;
      const geometry = new THREE.PlaneGeometry(1, 1, 18, 96);
      geometry.translate(0, 0.5, 0);
      const material = cordMat.clone() as SceneMaterial;
      material.uniforms = THREE.UniformsUtils.clone(cordMat.uniforms) as SceneMaterial["uniforms"];
      material.uniforms.uMap.value = cordTextures[index]!;
      material.uniforms.uSeed.value = rand() * tau;
      material.uniforms.uTop.value = index === 0 ? 0.047 : index === 1 ? 0.033 : 0.035;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 4.15 - index * 0.04;
      cordGroup.add(mesh);
      return {
        mesh,
        root: profile.root,
        length: profile.length,
        width: profile.width,
        phase: rand() * tau,
        depth: profile.depth,
        sway: profile.sway,
        base: { x: 0, y: 0 },
        size: { x: 1, y: 1 },
        rot: profile.rot
      };
    });
  };

  const createFlows = (count: number) => {
    flowGroup.clear();
    flows = Array.from({ length: count }, (_, index) => {
      const strand = new Strand(
        { x: 0, y: 0 },
        testing ? 18 : 44 + Math.floor(rand() * 18),
        460 + rand() * 820,
        index + 509
      );
      strand.width = mix(0.28, 1.45, rand());
      strand.color = mix(0.02, 0.85, rand());
      strand.curl = mix(1.5, 4.8, rand());
      strand.depth = mix(-110, -54, rand());
      strand.lean = mix(-1.5, 1.5, rand());
      const ribbon = createRibbon(strand, flowMat, "flow");
      ribbon.mesh.renderOrder = 1.7;
      flowGroup.add(ribbon.mesh);
      return ribbon;
    });
  };

  const placeFlows = () => {
    for (let i = 0; i < flows.length; i += 1) {
      const strand = flows[i].strand;
      const t = flows.length === 1 ? 0.5 : i / (flows.length - 1);
      const side = i % 2 === 0 ? 1 : -1;
      const root = {
        x: grid.w * mix(0.06, 0.94, t),
        y: -grid.h * mix(0.03, 0.24, Math.abs(Math.sin(i * 1.91)))
      };
      const span = grid.h * mix(0.72, 1.24, Math.abs(Math.sin(i * 2.37)));
      strand.place(root, span);

      for (let p = 0; p < strand.parts.length; p += 1) {
        const along = p / Math.max(1, strand.parts.length - 1);
        const drift = side * along ** 1.35 * grid.w * mix(0.08, 0.22, Math.abs(Math.sin(i + 0.4)));
        const wave = Math.sin(strand.phase + along * (6.5 + strand.curl)) * along * 74;
        const part = strand.parts[p];
        part.x = root.x + drift + wave;
        part.y = root.y + span * along + Math.sin(strand.phase * 0.7 + along * 7.4) * along * 32;
        part.px = part.x;
        part.py = part.y;
      }
    }
  };

  const placeTentacles = () => {
    const wide = grid.w >= 860;
    for (let i = 0; i < ribbons.length; i += 1) {
      const strand = ribbons[i].strand;
      const t = ribbons.length === 1 ? 0.5 : i / (ribbons.length - 1);
      const root = 0.5 + (t - 0.5) * 0.86;
      const arc = Math.sin(root * Math.PI);
      const jitter = Math.sin(i * 12.989 + 4.2) * 0.018;
      const x = headBox.x + headBox.w * (0.25 + (root + jitter) * 0.5);
      const y = headBox.y + headBox.h * (0.64 + arc * 0.05);
      const long = b.h * (wide ? mix(2.2, 5.8, arc) : mix(2.1, 4.8, arc));
      const span = long * mix(0.75, 1.36, Math.abs(Math.sin(i * 3.7)));
      strand.place({ x, y }, span);

      for (let p = 0; p < strand.parts.length; p += 1) {
        const along = p / Math.max(1, strand.parts.length - 1);
        const fall = strand.seg * p;
        const drift = Math.sin(strand.phase + along * (2.4 + strand.curl * 1.18)) * along ** 1.12 * (strand.width > 2.3 ? 86 : 74);
        const spiral = Math.sin(strand.phase * 0.7 + along * 6.2) * along ** 1.48 * strand.width * (strand.width > 2.3 ? 7.6 : 3.1);
        const part = strand.parts[p];
        part.x = x + drift + spiral + strand.lean * along * 34;
        part.y = y + fall * (0.92 + along * 0.08) + Math.sin(along * Math.PI + strand.phase) * 18 * along;
        part.px = part.x;
        part.py = part.y;
      }
    }
  };

  const placeCords = () => {
    const wide = grid.w >= 860;
    for (let i = 0; i < cords.length; i += 1) {
      const cord = cords[i];
      const arc = Math.sin(cord.root * Math.PI);
      const length = b.h * cord.length * (wide ? 1 : 0.86);
      const width = b.w * cord.width * (wide ? 1 : 0.88);
      const x = headBox.x + headBox.w * cord.root;
      const y = headBox.y + headBox.h * (0.58 + Math.abs(cord.root - 0.5) * 0.14 + arc * 0.005);
      cord.mesh.scale.set(width, length, 1);
      cord.mesh.position.set(x, y, cord.depth);
      cord.mesh.rotation.z = cord.rot;
      cord.base.x = x;
      cord.base.y = y;
      cord.size.x = width;
      cord.size.y = length;
    }
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    renderer.setPixelRatio(testing ? 1 : Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    camera.left = 0;
    camera.right = w;
    camera.top = 0;
    camera.bottom = h;
    camera.updateProjectionMatrix();

    grid = net(w, h, w < 700 ? 54 : 64);
    b = body(w, h);
    seaMesh.scale.set(w, h, 1);
    seaMesh.position.set(w * 0.5, h * 0.5, -90);
    sea.uniforms.uResolution.value = new THREE.Vector2(w, h);
    mistMesh.scale.set(w, h, 1);
    mistMesh.position.set(w * 0.5, h * 0.5, -70);
    mist.uniforms.uResolution.value = new THREE.Vector2(w, h);

    const headWidth = b.w * headScale;
    const headHeight = headWidth * headRatio;
    const headCenter = {
      x: b.x + b.w * 0.5,
      y: b.y + b.h * 0.48
    };
    headBox = {
      x: headCenter.x - headWidth * 0.5,
      y: headCenter.y - headHeight * 0.5,
      w: headWidth,
      h: headHeight
    };

    float.scale.set(headWidth, headWidth, headWidth);
    float.position.set(headCenter.x, headCenter.y, 24);
    shadow.scale.set(headWidth * 1.12, headHeight * 1.22, 1);
    shadow.position.set(headCenter.x, headBox.y + headBox.h * 0.96, 2);
    const sheetHeight = b.w * sheetRatio;
    const sheetTop = headBox.y + headBox.h * 0.55 - sheetHeight * sheetTopUv;
    sheet.scale.set(b.w, sheetHeight, 1);
    sheet.position.set(headCenter.x, sheetTop + sheetHeight * 0.5, 12);
    sail.scale.set(headWidth, headWidth, headWidth);
    sail.position.copy(float.position);
    crest.scale.set(headWidth, headWidth, headWidth);
    crest.position.copy(float.position);

    createBlocks();
    createFlows(testing ? (w < 700 ? 4 : 7) : (w < 700 ? 7 : 13));
    createTentacles(testing ? (w < 700 ? 12 : 18) : (w < 700 ? 24 : 38));
    createCords(w < 700 ? 2 : 3);
    placeFlows();
    placeTentacles();
    placeCords();
    dirty = false;
  };

  const block = (clientX: number, clientY: number): Vec | null => {
    const node = document.elementFromPoint(clientX, clientY);
    const active = node instanceof Element
      ? node.closest<HTMLElement>(".cm-cell, .cm-button, .cm-chip")
      : null;

    if (!active || !hero.contains(active)) {
      return null;
    }

    const heroRect = stage.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    return cell({
      x: rect.left + rect.width * 0.5 - heroRect.left,
      y: rect.top + rect.height * 0.5 - heroRect.top
    });
  };

  const cell = (point: Vec): Vec | null => {
    if (point.x < 0 || point.y < 0 || point.x > grid.w || point.y > grid.h) {
      return null;
    }

    const col = clamp(Math.floor(point.x / grid.size), 0, grid.cols - 1);
    const row = clamp(Math.floor(point.y / grid.size), 0, grid.rows - 1);
    return {
      x: Math.min(grid.w, col * grid.size + grid.size * 0.5),
      y: Math.min(grid.h, row * grid.size + grid.size * 0.5)
    };
  };

  const local = (clientX: number, clientY: number): Vec => {
    const rect = stage.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const animal = (point: Vec): Wake | null => {
    const headX = (point.x - (b.x + b.w * 0.5)) / (b.w * 0.56);
    const headY = (point.y - (b.y + b.h * 0.5)) / (b.h * 0.68);
    const inHead = headX * headX + headY * headY < 1.08;
    const canopy =
      point.x >= b.x - b.w * 0.04 &&
      point.x <= b.x + b.w * 1.04 &&
      point.y >= b.y - b.h * 0.14 &&
      point.y <= b.y + b.h * 0.82;
    const cordHit = cords.some((item) => {
      const low = clamp((point.y - item.base.y) / Math.max(1, item.size.y * 0.82), 0, 1);
      const spread = item.size.x * (0.5 + low * 0.26);
      return point.y >= item.base.y - b.h * 0.02 &&
        point.y <= item.base.y + item.size.y * 0.82 &&
        Math.abs(point.x - item.base.x) <= spread;
    });
    const braidHit =
      !cordHit &&
      point.x >= b.x + b.w * 0.32 &&
      point.x <= b.x + b.w * 0.68 &&
      point.y >= b.y + b.h * 0.78 &&
      point.y <= b.y + b.h * 2.35;
    const tail =
      point.x >= b.x + b.w * 0.18 &&
      point.x <= b.x + b.w * 0.82 &&
      point.y >= b.y + b.h * 0.78 &&
      point.y <= b.y + b.h * 3.45;

    if (inHead || canopy) {
      return { ...point, zone: "head" };
    }

    if (cordHit) {
      return { ...point, zone: "cord" };
    }

    if (braidHit) {
      return { ...point, zone: "braid" };
    }

    return tail ? { ...point, zone: "thread" } : null;
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch") {
      return;
    }

    const next = block(event.clientX, event.clientY);
    hover = next;
    wake = next ? null : animal(local(event.clientX, event.clientY));
  };

  const leave = () => {
    hover = null;
    wake = null;
  };

  const down = (event: PointerEvent) => {
    const point = block(event.clientX, event.clientY);

    if (point) {
      if (event.pointerType === "touch") {
        tap = point;
        tapUntil = performance.now() + 1800;
        return;
      }

      hover = point;
      return;
    }

    const mark = animal(local(event.clientX, event.clientY));

    if (!mark) {
      return;
    }

    if (event.pointerType === "touch") {
      poke = mark;
      pokeUntil = performance.now() + 1800;
      return;
    }

    wake = mark;
  };

  const touch = (event: TouchEvent) => {
    const first = event.changedTouches.item(0);

    if (!first) {
      return;
    }

    const point = block(first.clientX, first.clientY);

    if (point) {
      tap = point;
      tapUntil = performance.now() + 1800;
      return;
    }

    const mark = animal(local(first.clientX, first.clientY));

    if (!mark) {
      return;
    }

    poke = mark;
    pokeUntil = performance.now() + 1800;
  };

  const center = (element: HTMLElement): Vec | null => {
    const heroRect = stage.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return cell({
      x: rect.left + rect.width * 0.5 - heroRect.left,
      y: rect.top + rect.height * 0.5 - heroRect.top
    });
  };

  const nodes = Array.from(hero.querySelectorAll<HTMLElement>(".cm-cell, .cm-button, .cm-chip"));

  const enter = (event: PointerEvent) => {
    if (event.pointerType === "touch") {
      return;
    }

    hover = center(event.currentTarget as HTMLElement);
    wake = null;
  };

  const press = (event: PointerEvent) => {
    const point = center(event.currentTarget as HTMLElement);

    if (!point) {
      return;
    }

    if (event.pointerType === "touch") {
      tap = point;
      tapUntil = performance.now() + 1800;
      wake = null;
      return;
    }

    hover = point;
    wake = null;
  };

  const change = () => {
    hero.dataset.motion = options.reduced ?? (forced || media.matches) ? "reduce" : "full";
    panel.dataset.motion = hero.dataset.motion;
  };

  const vis = () => {
    visible = document.visibilityState !== "hidden";
    last = performance.now();
  };

  const frame = (time: number) => {
    raf = window.requestAnimationFrame(frame);

    if (!visible) {
      return;
    }

    if (dirty) {
      resize();
    }

    const nowReduced = options.reduced ?? (forced || media.matches);
    const dt = clamp((time - last) / 1000, 0.001, 0.033);
    last = time;

    if (tap && time > tapUntil) {
      tap = null;
    }

    if (poke && time > pokeUntil) {
      poke = null;
    }

    const activeCell = tap ?? hover;
    const activeWake = poke ?? wake;

    if (activeCell) {
      pulse(grid, activeCell, nowReduced ? 0.76 : testing ? 3.5 : 1.72);
    }

    fade(grid, nowReduced ? 0.965 : testing ? 0.985 : 0.925);
    hit = focus(grid);
    const rate = clamp(dt * 60, 0.25, 2);
    const headWant = activeWake?.zone === "head" && !nowReduced ? 1 : 0;
    const cordWant = activeWake?.zone === "cord" && !nowReduced ? 1 : 0;
    const braidWant = activeWake?.zone === "braid" && !nowReduced ? 1 : 0;
    const lineWant = activeWake?.zone === "thread" && !nowReduced ? 1 : 0;
    head = clamp(head + (headWant - head) * (headWant > head ? 0.18 : 0.055) * rate, 0, 1);
    cord = clamp(cord + (cordWant - cord) * (cordWant > cord ? 0.34 : 0.075) * rate, 0, 1);
    braid = clamp(braid + (braidWant - braid) * (braidWant > braid ? 0.18 : 0.055) * rate, 0, 1);
    line = clamp(line + (lineWant - line) * (lineWant > line ? 0.18 : 0.055) * rate, 0, 1);
    const activeBase = hit?.strength ?? 0;
    const blockActive = nowReduced
      ? 0
      : clamp(activeBase * (grid.w < 700 ? 1.45 : 1.18) + (activeCell ? 0.08 : 0), 0, 1);
    const animalActive = Math.max(head, cord, braid, line);
    const active = clamp(blockActive * 0.24 + animalActive, 0, 1);
    const target = activeWake ?? hit ?? { x: b.x + b.w * 0.54, y: b.y + b.h * 1.58, strength: 0, total: 0 };
    const uvTarget = new THREE.Vector2(clamp((target.x - b.x) / b.w, 0, 1), clamp((target.y - b.y) / Math.max(1, b.h * 2.15), 0, 1));
    const blockTarget = hit ?? { x: b.x + b.w * 0.54, y: b.y + b.h * 1.58, strength: 0, total: 0 };
    const screenTarget = new THREE.Vector2(clamp(blockTarget.x / grid.w, 0, 1), clamp(blockTarget.y / grid.h, 0, 1));
    const glowSize = grid.size * (testing ? 3.4 : 2.8);
    targetGlow.position.set(blockTarget.x, blockTarget.y, -36);
    targetGlow.scale.set(glowSize, glowSize, 1);
    targetGlowMat.opacity = nowReduced || !hit ? 0 : clamp(blockActive * (testing ? 0.42 : 0.18), 0, testing ? 0.56 : 0.26);
    const bodyRoll = nowReduced ? 0 : Math.sin(time * 0.00042) * 0.006 + head * 0.014;
    const bodyYaw = nowReduced ? 0 : Math.sin(time * 0.0003) * 0.032 + head * 0.04;
    const bodyRoot = { x: b.x + b.w * 0.5, y: b.y + b.h * 0.48 };
    const clock = nowReduced ? 0 : time * 0.001;
    const pace = nowReduced ? 0 : 1;
    const braidActive = clamp(blockActive + braid, 0, 1);

    sea.uniforms.uTime.value = clock;
    sea.uniforms.uActive.value = hit ? (nowReduced ? 0 : hit.strength) : animalActive * 0.12;
    sea.uniforms.uTarget.value = screenTarget;
    mist.uniforms.uTime.value = clock;
    mist.uniforms.uActive.value = hit ? (nowReduced ? 0 : hit.strength * 0.44) : animalActive * 0.1;
    shadowMat.uniforms.uTime.value = clock;
    shadowMat.uniforms.uActive.value = active;
    bodyMat.uniforms.uTime.value = clock;
    bodyMat.uniforms.uActive.value = head;
    bodyMat.uniforms.uTarget.value = uvTarget;
    sailMat.uniforms.uTime.value = clock;
    sailMat.uniforms.uActive.value = head;
    crestMat.uniforms.uTime.value = clock;
    crestMat.uniforms.uActive.value = head;
    flowMat.uniforms.uTime.value = clock;
    flowMat.uniforms.uActive.value = nowReduced ? 0.02 : 0.14 + blockActive * 0.08 + animalActive * 0.04;
    strandMat.uniforms.uTime.value = clock;
    strandMat.uniforms.uActive.value = 0;
    braidMat.uniforms.uTime.value = clock;
    braidMat.uniforms.uActive.value = braidActive;
    sheetMat.uniforms.uTime.value = clock;
    sheetMat.uniforms.uStill.value = nowReduced ? 1 : 0;
    sheetMat.uniforms.uActive.value = clamp(cord * 0.22, 0, 1);

    for (const item of cords) {
      const material = item.mesh.material;
      material.uniforms.uTime.value = clock;
      material.uniforms.uStill.value = nowReduced ? 1 : 0;
      material.uniforms.uActive.value = cord;
      const root = spin(item.base, bodyRoot, bodyRoll);
      const swim = cord * item.sway;
      const pulse = 1 + swim * Math.sin(time * 0.0012 + item.phase) * 0.16;
      item.mesh.rotation.z = item.rot + bodyRoll + Math.sin(time * 0.00086 + item.phase) * 0.12 * swim;
      item.mesh.position.x = root.x;
      item.mesh.position.y = root.y;
      item.mesh.scale.set(item.size.x * (1 + swim * 0.08), item.size.y * pulse, 1);
    }

    for (let i = 0; i < blocks.length; i += 1) {
      const value = grid.cells[i] ?? 0;
      blocks[i].material.opacity = clamp(0.02 + value * (testing ? 10.5 : 2.55), 0.02, 1);
      blocks[i].material.color.setHSL(0.52 + value * 0.22, 0.98, (testing ? 0.74 : 0.54) + value * (testing ? 0.33 : 0.16));
      blocks[i].scale.setScalar(1 + value * (testing ? 0.08 : 0.025));
    }

    for (const ribbon of flows) {
      ribbon.strand.step(dt * 0.65 * pace, null, nowReduced ? 0.02 : 0.08, nowReduced, time, grid);
      updateRibbon(ribbon, nowReduced ? 0.03 : 0.12);
    }

    for (const ribbon of ribbons) {
      const familyActive =
        ribbon.family === "braid"
          ? braidActive
          : 0;
      const familyPace = ribbon.family === "braid" ? 0.62 : ribbon.family === "lace" ? 0.78 : 1;
      const familyTarget = ribbon.family === "braid"
        ? hit ?? (braid && activeWake?.zone === "braid" ? { ...activeWake, strength: braid, total: 1 } : null)
        : null;
      ribbon.strand.step(dt * familyPace * pace, familyTarget, familyActive, nowReduced, time, grid);
      updateRibbon(ribbon, familyActive);
    }
    updateBeads(beadGeometry, ribbons, braidActive, nowReduced ? 0 : time);

    float.rotation.z = bodyRoll;
    float.rotation.y = bodyYaw;
    sail.rotation.copy(float.rotation);
    crest.rotation.copy(float.rotation);

    renderer.render(scene, camera);
  };

  const observer = new ResizeObserver(() => {
    dirty = true;
  });
  observer.observe(hero);
  hero.addEventListener("pointermove", move);
  hero.addEventListener("pointerdown", down);
  hero.addEventListener("touchstart", touch, { passive: true });
  hero.addEventListener("pointerleave", leave);
  for (const node of nodes) {
    node.addEventListener("pointerenter", enter);
    node.addEventListener("pointermove", enter);
    node.addEventListener("pointerdown", press);
  }
  document.addEventListener("visibilitychange", vis);
  media.addEventListener("change", change);

  // Marquee pause on hover
  const marqueeEl = root.querySelector<HTMLElement>(".cm-partner-marquee");
  const marqueeToggle = (paused: boolean) => {
    if (!marqueeEl) return;
    const tracks = marqueeEl.querySelectorAll<HTMLElement>(".cm-partner-marquee__inner");
    for (const track of tracks) {
      track.style.animationPlayState = paused ? "paused" : "running";
    }
  };
  const enterMarquee = () => marqueeToggle(true);
  const leaveMarquee = () => marqueeToggle(false);
  marqueeEl?.addEventListener("pointerenter", enterMarquee);
  marqueeEl?.addEventListener("pointerleave", leaveMarquee);

  resize();
  raf = window.requestAnimationFrame(frame);

  return {
    destroy() {
      stopMetrics();
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerdown", down);
      hero.removeEventListener("touchstart", touch);
      hero.removeEventListener("pointerleave", leave);
      for (const node of nodes) {
        node.removeEventListener("pointerenter", enter);
        node.removeEventListener("pointermove", enter);
        node.removeEventListener("pointerdown", press);
      }
      document.removeEventListener("visibilitychange", vis);
      media.removeEventListener("change", change);
      marqueeEl?.removeEventListener("pointerenter", enterMarquee);
      marqueeEl?.removeEventListener("pointerleave", leaveMarquee);
      sea.dispose();
      seaMesh.geometry.dispose();
      mist.dispose();
      mistMesh.geometry.dispose();
      shadowMat.dispose();
      shadow.geometry.dispose();
      sheetMat.dispose();
      sheet.geometry.dispose();
      bodyMat.dispose();
      texture.dispose();
      tentaclesTexture.dispose();
      for (const cordTexture of cordTextures) {
        cordTexture.dispose();
      }
      float.geometry.dispose();
      sailMat.dispose();
      sail.geometry.dispose();
      crestMat.dispose();
      crest.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
        }
      });
      flowMat.dispose();
      strandMat.dispose();
      braidMat.dispose();
      cordMat?.dispose();
      targetGlowMap.dispose();
      targetGlowMat.dispose();
      beadGeometry.dispose();
      beadMaterial.map?.dispose();
      beadMaterial.dispose();
      for (const block of blocks) {
        block.geometry.dispose();
        block.material.dispose();
      }
      for (const ribbon of ribbons) {
        ribbon.mesh.geometry.dispose();
      }
      for (const ribbon of flows) {
        ribbon.mesh.geometry.dispose();
      }
      for (const cord of cords) {
        cord.mesh.geometry.dispose();
        cord.mesh.material.dispose();
      }
      renderer.dispose();
      root.innerHTML = "";
    }
  };
}
