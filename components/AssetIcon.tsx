"use client";

import type { ReactNode } from "react";
import { useAsset } from "@/lib/assets";
import type { Category } from "@/data/products";
import type { AssetName } from "@/lib/asset-names";

/** A generated icon, or the given SVG until it exists. */
export function AssetIcon({
  name,
  fallback,
  className = "",
}: {
  name: AssetName;
  fallback: ReactNode;
  className?: string;
}) {
  const src = useAsset(name);
  if (!src) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" aria-hidden draggable={false} decoding="async" className={`object-contain ${className}`} />;
}

export const CATEGORY_ICON: Record<Category, AssetName> = {
  Synth: "icon-synth",
  Effetti: "icon-effetti",
  Drum: "icon-drum",
  DAW: "icon-daw",
  Bundle: "icon-bundle",
};
