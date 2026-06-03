import path from "node:path";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

type Point = {
  x: number;
  y: number;
  r: number;
};

type Spec = {
  file: string;
  trace: Point[];
  width: number;
  height: number;
  exposure: number;
};

type Raw = {
  data: Buffer;
  info: sharp.OutputInfo;
};

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const app = path.resolve(dir, "..");
const source = path.resolve(process.env.MANOWAR_SOURCE ?? path.join(app, "assets/source.png"));
const publicArtifacts = path.join(app, "public/artifacts");
const tmp = path.join(app, "tmp");

const headCrop = {
  left: 62,
  top: 172,
  width: 900,
  height: 330
};

const crop = {
  left: 62,
  top: 172,
  width: 900,
  height: 1180
};

const canvas = {
  width: 384,
  height: 1180
};

const cords: Spec[] = [
  {
    file: "cord-01.png",
    width: 300,
    height: 1180,
    exposure: 1.03,
    trace: [
      { x: 324, y: 326, r: 10 },
      { x: 320, y: 440, r: 12 },
      { x: 311, y: 560, r: 13 },
      { x: 292, y: 694, r: 14 },
      { x: 254, y: 824, r: 15 },
      { x: 247, y: 914, r: 14 },
      { x: 296, y: 956, r: 10 }
    ]
  },
  {
    file: "cord-02.png",
    width: 290,
    height: 1180,
    exposure: 1.035,
    trace: [
      { x: 438, y: 312, r: 11 },
      { x: 439, y: 430, r: 14 },
      { x: 436, y: 555, r: 15 },
      { x: 431, y: 704, r: 14 },
      { x: 416, y: 870, r: 12 },
      { x: 412, y: 1038, r: 11 },
      { x: 410, y: 1165, r: 9 }
    ]
  },
  {
    file: "cord-03.png",
    width: 340,
    height: 1180,
    exposure: 1.02,
    trace: [
      { x: 584, y: 320, r: 12 },
      { x: 606, y: 440, r: 15 },
      { x: 630, y: 570, r: 18 },
      { x: 638, y: 700, r: 20 },
      { x: 604, y: 842, r: 18 },
      { x: 548, y: 982, r: 16 },
      { x: 505, y: 1146, r: 12 }
    ]
  }
];

const artifacts = [
  "head.png",
  "manowar-full.png",
  "tentacles.png",
  ...cords.map((item) => item.file),
  "manifest.json"
];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const smooth = (edge0: number, edge1: number, value: number) => {
  const span = edge1 - edge0;
  const t = clamp((value - edge0) / (Math.abs(span) < 0.0001 ? 0.0001 : span), 0, 1);
  return t * t * (3 - 2 * t);
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function lower(x: number, width: number) {
  const u = clamp(x / width, 0, 1);
  const arch = Math.sin(Math.PI * clamp((u - 0.03) / 0.88, 0, 1));
  const left = (1 - u) ** 2.3;
  const right = smooth(0.68, 0.94, u);
  return 216 + 132 * Math.max(0, arch) ** 0.56 + 13 * Math.sin(u * Math.PI * 2.1) - 42 * left + 74 * right;
}

function window(x: number, y: number, width: number) {
  const fall = smooth(360, 1080, y);
  const left = mix(34, 164, fall) - 26 * smooth(300, 500, y);
  const right = mix(842, 638, fall) + 20 * smooth(300, 520, y);
  return smooth(left, left + 18, x) * smooth(right, right - 18, x);
}

function matter(r: number, g: number, b: number, a: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const alpha = smooth(18, 128, a);
  const blue = smooth(26, 110, b) * smooth(0.03, 0.18, sat) * smooth(0.72, 1.08, b / Math.max(1, r));
  const cyan = smooth(32, 120, g) * smooth(42, 142, b) * smooth(0.02, 0.14, sat) * (1 - smooth(178, 244, r));
  const purple = smooth(32, 126, r) * smooth(58, 162, b) * smooth(0.72, 1.16, b / Math.max(1, g));
  const pearl = smooth(116, 224, luma) * smooth(0.012, 0.08, sat) * smooth(90, 220, b);
  return clamp(Math.max(blue, cyan, purple, pearl) * alpha, 0, 1);
}

function segment(x: number, y: number, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy || 1;
  const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / len, 0, 1);
  const px = a.x + dx * t;
  const py = a.y + dy * t;
  const radius = mix(a.r, b.r, t);
  return 1 - smooth(radius, radius + Math.max(4, radius * 0.45), Math.hypot(x - px, y - py));
}

