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
  market?: string;
  compose?: string;
  reduced?: boolean;
  seed?: number;
};

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

type Ribbon = {
  strand: Strand;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  position: THREE.BufferAttribute;
  side: THREE.BufferAttribute;
  along: THREE.BufferAttribute;
  shade: THREE.BufferAttribute;
};

type SceneMaterial = THREE.ShaderMaterial & {
  uniforms: Record<string, { value: unknown }>;
};

const tau = Math.PI * 2;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const smooth = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function tint(a: number, b: number, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
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
    const want = reduced ? 0.66 : 0.72 + active * 0.9;
    this.reach += (want - this.reach) * (reduced ? 0.025 : 0.074) * rate;

    const drag = reduced ? 0.84 : 0.908;
    const pullTarget = target && !reduced && active > 0.01
      ? {
          x: target.x,
          y: Math.max(target.y, this.root.y + 44)
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
      const current = reduced ? 0.09 : 1;

      part.px = part.x;
      part.py = part.y;
      part.x += vx + (wave * 0.86 + cross * 0.36 + slow * this.curl * 0.58 + this.lean * 0.08) * current * rate;
      part.y += vy + (0.1 + along * 0.15) * current * rate;

      if (pullTarget) {
        const pull = active * along ** 2.16 * 0.105 * rate;
        const spread = Math.sin(this.phase) * 34 * along * active;
        part.x += (pullTarget.x + spread - part.x) * pull;
        part.y += (pullTarget.y - part.y) * pull;
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
  const bw = clamp(w * (wide ? 0.48 : 0.9), 340, 730);
  const bh = bw * 0.42;
  const cx = wide ? w * 0.68 : w * 0.52;
  const y = wide ? h * 0.105 : h * 0.045;
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

        gl_FragColor = vec4(color, 1.0);
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

function createRibbon(strand: Strand, material: SceneMaterial) {
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
  mesh.renderOrder = 3;

  return {
    strand,
    mesh,
    position,
    side,
    along,
    shade
  };
}

function updateRibbon(ribbon: Ribbon, active: number) {
  const { strand, position } = ribbon;
  const values = position.array as Float32Array;

  for (let i = 0; i < strand.parts.length; i += 1) {
    const p = strand.parts[i];
    const prev = strand.parts[Math.max(0, i - 1)];
    const next = strand.parts[Math.min(strand.parts.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const t = i / Math.max(1, strand.parts.length - 1);
    const width = strand.width * (1.2 + active * 0.5) * (1 - t * 0.62) + 0.28;
    const z = 8 + strand.depth + Math.sin(t * Math.PI + strand.phase) * 22;
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
    const every = strand.width > 2.3 ? 3 : 7;

    for (let i = 3; i < strand.parts.length; i += every) {
      const p = strand.parts[i];
      const t = i / Math.max(1, strand.parts.length - 1);
      const bead = 0.45 + active * 0.65;
      const glint = Math.sin(time * 0.006 + strand.phase + t * 20) * bead;
      const c = tint(0x39f4ff, 0xa955ff, strand.color);
      const base = cursor * 3;
      positions[base] = p.x + Math.sin(strand.phase + i) * strand.width * (0.8 + active);
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
  const image = options.image ?? "/manowar.png";
  const market = options.market ?? "/market";
  const compose = options.compose ?? "/compose";

  root.innerHTML = `
    <main class="shell">
      <section class="hero" aria-label="Compose.Market Manowar landing">
        <div class="stage" aria-hidden="true"></div>
        <div class="veil" aria-hidden="true"></div>
        <div class="copy">
          <p class="eyebrow">PHYSALIA INTERFACE</p>
          <h1>COMPOSE.<br />MARKET</h1>
          <p class="lede">Create, lease, and compose autonomous agents in a living market powered by the Manowar framework.</p>
          <div class="actions" aria-label="Primary actions">
            <a class="action primary" href="${market}">Explore Market</a>
            <a class="action secondary" href="${compose}">Open Composer</a>
          </div>
        </div>
        <div class="rail" aria-hidden="true">
          <span>ERC8004</span>
          <span>x402</span>
          <span>Agents</span>
          <span>Workflows</span>
        </div>
      </section>
      <section class="reef" aria-label="Protocol highlights">
        <div class="metric"><span>01</span><strong>Identity</strong><p>Agents own reputation and provenance on-chain.</p></div>
        <div class="metric"><span>02</span><strong>Payments</strong><p>Native x402 flows keep composed services liquid.</p></div>
        <div class="metric"><span>03</span><strong>Composition</strong><p>Build workflows that behave like networked organisms.</p></div>
      </section>
    </main>
  `;

  const hero = root.querySelector<HTMLElement>(".hero");
  const stage = root.querySelector<HTMLElement>(".stage");

  if (!hero || !stage) {
    throw new Error("Unable to mount Manowar scene");
  }

  const params = new URLSearchParams(window.location.search);
  const testing = params.get("test") === "1";
  const forced = params.get("motion") === "reduce";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = options.reduced ?? (forced || media.matches);
  const rand = rng(options.seed ?? 13);
  const renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: !testing,
    powerPreference: "high-performance",
    preserveDrawingBuffer: testing
  });

  renderer.domElement.className = "scene";
  renderer.setClearColor(0x020607, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000);
  camera.position.z = 500;

  const sea = seaMaterial();
  const seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sea);
  seaMesh.renderOrder = 0;
  scene.add(seaMesh);

  const texture = new THREE.TextureLoader().load(image);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const bodyMat = bodyMaterial(texture);
  const float = new THREE.Mesh(bodyGeometry(), bodyMat);
  float.renderOrder = 5;
  scene.add(float);

  const sailMat = sailMaterial();
  const sail = new THREE.Mesh(sailGeometry(), sailMat);
  sail.renderOrder = 5;

  const crestMat = crestMaterial();
  const crest = createCrest(crestMat);

  const gridGroup = new THREE.Group();
  scene.add(gridGroup);

  const tentacleGroup = new THREE.Group();
  scene.add(tentacleGroup);

  const strandMat = strandMaterial();
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

  let grid = net(1, 1);
  let hover: Vec | null = null;
  let tap: Vec | null = null;
  let tapUntil = 0;
  let hit: Hit | null = null;
  let b: Body = { x: 0, y: 0, w: 1, h: 1 };
  let ribbons: Ribbon[] = [];
  let blocks: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let dirty = true;

  hero.dataset.motion = reduced ? "reduce" : "full";
  hero.dataset.renderer = "three-webgl";

  const createBlocks = () => {
    gridGroup.clear();
    blocks = [];
    const geometry = new THREE.PlaneGeometry(grid.size - 7, grid.size - 7);

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
      const heavy = central > 0.18 && (index % 2 === 0 || central > 0.68);
      const sweep = !heavy && (index % 9 === 0 || index % 13 === 0);
      const parts = testing
        ? (heavy || sweep ? 20 : 16)
        : (heavy ? 72 + Math.floor(rand() * 18) : sweep ? 68 + Math.floor(rand() * 20) : 42 + Math.floor(rand() * 18));
      const span = heavy ? 520 + rand() * 520 : sweep ? 620 + rand() * 640 : 360 + rand() * 460;
      const strand = new Strand({ x: 0, y: 0 }, parts, span, index + 97);
      strand.width = heavy ? mix(2.6, 7.6, rand()) : sweep ? mix(2.0, 4.6, rand()) : mix(0.45, 2.2, rand());
      strand.color = heavy ? mix(0.5, 1, rand()) : sweep ? mix(0.04, 0.34, rand()) : rand() * 0.8;
      strand.curl = heavy ? mix(1.0, 2.8, rand()) : sweep ? mix(2.2, 4.3, rand()) : mix(0.35, 1.2, rand());
      strand.depth = heavy ? mix(-4, 42, rand()) : sweep ? mix(12, 52, rand()) : mix(-28, 18, rand());
      const ribbon = createRibbon(strand, strandMat);
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

  const placeTentacles = () => {
    const wide = grid.w >= 860;
    for (let i = 0; i < ribbons.length; i += 1) {
      const strand = ribbons[i].strand;
      const t = ribbons.length === 1 ? 0.5 : i / (ribbons.length - 1);
      const root = 0.5 + (t - 0.5) * 0.86;
      const arc = Math.sin(root * Math.PI);
      const jitter = Math.sin(i * 12.989 + 4.2) * 0.018;
      const x = b.x + b.w * (0.25 + (root + jitter) * 0.5);
      const y = b.y + b.h * (0.84 + arc * 0.08);
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

  const resize = () => {
    const rect = hero.getBoundingClientRect();
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

    float.scale.set(b.w, b.w, b.w);
    float.position.set(b.x + b.w * 0.5, b.y + b.h * 0.48, 24);
    sail.scale.set(b.w, b.w, b.w);
    sail.position.copy(float.position);
    crest.scale.set(b.w, b.w, b.w);
    crest.position.copy(float.position);

    createBlocks();
    createTentacles(testing ? (w < 700 ? 12 : 18) : (w < 700 ? 24 : 38));
    placeTentacles();
    dirty = false;
  };

  const local = (event: PointerEvent): Vec => {
    const rect = hero.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
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

  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch") {
      return;
    }

    hover = cell(local(event));
  };

  const leave = () => {
    hover = null;
  };

  const down = (event: PointerEvent) => {
    const point = cell(local(event));

    if (!point) {
      return;
    }

    if (event.pointerType === "touch") {
      tap = point;
      tapUntil = performance.now() + 1800;
      return;
    }

    hover = point;
  };

  const touch = (event: TouchEvent) => {
    const first = event.changedTouches.item(0);

    if (!first) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    const point = cell({ x: first.clientX - rect.left, y: first.clientY - rect.top });

    if (!point) {
      return;
    }

    tap = point;
    tapUntil = performance.now() + 1800;
  };

  const change = () => {
    hero.dataset.motion = options.reduced ?? (forced || media.matches) ? "reduce" : "full";
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

    const activeCell = tap ?? hover;

    if (activeCell) {
      pulse(grid, activeCell, nowReduced ? 0.58 : 1);
    }

    fade(grid, nowReduced ? 0.965 : 0.925);
    hit = focus(grid);
    const active = nowReduced ? 0 : hit?.strength ?? 0;
    const target = hit ?? { x: b.x + b.w * 0.54, y: b.y + b.h * 1.58, strength: 0, total: 0 };
    const uvTarget = new THREE.Vector2(clamp((target.x - b.x) / b.w, 0, 1), clamp((target.y - b.y) / Math.max(1, b.h * 2.15), 0, 1));
    const screenTarget = new THREE.Vector2(clamp(target.x / grid.w, 0, 1), clamp(target.y / grid.h, 0, 1));

    sea.uniforms.uTime.value = time * 0.001;
    sea.uniforms.uActive.value = hit ? (nowReduced ? 0.3 : hit.strength) : 0;
    sea.uniforms.uTarget.value = screenTarget;
    bodyMat.uniforms.uTime.value = time * 0.001;
    bodyMat.uniforms.uActive.value = active;
    bodyMat.uniforms.uTarget.value = uvTarget;
    sailMat.uniforms.uTime.value = time * 0.001;
    sailMat.uniforms.uActive.value = active;
    crestMat.uniforms.uTime.value = time * 0.001;
    crestMat.uniforms.uActive.value = active;
    strandMat.uniforms.uTime.value = time * 0.001;
    strandMat.uniforms.uActive.value = active;

    for (let i = 0; i < blocks.length; i += 1) {
      const value = grid.cells[i] ?? 0;
      blocks[i].material.opacity = 0.018 + value * 0.68;
      blocks[i].material.color.setHSL(0.52 + value * 0.22, 0.95, 0.54 + value * 0.16);
    }

    for (const ribbon of ribbons) {
      ribbon.strand.step(dt, hit, active, nowReduced, time, grid);
      updateRibbon(ribbon, active);
    }
    updateBeads(beadGeometry, ribbons, active, time);

    const sway = nowReduced ? 0.002 : 0.006;
    float.rotation.z = Math.sin(time * 0.00042) * sway + active * 0.012;
    float.rotation.y = Math.sin(time * 0.0003) * (nowReduced ? 0.012 : 0.032) + active * 0.035;
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
  document.addEventListener("visibilitychange", vis);
  media.addEventListener("change", change);
  resize();
  raf = window.requestAnimationFrame(frame);

  return {
    destroy() {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerdown", down);
      hero.removeEventListener("touchstart", touch);
      hero.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", vis);
      media.removeEventListener("change", change);
      sea.dispose();
      seaMesh.geometry.dispose();
      bodyMat.dispose();
      texture.dispose();
      float.geometry.dispose();
      sailMat.dispose();
      sail.geometry.dispose();
      crestMat.dispose();
      crest.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
        }
      });
      strandMat.dispose();
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
      renderer.dispose();
      root.innerHTML = "";
    }
  };
}
