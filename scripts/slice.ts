import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const source = path.join(root, "file_00000000c2707246964168d4011d7842.png");
const out = path.join(dir, "../assets/slices/manowar.png");
const full = path.join(dir, "../assets/slices/manowar-full.png");

const crop = {
  left: 62,
  top: 172,
  width: 900,
  height: 330
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

async function main() {
  await mkdir(path.dirname(out), { recursive: true });

  const raw = await sharp(source)
    .extract(crop)
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

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
    .png({ compressionLevel: 9 })
    .toFile(out);

  await sharp(source)
    .extract({
      left: crop.left,
      top: crop.top,
      width: crop.width,
      height: 1180
    })
    .png({ compressionLevel: 9 })
    .toFile(full);

  console.log(`wrote ${path.relative(root, out)}`);
  console.log(`wrote ${path.relative(root, full)}`);
}

await main();
