/**
 * Generates the site's artwork (FLUX.2 Pro via OpenRouter, or Nano Banana via the Gemini API).
 *
 *   npm run images                     generate everything that's missing
 *   npm run images -- --only=mascot    one or more groups (comma separated)
 *   npm run images -- --file=mascot/mascot-stand.png   only these files (comma separated)
 *   npm run images -- --force          regenerate even if the file exists
 *   npm run images:dry                 list what would be generated
 *   npm run images -- --rekey          redo cut-out/trim from .image-raw/ (no API calls)
 *
 * Prompts live in scripts/image-prompts.json (shared style prefix + per-group
 * prefix + per-item prompt). Output goes to public/generated/.
 *
 * Provider, from .env.local (keys never leave this script):
 *   OPENROUTER_API_KEY  → OpenRouter Images API (used when present)
 *   GEMINI_API_KEY      → Gemini API directly
 */
import { GoogleGenAI } from "@google/genai";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

type Item = {
  file: string;
  prompt: string;
  reference?: string;
  aspect_ratio?: string;
  /** Resize after trimming so CSS can slice the image in fixed pixel units. */
  fit_height?: number;
  fit_width?: number;
  /** Recolour the neutral parts (white, grey, silver plastic) to this hex colour, keeping their shading. */
  tint?: string;
  /** Add this many px of soft sky above a scene, so its character can sit lower on wide screens. */
  extend_top?: number;
};
type Group = {
  aspect_ratio: string;
  image_size: string;
  prefix?: string;
  chroma_key?: boolean;
  /** Crop transparent margins after the cut-out. */
  trim?: boolean;
  /** Turn turquoise/teal (which reads green) into sky blue. */
  azure?: boolean;
  /** OpenRouter model for this group instead of the default (e.g. an image-editing model for compositions). */
  openrouter_model?: string;
  /** Leave out the shared style prefix (scenes that need their own art direction). */
  skip_style?: boolean;
  items: Item[];
};
type Config = {
  model: string;
  openrouter_model: string;
  style_prefix: string;
  groups: Record<string, Group>;
};
/** Renders one image and returns its bytes (any format sharp can read). */
type Renderer = (prompt: string, group: Group, reference: Buffer | null) => Promise<Buffer>;

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "generated");
/** Untouched provider output, so cut-out and trimming can be redone without paying again. */
const RAW_DIR = path.join(ROOT, ".image-raw");
const config = JSON.parse(readFileSync(path.join(ROOT, "scripts", "image-prompts.json"), "utf8")) as Config;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const rekey = args.includes("--rekey");
const onlyFiles = args
  .find((a) => a.startsWith("--file="))
  ?.slice("--file=".length)
  .split(",")
  .filter(Boolean);
const only = args
  .find((a) => a.startsWith("--only="))
  ?.slice("--only=".length)
  .split(",")
  .filter(Boolean);

const CONCURRENCY = 3;

if (existsSync(path.join(ROOT, ".env.local"))) process.loadEnvFile(path.join(ROOT, ".env.local"));
const openRouterKey = process.env.OPENROUTER_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

let totalCost = 0;

/**
 * Parameter names the OpenRouter model's endpoint accepts (models differ:
 * FLUX.2 Pro has no `resolution`, Nano Banana has no `output_format`).
 */
async function openRouterParams(model: string): Promise<Set<string>> {
  const res = await fetch(`https://openrouter.ai/api/v1/images/models/${model}/endpoints`);
  if (!res.ok) throw new Error(`cannot read ${model} capabilities: ${res.status}`);
  const json = (await res.json()) as { endpoints?: { supported_parameters?: Record<string, unknown> }[] };
  return new Set(Object.keys(json.endpoints?.[0]?.supported_parameters ?? {}));
}
const supportedByModel = new Map<string, Set<string>>();

