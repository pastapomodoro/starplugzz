"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { CATEGORY_LABEL, formatPrice, formatsFor, PLATFORM_LABEL, type Platform } from "@/data/products";
import { ProductImage } from "./ProductImage";
import { AddButton } from "./AddButton";
import { StoreButton } from "./StoreButton";
import { WhopBuy } from "./WhopBuy";
import { Shelf } from "./Shelf";
import { useCascade } from "./Shelves";
import type { ShelfProduct } from "./ProductCard";
import { ArrowLeftIcon, CategoryGlyph, MacGlyph, WindowGlyph } from "./icons";
import {AssetIcon, CATEGORY_ICON} from "./AssetIcon";
import { useAsset } from "@/lib/assets";

const SPRING = { type: "spring", bounce: 0.3, duration: 0.3 } as const;

export function ProductView({
  platform,
  product,
  similar,
}: {
  platform: Platform;
  product: ShelfProduct;
  similar: ShelfProduct[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useCascade(root);
  const decor = useAsset("decor-scolopendra");

  const column: Variants = { in: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.1 } } };
  const item: Variants = {
    out: { opacity: 0, transform: "translateY(14px)" },
    in: {
      opacity: 1,
      transform: "translateY(0px)",
      transition: reduce
        ? { duration: 0.25, transform: { duration: 0 } }
        : { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
    },
  };
  // Sections below the hero rise in as they scroll into view.
  const reveal = {
    initial: { opacity: 0, transform: "translateY(16px)" },
    whileInView: { opacity: 1, transform: "translateY(0px)" },
    viewport: { once: true, margin: "0px 0px -10% 0px" },
    transition: reduce
      ? { duration: 0.25, transform: { duration: 0 } }
      : { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
  } as const;
  const PlatformGlyph = platform === "mac" ? MacGlyph : WindowGlyph;
  const formats = formatsFor(product, platform);
  const gallery = product.gallery ?? [];

  return (
    // The product backdrop has no character, so the page uses the full width: big cover, info card beside it.
    <div ref={root} className="pt-24 pb-16 sm:pt-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <motion.div className="inline-block" whileTap={{ scale: 0.96 }} transition={SPRING}>
          <Link
            href={`/${platform}`}
            className="glass inline-flex h-9 items-center gap-1 pr-4 pl-3 text-[14px] font-medium [--radius:9999px]"
          >
            <ArrowLeftIcon className="size-4" />
            {PLATFORM_LABEL[platform]}
          </Link>
        </motion.div>

        <div className="mt-6 grid items-center gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
          <div ref={imageRef} className="relative aspect-video overflow-hidden bg-white/40 shadow-[0_24px_60px_-30px_rgb(20_40_80/0.45)]">
            <ProductImage src={product.src} name={product.name} sizes="(max-width: 1024px) 92vw, 60vw" preload />
          </div>

          <motion.div
            variants={column}
            initial="out"
            animate="in"
            className="glass glass-dense-sm flex flex-col items-start gap-5 p-6 [--radius:0px] sm:p-8"
          >
            {decor && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={decor}
                alt=""
                aria-hidden
                className="pointer-events-none absolute -top-16 right-0 -z-10 w-[min(60vw,420px)] rotate-12 opacity-[0.14]"
              />
            )}

            <motion.span
              variants={item}
              className="flex items-center gap-1.5 text-[14px] text-ink-soft"
            >
              <AssetIcon
                name={CATEGORY_ICON[product.category]}
                className="-my-2 size-6"
                fallback={<CategoryGlyph category={product.category} className="size-4" />}
              />
              {product.vendor ? `${product.vendor} · ` : ""}
              {CATEGORY_LABEL[product.category]}
            </motion.span>

            <motion.h1
              variants={item}
              className="-mt-2 text-[clamp(36px,4.2vw,60px)] leading-[1] font-semibold tracking-[-0.035em] text-balance"
            >
              {product.name}
            </motion.h1>

            <motion.ul variants={item} className="flex flex-wrap gap-2" aria-label="Formats">
              <li className="glass flex h-8 items-center gap-1.5 pr-3.5 pl-3 text-[13px] font-medium [--radius:9999px]">
                <AssetIcon
                  name={platform === "mac" ? "icon-mac" : "icon-windows"}
                  className="-my-2 size-6"
                  fallback={<PlatformGlyph className="size-4" />}
                />
                {PLATFORM_LABEL[platform]}
              </li>
              {formats.map((f) => (
                <li key={f} className="glass flex h-8 items-center px-3.5 text-[13px] font-medium text-ink-soft [--radius:9999px]">
                  {f}
                </li>
              ))}
            </motion.ul>

            <motion.div variants={item} className="mt-3 flex flex-wrap items-center gap-5">
              {product.price != null && (
                <span className="text-[30px] font-medium tracking-[-0.02em] tabular-nums">
                  {formatPrice(product.price)}
                </span>
              )}
              {product.whopPlanId ? (
                <WhopBuy planId={product.whopPlanId} />
              ) : product.store ? (
                <StoreButton url={product.store.url} label={product.store.label} name={product.name} size="lg" />
              ) : (
                <AddButton
                  slug={product.slug}
                  name={product.name}
                  platform={platform}
                  imageRef={imageRef}
                  size="lg"
                  label="Add to cart"
                />
              )}
            </motion.div>

            {(product.store || product.whopPlanId) && (
              <motion.p variants={item} className="-mt-2 text-[13px] text-ink-soft">
                Purchase and license on the seller&apos;s site.
              </motion.p>
            )}
          </motion.div>
        </div>

        {(product.features || gallery.length > 0) && (
          <motion.div {...reveal} className="mt-6 grid items-start gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-8">
            {product.features && (
              <section aria-labelledby="features" className="glass glass-dense-sm p-6 [--radius:0px] sm:p-8">
                <h2 id="features" className="text-[13px] font-medium text-ink-soft">
                  Features
                </h2>
                <ul className="mt-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-baseline gap-3 border-t border-ink/10 py-3 text-[15px] first:border-t-0">
                      <span aria-hidden className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-[var(--sun-deep)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {gallery.map((shot) => (
              <Image
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                sizes="(max-width: 1024px) 92vw, 600px"
                className="h-auto w-full shadow-[0_24px_60px_-30px_rgb(20_40_80/0.45)]"
              />
            ))}
          </motion.div>
        )}
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <Shelf
            title="Similar"
            category={product.category}
            products={similar}
            platform={platform}
            speed={14}
            cardWidth="clamp(220px,60vw,260px)"
            gap={20}
          />
        </div>
      )}
    </div>
  );
}
