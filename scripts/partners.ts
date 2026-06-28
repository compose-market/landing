import path from "node:path";
import { access, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

type Asset = {
  source: string;
  output: string;
  width: number;
  height: number;
};

const dir = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(dir, "..");
const sourceRoot = path.join(app, "assets/partners");
const publicRoot = path.join(app, "public/partners");

const logos = [
  "11labs.png",
  "aiven.png",
  "alibaba.png",
  "anam.png",
  "asicloud.png",
  "azure-ai.png",
  "cartesia.png",
  "chroma.png",
  "cloudflare.png",
  "composio.png",
  "confluent.png",
  "confidence.png",
  "couchbase.png",
  "datadog.png",
  "deepgram.png",
  "deepinfra.png",
  "digitalocean.png",
  "fireworks-ai.png",
  "intercom.png",
  "lambda.png",
  "linkup.png",
  "massive.png",
  "mem0.png",
  "mixpanel.png",
  "modal.png",
  "mongodb.png",
  "neo4j.png",
  "neon.png",
  "nvidia.png",
  "openai.png",
  "perplexity.png",
  "posthog.png",
  "quicknode.png",
  "redis.png",
  "roboflow.png",
  "telnyx.png",
  "temporal.png",
  "thirdweb.png",
  "vertex-ai.png"
] as const;

const assets: Asset[] = [
  ...logos.map((source) => ({
    source,
    output: source.replace(/\.(png|jpe?g|webp)$/i, ".webp"),
    width: 720,
    height: 240
  })),
  {
    source: "badges/nvidia-badge.png",
    output: "badges/nvidia-badge.webp",
    width: 900,
    height: 360
  },
  {
    source: "badges/microsoft-badge.png",
    output: "badges/microsoft-badge.webp",
    width: 900,
    height: 360
  }
];

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function convert(asset: Asset) {
  const source = path.join(sourceRoot, asset.source);
  const output = path.join(publicRoot, asset.output);
  const legacy = path.join(publicRoot, asset.source);

  if (!await exists(source)) {
    throw new Error(`Missing partner source: ${path.relative(app, source)}`);
  }

  await mkdir(path.dirname(output), { recursive: true });
  await sharp(source)
    .resize({
      width: asset.width,
      height: asset.height,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3
    })
    .webp({ quality: 88, alphaQuality: 95, smartSubsample: true, effort: 6 })
    .toFile(output);
  await rm(legacy, { force: true });
  console.log(`wrote ${path.relative(app, output)}`);
}

await Promise.all(assets.map(convert));
