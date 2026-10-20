"use client";

import { useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { ScrollTrigger } from "@/lib/gsap";
import { isPlatform } from "@/data/products";
import { getLenis } from "./SmoothScroll";

/** Keeps the outgoing page rendering its own route while it animates out. */
function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const [frozen] = useState(context);
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// "Materialize": blur + scale + fade, so pages morph rather than cut.
// The rendered "in" state is the same for everyone (so SSR matches); reduced
// motion only changes the "out" state, which is resolved at animation time.
const variants: Variants = {
  in: { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
  out: (reduce: boolean) =>
    reduce
      ? { opacity: 0, filter: "blur(0px)", transform: "scale(1)" }
      : { opacity: 0, filter: "blur(8px)", transform: "scale(0.985)" },
};

/** Mirrors the current platform onto <html data-platform> so the sky morphs with the route. */
function usePlatformAttribute(pathname: string) {
  useEffect(() => {
    const first = pathname.split("/")[1] ?? "";
    const root = document.documentElement;
    if (isPlatform(first)) root.dataset.platform = first;
    else delete root.dataset.platform;
  }, [pathname]);
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  usePlatformAttribute(pathname);

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      custom={!!reduce}
      onExitComplete={() => {
        getLenis()?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }}
    >
      <motion.main
        key={pathname}
        custom={!!reduce}
        variants={variants}
        initial="out"
        animate="in"
        exit="out"
        transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE_OUT }}
        className="relative min-h-svh origin-top"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.main>
    </AnimatePresence>
  );
}
