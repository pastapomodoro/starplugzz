"use client";

import { useRef } from "react";
import { gsap, useGSAP, Draggable, ScrollTrigger, ALL, FINE_POINTER, REDUCED_MOTION } from "@/lib/gsap";
import type { Category, Platform } from "@/data/products";
import { ProductCard, type ShelfProduct } from "./ProductCard";
import { CategoryGlyph } from "./icons";
import { AssetIcon, CATEGORY_ICON } from "./AssetIcon";

/** Minimum cards per loop segment so one segment is always wider than the viewport. */
const MIN_PER_SET = 8;
/** Below this many products a shelf doesn't scroll: repeating one or two cards in a loop looks broken. */
const MARQUEE_MIN = 4;

/**
 * Infinite marquee: one GSAP ticker moves the track, Draggable (on a detached
 * proxy) lets you grab and throw it with inertia, hover eases it to a stop.
 */
export function Shelf({
  id,
  title,
  category,
  products,
  platform,
  direction = 1,
  speed = 40,
  cardWidth = "clamp(244px,72vw,320px)",
  gap = 16,
  className = "",
}: {
  /** Anchor for links like /mac#effects. */
  id?: string;
  title: string;
  category?: Category;
  products: ShelfProduct[];
  platform: Platform;
  /** 1 = moves left, -1 = moves right */
  direction?: 1 | -1;
  /** px per second */
  speed?: number;
  /** CSS width of each card (cards are 16:9). */
  cardWidth?: string;
  /** px between cards */
  gap?: number;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);

  const still = products.length < MARQUEE_MIN;
  const reps = Math.max(1, Math.ceil(MIN_PER_SET / products.length));
  const set = Array.from({ length: reps }, () => products).flat();

  useGSAP(
    () => {
      if (still) return;
      const viewport = viewportRef.current!;
      const track = trackRef.current!;
      const segment = setRef.current!;
      const mm = gsap.matchMedia();

      mm.add({ all: ALL, reduce: REDUCED_MOTION, fine: FINE_POINTER }, (ctx) => {
        const { reduce, fine } = ctx.conditions as {
          reduce: boolean;
          fine: boolean;
        };

        const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
        let loop = segment.offsetWidth + gap();
        const ro = new ResizeObserver(() => (loop = segment.offsetWidth + gap()));
        ro.observe(segment);

        const state = {
          x: -loop * 0.3 * (direction === 1 ? 1 : 2),
          factor: 1,
        };
        const setX = gsap.quickSetter(track, "x", "px") as (v: number) => void;
        const base = reduce ? 0 : speed;
        let dragging = false;
        let visible = true;

        const tick = (_time: number, deltaMs: number) => {
          if (!visible) return;
          if (!dragging) state.x -= direction * base * state.factor * (deltaMs / 1000);
          setX(gsap.utils.wrap(-loop, 0, state.x));
        };
        gsap.ticker.add(tick);

        // Only spend frames on shelves that are on screen.
        const st = ScrollTrigger.create({
          trigger: viewport,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (visible = self.isActive),
        });

        // Drag + throw. The proxy's x is just a delta source; state.x stays the truth.
        const proxy = document.createElement("div");
        let offset = 0;
        let moved = false;
        const [drag] = Draggable.create(proxy, {
          type: "x",
          trigger: viewport,
          inertia: !reduce,
          minimumMovement: 6,
          allowContextMenu: true,
          onPress() {
            offset = state.x - this.x;
            dragging = true;
            moved = false;
          },
          onDrag() {
            moved = true;
            state.x = offset + this.x;
          },
          onThrowUpdate() {
            state.x = offset + this.x;
          },
          onRelease() {
            if (!this.isThrowing) dragging = false;
          },
          onThrowComplete() {
            dragging = false;
          },
        });

        // A drag that ends over a card must not open it.
        const swallowClick = (e: MouseEvent) => {
          if (!moved) return;
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        };
        viewport.addEventListener("click", swallowClick, true);

        // Hover eases the shelf to a stop instead of freezing it.
        const slow = () =>
          gsap.to(state, {
            factor: 0,
            duration: 0.8,
            ease: "power2.out",
            overwrite: true,
          });
        const resume = () =>
          gsap.to(state, {
            factor: 1,
            duration: 1.2,
            ease: "power2.inOut",
            overwrite: true,
          });
        if (fine) {
          viewport.addEventListener("mouseenter", slow);
          viewport.addEventListener("mouseleave", resume);
        }

        return () => {
          gsap.ticker.remove(tick);
          ro.disconnect();
          drag.kill();
          st.kill();
          viewport.removeEventListener("click", swallowClick, true);
          viewport.removeEventListener("mouseenter", slow);
          viewport.removeEventListener("mouseleave", resume);
        };
      });

      return () => mm.revert();
    },
    {
      scope: viewportRef,
      dependencies: [direction, speed, products.length, still],
    },
  );

  return (
    <section
      id={id}
      className={`shelf scroll-mt-24 ${className}`}
      style={
        {
          "--card-w": still ? "clamp(260px,84vw,340px)" : cardWidth,
          "--shelf-gap": `${still ? 24 : gap}px`,
        } as React.CSSProperties
      }
      data-cascade="pending"
      aria-label={title}
    >
      <div className="mx-4 flex items-end justify-between gap-4 border-b border-ink/10 pb-3 sm:mx-6 lg:ml-[4vw]">
        <h2 className="flex items-center gap-2.5 text-[24px] leading-none font-semibold tracking-[-0.025em]">
          {category && (
            <AssetIcon
              name={CATEGORY_ICON[category]}
              className="-my-2 size-7"
              fallback={<CategoryGlyph category={category} className="size-5 text-ink-soft" />}
            />
          )}
          {title}
        </h2>
        <span className="text-[13px] text-ink-soft tabular-nums">
          {products.length} {products.length === 1 ? "plugin" : "plugins"}
        </span>
      </div>

      {still ? (
        <div ref={viewportRef} className="flex flex-wrap gap-[var(--shelf-gap)] px-4 pt-5 pb-7 sm:px-6 lg:pl-[4vw]">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} platform={platform} />
          ))}
        </div>
      ) : (
        <div ref={viewportRef} className="shelf-viewport">
          <div ref={trackRef} className="shelf-track">
            <div ref={setRef} className="flex gap-[var(--shelf-gap)]">
              {set.map((p, i) => (
                <ProductCard key={`a-${p.slug}-${i}`} product={p} platform={platform} clone={i >= products.length} />
              ))}
            </div>
            <div className="flex gap-[var(--shelf-gap)]" aria-hidden>
              {set.map((p, i) => (
                <ProductCard key={`b-${p.slug}-${i}`} product={p} platform={platform} clone />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
