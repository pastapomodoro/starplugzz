"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let instance: Lenis | null = null;

/** The live Lenis instance (null before mount). */
export const getLenis = () => instance;

/** Lenis driven by gsap.ticker so ScrollTrigger and smooth scroll share one clock. */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.075,
      wheelMultiplier: 0.9,
      // Lenis forces lerp to 1 under prefers-reduced-motion.
      respectReducedMotion: true,
    });
    instance = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}