/** OpenRouter Images API: https://openrouter.ai/docs/guides/overview/multimodal/image-generation */
const renderWithOpenRouter: Renderer = async (prompt, group, reference) => {
  const model = group.openrouter_model ?? config.openrouter_model;
  if (!supportedByModel.has(model)) supportedByModel.set(model, await openRouterParams(model));
  const supported = supportedByModel.get(model)!;
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "X-Title": "StarPlugzz",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      ...(supported.has("aspect_ratio") && { aspect_ratio: group.aspect_ratio }),
      ...(supported.has("resolution") && { resolution: group.image_size }),
      ...(supported.has("output_format") && { output_format: "png" }),
      ...(reference &&
        supported.has("input_references") && {
          input_references: [
            { type: "image_url", image_url: { url: `data:image/png;base64,${reference.toString("base64")}` } },
          ],
        }),
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data?: { b64_json?: string }[]; usage?: { cost?: number } };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image in response");
  totalCost += json.usage?.cost ?? 0;
  return Buffer.from(b64, "base64");
};

/** Gemini Interactions API, straight to Google. */
const renderWithGemini: Renderer = async (prompt, group, reference) => {
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const interaction = await ai.interactions.create({
    model: config.model,
    input: reference
      ? [
          { type: "text" as const, text: prompt },
          { type: "image" as const, mime_type: "image/png" as const, data: reference.toString("base64") },
        ]
      : prompt,
    store: false,
    response_format: {
      type: "image",
      mime_type: "image/png",
      aspect_ratio: group.aspect_ratio,
      image_size: group.image_size,
    },
  });
  const image = interaction.output_image;
  if (!image?.data) throw new Error("no image in response");
  return Buffer.from(image.data, "base64");
};

const provider = openRouterKey ? "openrouter" : geminiKey ? "gemini" : null;
if (!dryRun && !rekey && !provider) {
  console.error("Missing key. Add OPENROUTER_API_KEY or GEMINI_API_KEY to .env.local (see .env.local.example).");
  process.exit(1);
}
const render: Renderer = provider === "openrouter" ? renderWithOpenRouter : renderWithGemini;

/**
 * Turns the cut-out backdrop into transparency. Models never paint exactly
 * #FF00FF (often a hot pink, sometimes vignetted), so the key colour is sampled
 * from the image corners. A pixel counts as backdrop when it is close to that
 * colour, or has the same hue at a lower brightness; edge pixels get partial
 * alpha and the backdrop colour is un-mixed out of them.
 */
async function chromaKey(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (x: number, y: number) => (y * w + x) * 4;

  // Median of 8×8 patches in the four corners.
  const samples: number[][] = [];
  for (const [cx, cy] of [[0, 0], [w - 8, 0], [0, h - 8], [w - 8, h - 8]]) {
    for (let y = cy; y < cy + 8; y++) for (let x = cx; x < cx + 8; x++) samples.push([data[at(x, y)], data[at(x, y) + 1], data[at(x, y) + 2]]);
  }
  const median = (k: number) => samples.map((p) => p[k]).sort((p, q) => p - q)[samples.length >> 1];
  const key = [median(0), median(1), median(2)];
  const keyMax = Math.max(...key, 1);
  const keyNorm = key.map((v) => v / keyMax);

  const SOLID = 45; // closer than this: fully transparent
  const EDGE = 120; // farther than this: fully opaque
  for (let i = 0; i < data.length; i += 4) {
    const p = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(...p);
    const dist = Math.hypot(p[0] - key[0], p[1] - key[1], p[2] - key[2]);
    // Same hue, darker: the backdrop in shadow or vignette.
    const hueDist = max < 8 ? 999 : Math.hypot(...p.map((v, k) => (v / max - keyNorm[k]) * 255));
    const d = Math.min(dist, hueDist);
    if (d >= EDGE) continue;
    if (d <= SOLID) {
      // Fully clear, colour included, so trimming sees one uniform background.
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
      continue;
    }
    const a = (d - SOLID) / (EDGE - SOLID);
    data[i + 3] = Math.round(data[i + 3] * a);
    // Un-mix: pixel = a·fg + (1−a)·key  →  fg = (pixel − (1−a)·key) / a
    for (let k = 0; k < 3; k++) data[i + k] = Math.max(0, Math.min(255, Math.round((p[k] - (1 - a) * key[k]) / a)));
  }

  // Faint leftovers (soft shadows, noise) would show as thin lines once a skin is stretched.
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 24) data[i - 3] = data[i - 2] = data[i - 1] = data[i] = 0;
  }

  // Glass reflects the pink backdrop. The palette has no pink, so pull it to
  // blue: red drops to green wherever blue also beats green (yellow is untouched).
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > g + 24 && b > g) data[i] = Math.round(g + (r - g) * 0.15);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/**
 * Recolours neutral pixels (low saturation: white/grey/silver plastic) to `hex`,
 * mapping their brightness onto a dark→light ramp of that colour so gloss and
 * shading survive. Coloured parts (the blue glass, the water) are left alone.
 */
