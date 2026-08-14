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

export type Part = Vec & {
  px: number;
  py: number;
};

export type Bounds = {
  w: number;
  h: number;
};

export const tau = Math.PI * 2;

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export const smooth = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function sample(parts: Part[], index: number, radius: number): Vec {
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

