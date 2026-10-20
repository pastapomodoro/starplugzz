"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { getProduct, PLATFORMS, PLATFORM_LABEL, type Platform } from "@/data/products";
import { useRoute } from "@/lib/platform";
import { MacGlyph, WindowGlyph } from "./icons";
import {AssetIcon} from "./AssetIcon";

const SLIDE = { type: "spring", bounce: 0.15, duration: 0.45 } as const;

function hrefFor(target: Platform, slug: string | null) {
  // On a product page, stay on the same product if it exists for the other platform.
  const product = slug ? getProduct(slug) : undefined;
  return product?.platforms.includes(target) ? `/${target}/${product.slug}` : `/${target}`;
}

export function PlatformSwitch() {
  const { platform, slug } = useRoute();

  return (
    <nav
      aria-label="Platform"
      className="glass flex items-center gap-0.5 p-1 [--radius:9999px]"
    >
      {PLATFORMS.map((p) => {
        const active = p === platform;
        const Glyph = p === "mac" ? MacGlyph : WindowGlyph;
        return (
          <Link
            key={p}
            href={hrefFor(p, slug)}
            aria-current={active ? "page" : undefined}
            className="relative flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium sm:px-4"
          >
            {active && (
              <motion.span
                layoutId="platform-pill"
                transition={SLIDE}
                className="absolute inset-0 rounded-full bg-white/90 shadow-[0_1px_2px_rgb(20_40_80/0.1),0_4px_12px_-4px_rgb(20_40_80/0.2)]"
              />
            )}
            <AssetIcon
              name={p === "mac" ? "icon-mac" : "icon-windows"}
              className="relative -my-1 hidden size-6 sm:block"
              fallback={
                <Glyph className={`relative hidden size-4 transition-colors duration-300 sm:block ${active ? "text-ink" : "text-ink-soft"}`} />
              }
            />
            <span className={`relative transition-colors duration-300 ${active ? "text-ink" : "text-ink-soft"}`}>
              {PLATFORM_LABEL[p]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