function tube(x: number, y: number, trace: Point[]) {
  let value = 0;

  for (let i = 0; i < trace.length - 1; i += 1) {
    value = Math.max(value, segment(x, y, trace[i], trace[i + 1]));
  }

  return value;
}

function clean(raw: Raw, alpha: Uint8Array, strong: Uint8Array) {
  const size = raw.info.width * raw.info.height;
  const weak = new Uint8Array(size);
  const comp = new Int32Array(size);
  const queue = new Int32Array(size);
  const keep = new Uint8Array(size);
  comp.fill(-1);

  for (let i = 0; i < size; i += 1) {
    weak[i] = alpha[i] > 4 ? 1 : 0;
  }

  let id = 0;

  for (let start = 0; start < size; start += 1) {
    if (!weak[start] || comp[start] >= 0) {
      continue;
    }

    let head = 0;
    let tail = 0;
    let count = 0;
    let hasStrong = false;
    let left = raw.info.width;
    let top = raw.info.height;
    let right = -1;
    let bottom = -1;
    queue[tail] = start;
    tail += 1;
    comp[start] = id;

    while (head < tail) {
      const point = queue[head];
      head += 1;
      count += 1;

      if (strong[point]) {
        hasStrong = true;
      }

      const x = point % raw.info.width;
      const y = Math.floor(point / raw.info.width);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);

      for (let yy = -1; yy <= 1; yy += 1) {
        for (let xx = -1; xx <= 1; xx += 1) {
          if (xx === 0 && yy === 0) {
            continue;
          }

          const nx = x + xx;
          const ny = y + yy;

          if (nx < 0 || ny < 0 || nx >= raw.info.width || ny >= raw.info.height) {
            continue;
          }

          const next = ny * raw.info.width + nx;

          if (weak[next] && comp[next] < 0) {
            comp[next] = id;
            queue[tail] = next;
            tail += 1;
          }
        }
      }
    }

    const wide = right - left;
    const tall = bottom - top;
    const valid = hasStrong && (count > 28 || tall > 16) && !(tall < 6 && wide > 90);

    if (valid) {
      for (let i = 0; i < tail; i += 1) {
        keep[queue[i]] = 1;
      }
    }

    id += 1;
  }

  return keep;
}

function bound(raw: Raw): Box {
  const box = {
    left: raw.info.width,
    top: raw.info.height,
    right: -1,
    bottom: -1
  };

  for (let y = 0; y < raw.info.height; y += 1) {
    for (let x = 0; x < raw.info.width; x += 1) {
      const alpha = raw.data[(y * raw.info.width + x) * raw.info.channels + 3];

      if (alpha <= 4) {
        continue;
      }

      box.left = Math.min(box.left, x);
      box.top = Math.min(box.top, y);
      box.right = Math.max(box.right, x);
      box.bottom = Math.max(box.bottom, y);
    }
  }

  if (box.right < box.left || box.bottom < box.top) {
    throw new Error("Artifact mask produced no visible pixels");
  }

  const pad = 16;
  box.left = clamp(box.left - pad, 0, raw.info.width - 1);
  box.top = clamp(box.top - pad, 0, raw.info.height - 1);
  box.right = clamp(box.right + pad, 0, raw.info.width - 1);
  box.bottom = clamp(box.bottom + pad, 0, raw.info.height - 1);
  return box;
}

async function writeOutput(out: string, file: string, buffer: Buffer) {
  const target = path.join(out, file);
  await writeFile(target, buffer);
  console.log(`wrote ${path.relative(root, target)}`);
}

