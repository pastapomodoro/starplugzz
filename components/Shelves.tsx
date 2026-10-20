"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, ALL, REDUCED_MOTION } from "@/lib/gsap";
import { CATEGORY_LABEL, categoryId, type Category, type Platform } from "@/data/products";
import type { ShelfProduct } from "./ProductCard";
import { Shelf } from "./Shelf";
import { getLenis } from "./SmoothScroll";

export type ShelfRow = { category: Category; products: ShelfProduct[] };

/** Each shelf has its own card size, spacing and pace, so the column doesn't read as a grid. */
const LOOK: Record<Category, { speed: number; cardWidth: string; gap: number; className: string }> = {
  // A slow drift (px/s): the shelves should read as gently moving, not racing.
  Synth: { speed: 16, cardWidth: "clamp(260px,74vw,330px)", gap: 26, className: "" },
  Effetti: { speed: 20, cardWidth: "clamp(210px,58vw,250px)", gap: 16, className: "lg:ml-[5vw]" },
  Drum: { speed: 18, cardWidth: "clamp(236px,66vw,290px)", gap: 34, className: "lg:ml-[1.5vw]" },
  DAW: { speed: 16, cardWidth: "clamp(260px,74vw,330px)", gap: 26, className: "" },
  Bundle: { speed: 14, cardWidth: "clamp(236px,66vw,290px)", gap: 22, className: "" },
};

/** Cards cascade in, shelf by shelf, the first time each shelf scrolls into view. */
export function useCascade(scope: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ all: ALL, reduce: REDUCED_MOTION }, (ctx) => {
        const { reduce } = ctx.conditions as { reduce: boolean };
        ScrollTrigger.batch(".shelf", {
          start: "top 92%",
          once: true,
          onEnter: (shelves) => {
            shelves.forEach((shelf, i) => {
              const cards = shelf.querySelectorAll(".card-shell");
              shelf.setAttribute("data-cascade", "done");
              if (reduce) {
                gsap.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.3 });
                return;
              }
              gsap.fromTo(
                cards,
                { opacity: 0, y: 32 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 1,
                  ease: "power3.out",
                  stagger: 0.05,
                  delay: i * 0.1,
                  clearProps: "transform",
                },
              );
            });
          },
        });
      });
      return () => mm.revert();
    },
    { scope },
  );
}

export function Shelves({ platform, rows }: { platform: Platform; rows: ShelfRow[] }) {
  const root = useRef<HTMLDivElement>(null);
  useCascade(root);

  // Arriving from a link like /mac#effects: once the page transition settles, glide to that shelf.
  useEffect(() => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const t = setTimeout(() => {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { offset: -96 });
      else target.scrollIntoView({ behavior: "smooth" });
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    // Desktop: the shelves keep to the left 60% so the scene's angel stays in view on the right.
    <div ref={root} className="flex flex-col gap-10 pt-24 pb-20 sm:gap-14 sm:pt-28 lg:w-[62vw]">
      {rows.map((row, i) => (
        <Shelf
          key={row.category}
          id={categoryId(row.category)}
          title={CATEGORY_LABEL[row.category]}
          category={row.category}
          products={row.products}
          platform={platform}
          direction={i % 2 === 0 ? 1 : -1}
          speed={LOOK[row.category].speed}
          cardWidth={LOOK[row.category].cardWidth}
          gap={LOOK[row.category].gap}
          className={LOOK[row.category].className}
        />
      ))}
    </div>
  );
}
