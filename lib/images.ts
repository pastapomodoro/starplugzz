import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { ASSET_FILES, type AssetName, type Assets } from "./asset-names";

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** `url` (a path under /public) if the file is there, otherwise null. */
export function publicImage(url: string | undefined): string | null {
  if (!url) return null;
  return existsSync(path.join(PUBLIC_DIR, url.replace(/^\//, ""))) ? url : null;
}

/** Which generated artwork exists right now; components fall back to CSS for the rest. */
export function getAssets(): Assets {
  return Object.fromEntries(
    (Object.keys(ASSET_FILES) as AssetName[]).map((name) => [name, publicImage(`/generated/${ASSET_FILES[name]}`)]),
  ) as Assets;
}
