"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Flip } from "gsap/Flip";

// Registered once at module load; every component imports gsap from here.
gsap.registerPlugin(useGSAP, ScrollTrigger, Draggable, InertiaPlugin, Flip);

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  Object.assign(window, { gsap, ScrollTrigger });
}

/**
 * gsap.matchMedia() only runs a conditions handler when at least one query
 * matches, so every conditions object includes this always-true one.
 */
export const ALL = "all";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

export { gsap, useGSAP, ScrollTrigger, Draggable, InertiaPlugin, Flip };
