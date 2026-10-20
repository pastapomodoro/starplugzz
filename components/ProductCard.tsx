"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { CATEGORY_LABEL, type Platform, type Product } from "@/data/products";
import { ProductImage } from "./ProductImage";
import { AddButton } from "./AddButton";
import { StoreButton } from "./StoreButton";

export type ShelfProduct = Product & { src: string | null };

const FOLLOW = { stiffness: 220, damping: 22, mass: 0.6 };

export function ProductCard({
  product,
  platform,
  clone = false,
}: {
  product: ShelfProduct;
  platform: Platform;
  /** Marquee duplicates: kept out of the tab order and the accessibility tree. */
  clone?: boolean;
}) {
  const imageRef = useRef<HTMLDivElement>(null);

  // Pointer position over the card, 0..1, smoothed with a spring.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, FOLLOW);
  const sy = useSpring(py, FOLLOW);
  const glare = useSpring(0, { stiffness: 180, damping: 26 });

  const rotateX = useTransform(sy, [0, 1], [5, -5]);
  const rotateY = useTransform(sx, [0, 1], [-6, 6]);
  const transform = useMotionTemplate`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const specular = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgb(255 255 255 / 0.4) 0%, rgb(255 255 255 / 0.12) 24%, rgb(255 255 255 / 0) 50%)`;

  // Tilt is a mouse affordance; touch would fire it on every drag of the shelf.
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    glare.set(1);
  };
  const onPointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glare.set(0);
  };

  const href = `/${platform}/${product.slug}`;

  return (
    <div className="card-shell w-[var(--card-w)] shrink-0" aria-hidden={clone || undefined}>
      <motion.article
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ transform }}
        className="card glass glass-lite relative aspect-video overflow-hidden [--radius:0px]"
      >
        {/* The whole 16:9 cover is the link; the bar on top lets clicks through except on its buttons. */}
        <Link
          href={href}
          draggable={false}
          tabIndex={clone ? -1 : undefined}
          aria-label={product.name}
          className="absolute inset-0 block rounded-[inherit]"
        >
          <div ref={imageRef} className="absolute inset-0 overflow-hidden rounded-[inherit] bg-white/40">
            <ProductImage src={product.src} name={product.name} sizes="(max-width: 640px) 72vw, 320px" />
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-white/55 py-1.5 pr-2 pl-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] backdrop-blur-md backdrop-saturate-150">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] leading-tight font-medium tracking-[-0.01em]">{product.name}</h3>
            <p className="text-[12px] text-ink-soft">{product.vendor ?? CATEGORY_LABEL[product.category]}</p>
          </div>
          <span className="pointer-events-auto">
            {product.store ? (
              <StoreButton
                url={product.store.url}
                label={product.store.label}
                name={product.name}
                tabIndex={clone ? -1 : undefined}
              />
            ) : (
              <AddButton
                slug={product.slug}
                name={product.name}
                platform={platform}
                imageRef={imageRef}
                tabIndex={clone ? -1 : undefined}
              />
            )}
          </span>
        </div>

        <motion.span
          aria-hidden
          style={{ background: specular, opacity: glare }}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
        />
      </motion.article>
    </div>
  );
}