async function head(out: string) {
  const raw = await sharp(source)
    .extract(headCrop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = raw;
  const fade = Math.floor(info.height * 0.7);
  const clear = Math.floor(info.height * 0.99);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * info.channels;
      const alpha = index + 3;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const fromCenter = Math.abs(x / info.width - 0.5);
      const subject = Math.max(
        smooth(34, 132, max) * smooth(0.08, 0.3, sat),
        smooth(108, 190, luma)
      );
      const edge = smooth(0.02, 0.1, x / info.width) * smooth(0.02, 0.1, 1 - x / info.width);
      data[alpha] = Math.round(data[alpha] * clamp(subject * edge, 0, 1));

      if (y > fade) {
        const down = smooth(fade, clear, y);
        const center = smooth(0.49, 0.02, fromCenter);
        const cut = clamp(down * (0.76 + center * 0.72), 0, 1);
        data[alpha] = Math.round(data[alpha] * (1 - cut));
      }

      if (y > clear) {
        data[alpha] = 0;
      }
    }
  }

  const png = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const full = await sharp(source)
    .extract(crop)
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeOutput(out, "head.png", png);
  await writeOutput(out, "manowar-full.png", full);
}

async function collective(out: string) {
  const raw = await sharp(source)
    .extract(crop)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const size = raw.info.width * raw.info.height;
  const alpha = new Uint8Array(size);
  const strong = new Uint8Array(size);

  for (let y = 0; y < raw.info.height; y += 1) {
    for (let x = 0; x < raw.info.width; x += 1) {
      const point = y * raw.info.width + x;
      const index = point * raw.info.channels;
      const r = raw.data[index];
      const g = raw.data[index + 1];
      const b = raw.data[index + 2];
      const a = raw.data[index + 3];
      const edge = lower(x, raw.info.width);
      const region = smooth(edge - 10, edge + 48, y);
      const root = smooth(338, 390, y);
      const score = matter(r, g, b, a) * region * root * window(x, y, raw.info.width);
      const matte = smooth(0.02, 0.3, score) * 0.98;
      alpha[point] = Math.round(a * clamp(matte, 0, 1));
      strong[point] = alpha[point] > 24 && score > 0.2 ? 1 : 0;
    }
  }

  const keep = clean(raw, alpha, strong);
  const data = Buffer.from(raw.data);

  for (let point = 0; point < size; point += 1) {
    const index = point * raw.info.channels;

    if (!keep[point]) {
      data[index] = 2;
      data[index + 1] = 7;
      data[index + 2] = 12;
      data[index + 3] = 0;
      continue;
    }

    const a = alpha[point];
    const lift = smooth(32, 220, a);
    data[index] = Math.round(clamp(data[index] * 1.03 + lift * 2, 0, 255));
    data[index + 1] = Math.round(clamp(data[index + 1] * 1.04 + lift * 4, 0, 255));
    data[index + 2] = Math.round(clamp(data[index + 2] * 1.06 + lift * 6, 0, 255));
    data[index + 3] = a;
  }

  const png = await sharp(data, {
    raw: {
      width: raw.info.width,
      height: raw.info.height,
      channels: raw.info.channels
    }
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeOutput(out, "tentacles.png", png);

  return await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function cord(raw: Raw, spec: Spec, out: string) {
  const size = raw.info.width * raw.info.height;
  const data = Buffer.from(raw.data);
  const alpha = new Uint8Array(size);
  const strong = new Uint8Array(size);

  for (let y = 0; y < raw.info.height; y += 1) {
    for (let x = 0; x < raw.info.width; x += 1) {
      const point = y * raw.info.width + x;
      const index = point * raw.info.channels;
      const a = data[index + 3];
      const root = smooth(spec.trace[0].y + 6, spec.trace[0].y + 72, y);
      const traced = tube(x, y, spec.trace) * root;
      const score = traced * smooth(12, 122, a);
      alpha[point] = Math.round(a * smooth(0.02, 0.46, score));
      strong[point] = alpha[point] > 22 && traced > 0.45 ? 1 : 0;
    }
  }

  const keep = clean(raw, alpha, strong);

  for (let point = 0; point < size; point += 1) {
    const index = point * raw.info.channels;

    if (!keep[point]) {
      data[index] = 2;
      data[index + 1] = 7;
      data[index + 2] = 12;
      data[index + 3] = 0;
      continue;
    }

    const bright = smooth(28, 210, alpha[point]);
    data[index] = Math.round(clamp(data[index] * spec.exposure + bright * 2, 0, 255));
    data[index + 1] = Math.round(clamp(data[index + 1] * spec.exposure + bright * 4, 0, 255));
    data[index + 2] = Math.round(clamp(data[index + 2] * (spec.exposure + 0.01) + bright * 7, 0, 255));
    data[index + 3] = Math.round(clamp(alpha[point], 0, 242));
  }

  const box = bound({ data, info: raw.info });
  const cut = await sharp(data, {
    raw: {
      width: raw.info.width,
      height: raw.info.height,
      channels: raw.info.channels
    }
  })
    .extract({
      left: box.left,
      top: box.top,
      width: box.right - box.left + 1,
      height: box.bottom - box.top + 1
    })
    .resize({
      height: spec.height,
      fit: "inside",
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer();

  const meta = await sharp(cut).metadata();
  const left = Math.floor((canvas.width - Math.min(meta.width ?? spec.width, canvas.width)) * 0.5);
  const body = meta.width && meta.width > canvas.width
    ? await sharp(cut).resize({ width: canvas.width, height: spec.height, fit: "inside", kernel: sharp.kernel.lanczos3 }).png().toBuffer()
    : cut;

  const png = await sharp({
    create: {
      width: canvas.width,
      height: canvas.height,
      channels: 4,
      background: { r: 2, g: 7, b: 12, alpha: 0 }
    }
  })
    .composite([{
      input: body,
      left: Math.max(0, left),
      top: 0
    }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeOutput(out, spec.file, png);
}

async function manifest(out: string) {
  const data = {
    source: path.relative(app, source),
    generated: new Date(0).toISOString(),
    crop,
    artifacts: artifacts.filter((file) => file !== "manifest.json")
  };

  await writeOutput(out, "manifest.json", Buffer.from(`${JSON.stringify(data, null, 2)}\n`));
}

async function verify(out: string) {
  for (const file of artifacts) {
    const target = path.join(out, file);

    if (!await exists(target)) {
      throw new Error(`Missing generated artifact: ${file}`);
    }
  }
}

async function generate(out: string) {
  await mkdir(out, { recursive: true });
  await head(out);
  const raw = await collective(out);

  for (const spec of cords) {
    await cord(raw, spec, out);
  }

  await manifest(out);
  await verify(out);
}

async function replace(next: string) {
  const old = path.join(tmp, `artifacts-old-${process.pid}`);
  let moved = false;

  try {
    if (await exists(publicArtifacts)) {
      await rm(old, { force: true, recursive: true });
      await rename(publicArtifacts, old);
      moved = true;
    }

    await rename(next, publicArtifacts);

    if (moved) {
      await rm(old, { force: true, recursive: true });
    }

    await Promise.all(["cord-a.png", "cord-b.png", "cord-c.png"].map((file) => rm(path.join(app, "public", file), { force: true })));
  } catch (error) {
    if (moved && !await exists(publicArtifacts) && await exists(old)) {
      await rename(old, publicArtifacts);
    }

    throw error;
  }
}

async function main() {
  if (!await exists(source)) {
    throw new Error(`Missing Manowar source image: ${source}`);
  }

  await mkdir(tmp, { recursive: true });
  const next = path.join(tmp, `artifacts-next-${process.pid}`);
  await rm(next, { force: true, recursive: true });

  try {
    await generate(next);
    await replace(next);
  } finally {
    await rm(next, { force: true, recursive: true });
  }
}

await main();
