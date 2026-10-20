"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AssetName, Assets } from "./asset-names";

const AssetsContext = createContext<Partial<Assets>>({});

export function AssetsProvider({ assets, children }: { assets: Assets; children: ReactNode }) {
  return <AssetsContext.Provider value={assets}>{children}</AssetsContext.Provider>;
}

/** URL of a generated asset, or null (use the CSS fallback). */
export function useAsset(name: AssetName): string | null {
  return useContext(AssetsContext)[name] ?? null;
}