async function tintNeutrals(png: Buffer, hex: string): Promise<Buffer> {
  const base = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
  const dark = base.map((v) => Math.round(v * 0.7));
  const light = base.map((v) => Math.round(v + (255 - v) * 0.18));
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const sat = max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
    if (sat > 0.3) continue;
    // Bluish whites are glass highlights, not plastic: tinting them yellow over blue reads green.
    const blueness = b - Math.max(r, g);
    if (blueness > 14) continue;
    const weight = (sat < 0.15 ? 1 : (0.3 - sat) / 0.15) * (blueness > 4 ? (14 - blueness) / 10 : 1);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // White plastic sits in the bright end, so spread 0.5–0.95 over the whole ramp;
    // only the very brightest specular streaks stay near white.
    const pos = Math.min(1, Math.max(0, (lum - 0.5) / 0.45));
    const shine = Math.max(0, (lum - 0.97) / 0.03);
    for (let k = 0; k < 3; k++) {
      const ramp = dark[k] + (light[k] - dark[k]) * pos;
      const target = ramp + (255 - ramp) * shine * 0.6;
      data[i + k] = Math.round(data[i + k] * (1 - weight) + target * weight);
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** Rotates teal hues (150°–195°) into sky blue (~198°–205°), keeping lightness and saturation. */
async function azure(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d < 0.06) continue; // greys and whites
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    if (h < 150 || h > 195) continue;
    const nh = 198 + ((h - 150) / 45) * 7;
    // HSL → RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((nh / 60) % 2) - 1));
    const m = l - c / 2;
    const [r1, g1, b1] = nh < 240 ? [0, x, c] : [x, 0, c]; // 180–240° sector
    data[i] = Math.round((r1 + m) * 255);
    data[i + 1] = Math.round((g1 + m) * 255);
    data[i + 2] = Math.round((b1 + m) * 255);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** Cut-out, trim and size normalisation, from the raw provider image. */
/**
 * Grows a scene upward: the top edge, mirrored and heavily blurred, becomes extra sky, and the
 * original fades into it over a band so there is no seam. Only soft clouds live up there.
 */
async function extendTop(png: Buffer, px: number): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(png).metadata();
  const fade = Math.round(px / 2);
  const sky = await sharp(png)
    .extract({ left: 0, top: 0, width, height: px + fade })
    .flip()
    .blur(24)
    .png()
    .toBuffer();
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="${height}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${fade / height}" stop-color="#fff" stop-opacity="1"/>` +
      `</linearGradient><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`,
  );
  const faded = await sharp(png).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return sharp({ create: { width, height: height + px, channels: 4, background: "#ffffff" } })
    .composite([
      { input: sky, top: 0, left: 0 },
      { input: faded, top: px, left: 0 },
    ])
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
}

async function finish(raw: Buffer, spec: Group, item: Item): Promise<Buffer> {
  let png: Buffer = await sharp(raw).png().toBuffer();
  if (spec.chroma_key) {
    // Models sometimes leave a 1–2px line along the image edges: shave it off
    // so it can't survive the cut-out (it would block trimming and streak 9-slices).
    const { width = 0, height = 0 } = await sharp(png).metadata();
    const shave = 6;
    png = await sharp(png)
      .extract({ left: shave, top: shave, width: width - shave * 2, height: height - shave * 2 })
      .png()
      .toBuffer();
    png = await chromaKey(png);
  }
  if (spec.trim) png = await sharp(png).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 }).png().toBuffer();
  if (item.tint) png = await tintNeutrals(png, item.tint);
  if (item.extend_top) png = await extendTop(png, item.extend_top);
  if (spec.azure) png = await azure(png);
  if (item.fit_height || item.fit_width) {
    png = await sharp(png)
      .resize({ height: item.fit_height, width: item.fit_width, fit: "inside" })
      .png()
      .toBuffer();
  }
  return png;
}

async function generate(groupName: string, group: Group, item: Item) {
  const out = path.join(OUT_DIR, item.file);
  const prompt = [group.skip_style ? null : config.style_prefix, group.prefix, item.prompt].filter(Boolean).join("\n\n");

  // Character consistency: later mascot poses pass the first pose as a reference image.
  const refPath = item.reference ? path.join(OUT_DIR, item.reference) : null;
  // Cut-outs are sent on white: a transparent reference can come through as black.
  const reference =
    refPath && existsSync(refPath)
      ? await sharp(readFileSync(refPath)).flatten({ background: "#ffffff" }).png().toBuffer()
      : null;
  // An item may override its group's aspect ratio (e.g. mobile backgrounds).
  const spec: Group = { ...group, aspect_ratio: item.aspect_ratio ?? group.aspect_ratio };

  for (let attempt = 1; ; attempt++) {
    try {
      const raw = await render(prompt, spec, reference);
      const rawOut = path.join(RAW_DIR, item.file);
      mkdirSync(path.dirname(rawOut), { recursive: true });
      writeFileSync(rawOut, raw);

      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, await finish(raw, spec, item));
      console.log(`  ✓ ${groupName}/${path.basename(item.file)}`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const retryable = /\b(429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|timeout|fetch failed/i.test(message);
      if (!retryable || attempt >= 3) {
        console.error(`  ✗ ${groupName}/${path.basename(item.file)}: ${message}`);
        return;
      }
      const wait = 2000 * attempt ** 2;
      console.warn(`  … ${path.basename(item.file)} retry ${attempt} in ${wait / 1000}s (${message.slice(0, 80)})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift()!);
    }),
  );
}

