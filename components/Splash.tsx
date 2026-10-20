"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  CATEGORY_LABEL,
  categoryId,
  FORMATS,
  PLATFORM_LABEL,
  PLATFORMS,
  productsFor,
  SHELF_CATEGORIES,
  type Category,
  type Platform,
} from "@/data/products";
import { usePreferredPlatform } from "@/lib/platform";
import type { ShelfProduct } from "./ProductCard";
import { ProductImage } from "./ProductImage";
import { getLenis } from "./SmoothScroll";
import { CategoryGlyph, ChevronDownIcon, MacGlyph, WindowGlyph } from "./icons";
import { AssetIcon } from "./AssetIcon";

const SPRING = { type: "spring", bounce: 0.2, duration: 0.5 } as const;
/** Reduced motion: fade only, movement jumps straight to its end state. */
const CALM = { duration: 0.25, transform: { duration: 0 } } as const;

/** A clear glass pill into one platform's section. */
function PlatformButton({ platform, index }: { platform: Platform; index: number }) {
  const reduce = useReducedMotion();
  const Glyph = platform === "mac" ? MacGlyph : WindowGlyph;

  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(18px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={reduce ? CALM : { ...SPRING, delay: 0.2 + index * 0.1 }}
    >
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={SPRING}>
        <Link
          href={`/${platform}`}
          className="glass flex h-14 items-center gap-3 pr-6 pl-5 [--radius:9999px] sm:h-[68px] sm:pr-8 sm:pl-6"
        >
          <AssetIcon
            name={platform === "mac" ? "icon-mac" : "icon-windows"}
            className="size-7 sm:size-8"
            fallback={<Glyph className="size-5 text-ink-soft sm:size-6" />}
          />
          <span className="flex flex-col">
            <span className="text-[17px] leading-none font-medium tracking-[-0.01em] sm:text-[20px]">
              {PLATFORM_LABEL[platform]}
            </span>
            <span className="mt-1 text-[11px] text-ink-soft sm:text-[12px]">{FORMATS[platform].join(" · ")}</span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

const GLYPH: Record<Platform, typeof MacGlyph> = { mac: MacGlyph, windows: WindowGlyph };

/** Sections below the hero rise in as they scroll into view. */
function useReveal() {
  const reduce = useReducedMotion();
  return {
    initial: { opacity: 0, transform: "translateY(18px)" },
    whileInView: { opacity: 1, transform: "translateY(0px)" },
    viewport: { once: true, margin: "0px 0px -10% 0px" },
    transition: reduce ? CALM : { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  } as const;
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-[13px] font-medium text-ink-soft">
      {children}
    </h2>
  );
}

/** The highlighted product: big cover, name, price, and a way in for each platform. */
function Featured({ product }: { product: ShelfProduct }) {
  const reveal = useReveal();
  const preferred = usePreferredPlatform();
  const platform = product.platforms.includes(preferred) ? preferred : product.platforms[0];

  return (
    <motion.section {...reveal} aria-labelledby="featured-title">
      <SectionTitle id="featured-title">Featured</SectionTitle>
      <div className="glass glass-dense-sm mt-3 grid overflow-hidden [--radius:0px] md:grid-cols-[1.35fr_1fr] md:items-center">
        <Link
          href={`/${platform}/${product.slug}`}
          aria-label={product.name}
          className="relative block aspect-video bg-white/40"
        >
          <ProductImage src={product.src} name={product.name} sizes="(max-width: 768px) 92vw, 34vw" />
        </Link>
        <div className="flex flex-col items-start gap-3 p-6 md:px-7 md:py-6">
          <p className="text-[13px] text-ink-soft">
            {product.vendor ? `${product.vendor} · ` : ""}
            {CATEGORY_LABEL[product.category]}
          </p>
          <h3 className="text-[34px] leading-none font-semibold tracking-[-0.03em]">{product.name}</h3>
          {product.features?.[0] && <p className="text-[14px] leading-snug text-ink-soft">{product.features[0]}</p>}
          <div className="flex flex-wrap gap-2">
            {product.platforms.map((p) => {
              const Glyph = GLYPH[p];
              return (
                <Link
                  key={p}
                  href={`/${p}/${product.slug}`}
                  className="glass flex h-10 items-center gap-1.5 pr-4 pl-3.5 text-[14px] font-medium [--radius:9999px]"
                >
                  <Glyph className="size-4 text-ink-soft" />
                  {PLATFORM_LABEL[p]}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/** One tile per shelf, for the visitor's own OS, straight to that shelf. */
function Browse() {
  const reveal = useReveal();
  const platform = usePreferredPlatform();
  const available = productsFor(platform);
  const plugins = (category: Category) => {
    const n = available.filter((p) => p.category === category).length;
    return `${n} ${n === 1 ? "plugin" : "plugins"}`;
  };

  return (
    <motion.section {...reveal} aria-labelledby="browse-title">
      <SectionTitle id="browse-title">Browse · {PLATFORM_LABEL[platform]}</SectionTitle>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {SHELF_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              href={`/${platform}#${categoryId(category)}`}
              className="glass glass-dense-sm flex h-full items-center gap-4 p-5 transition-transform duration-300 [--radius:0px] hover:-translate-y-0.5 sm:flex-col sm:items-start sm:justify-between sm:gap-10"
            >
              <CategoryGlyph category={category} className="size-6 text-ink-soft" />
              <span>
                <span className="block text-[22px] font-semibold tracking-[-0.02em]">{CATEGORY_LABEL[category]}</span>
                <span className="text-[13px] text-ink-soft">
                  {plugins(category)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-4 pb-10 lg:items-start">
      <Image src="/brand/logo.png" alt="StarPlugzz" width={1602} height={723} sizes="110px" className="h-11 w-auto" />
      <nav aria-label="Footer" className="flex gap-5 text-[14px] font-medium">
        {PLATFORMS.map((p) => (
          <Link key={p} href={`/${p}`} className="text-ink-soft transition-colors hover:text-ink">
            {PLATFORM_LABEL[p]}
          </Link>
        ))}
      </nav>
      <p className="text-[12px] text-ink-soft">© 2026 StarPlugzz</p>
    </footer>
  );
}

export function Splash({ featured }: { featured: ShelfProduct | null }) {
  const reduce = useReducedMotion();

  const scrollToMore = (e: React.MouseEvent) => {
    const lenis = getLenis();
    if (!lenis) return;
    e.preventDefault();
    lenis.scrollTo("#more", { offset: -96 });
  };

  return (
    <>
      {/* Desktop: logo and the two platform buttons on the left; the right side belongs to the scene's angel. */}
      <div className="relative flex min-h-svh flex-col items-center justify-start gap-4 px-4 pt-[72px] pb-12 sm:gap-8 sm:pt-24 lg:items-start lg:justify-center lg:pr-[42vw] lg:pl-[6vw]">
        <motion.h1
          initial={{ opacity: 0, transform: "translateY(16px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={reduce ? CALM : { duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="w-[min(58vw,560px)] sm:w-[min(70vw,560px)] lg:-ml-[1.5vw] lg:w-[min(40vw,660px)]"
        >
          <Image
            src="/brand/logo.png"
            alt="StarPlugzz"
            width={1602}
            height={723}
            preload
            sizes="(max-width: 640px) 58vw, (max-width: 1024px) 70vw, 40vw"
            className="h-auto w-full drop-shadow-[0_14px_28px_rgb(20_40_80/0.16)]"
          />
        </motion.h1>

        <div className="relative flex flex-row items-center gap-3 lg:gap-5">
          <PlatformButton platform="mac" index={0} />
          <PlatformButton platform="windows" index={1} />
        </div>

        <a
          href="#more"
          onClick={scrollToMore}
          aria-label="More"
          className="glass absolute bottom-6 left-1/2 grid size-11 -translate-x-1/2 place-items-center [--radius:9999px] lg:left-[6vw] lg:translate-x-0"
        >
          <ChevronDownIcon className="size-5" />
        </a>
      </div>

      <div id="more" className="flex flex-col gap-14 px-4 sm:px-6 lg:w-[58vw] lg:pl-[6vw]">
        {featured && <Featured product={featured} />}
        <Browse />
        <Footer />
      </div>
    </>
  );
}