const modelName = provider === "openrouter" ? config.openrouter_model : config.model;
console.log(`Images · ${provider ?? "no provider"} · ${modelName}${dryRun ? " · dry run" : ""}`);

for (const [groupName, group] of Object.entries(config.groups)) {
  if (only && !only.includes(groupName)) continue;

  const todo = group.items.filter(
    (item) => (!onlyFiles || onlyFiles.includes(item.file)) && (force || !existsSync(path.join(OUT_DIR, item.file))),
  );
  const skipped = group.items.length - todo.length;
  console.log(`\n${groupName}: ${todo.length} to generate${skipped ? `, ${skipped} already there` : ""}`);
  if (dryRun) {
    todo.forEach((item) => console.log(`  · ${item.file}`));
    continue;
  }
  if (rekey) {
    for (const item of group.items) {
      const rawPath = path.join(RAW_DIR, item.file);
      if (!existsSync(rawPath)) continue;
      const spec: Group = { ...group, aspect_ratio: item.aspect_ratio ?? group.aspect_ratio };
      writeFileSync(path.join(OUT_DIR, item.file), await finish(readFileSync(rawPath), spec, item));
      console.log(`  ↻ ${item.file}`);
    }
    continue;
  }

  // Items with a reference wait for the items they reference; the rest run in parallel.
  const independent = todo.filter((item) => !item.reference);
  const dependent = todo.filter((item) => item.reference);
  await runPool(independent, (item) => generate(groupName, group, item));
  await runPool(dependent, (item) => generate(groupName, group, item));
}

if (totalCost > 0) console.log(`\nCost reported by OpenRouter: $${totalCost.toFixed(3)}`);
