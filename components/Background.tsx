"use client";

import { useRef, useState } from "react";
import { useAsset } from "@/lib/assets";
import { gsap, useGSAP, ALL, FINE_POINTER, REDUCED_MOTION } from "@/lib/gsap";
import { useRoute } from "@/lib/platform";

type Bubble = { x: number; y: number; s: number; dur: number; delay: number };

// Fixed positions (vw / vh / px) so server and client render the same markup.
// Only small, faint bubbles, kept well behind the content.
const LAYERS: { depth: number; opacity: number; bubbles: Bubble[] }[] = [
  {
    depth: 0.2,
    opacity: 0.3,
    bubbles: [
      { x: 6, y: 22, s: 24, dur: 14, delay: -2 },
      { x: 22, y: 64, s: 16, dur: 12, delay: -5 },
      { x: 41, y: 12, s: 14, dur: 15, delay: -1 },
      { x: 63, y: 48, s: 18, dur: 13, delay: -7 },
      { x: 84, y: 30, s: 14, dur: 16, delay: -3 },
      { x: 93, y: 74, s: 22, dur: 14, delay: -6 },
      { x: 52, y: 86, s: 12, dur: 12, delay: -4 },
    ],
  },
  {
    depth: 0.45,
    opacity: 0.4,
    bubbles: [
      { x: 12, y: 44, s: 36, dur: 15, delay: -3 },
      { x: 34, y: 92, s: 28, dur: 13, delay: -8 },
      { x: 72, y: 16, s: 32, dur: 17, delay: -1 },
      { x: 88, y: 58, s: 26, dur: 14, delay: -6 },
    ],
  },
];

/** Inverted pentagram (one point down) inscribed in a radius-55 circle, drawn as one continuous star. */
const PENTAGRAM = [0, 2, 4, 1, 3]
  .map((k) => {
    const a = ((90 + k * 72) * Math.PI) / 180;
    return `${(55 * Math.cos(a)).toFixed(2)},${(55 * Math.sin(a)).toFixed(2)}`;
  })
  .join(" ");

/** Home: the angel in her home pose. Shop (/mac, /windows): the standing angel. Product pages: sky only. */
type Scene = "home" | "shop" | "product";
const SCENES: readonly Scene[] = ["home", "shop", "product"];

/** One generated backdrop (desktop + optional portrait crop), faded in once loaded. */
function SceneImage({ scene, active }: { scene: Scene; active: boolean }) {
  const desktop = useAsset(`bg-${scene}`);
  const mobile = useAsset(`bg-${scene}-mobile`);
  const [loaded, setLoaded] = useState(false);
  if (!desktop && !mobile) return null;

  return (
    <picture>
      {mobile && desktop && <source media="(max-aspect-ratio: 4/5)" srcSet={mobile} />}
      <img
        src={desktop ?? mobile!}
        alt=""
        decoding="async"
        // The image may finish before hydration, when onLoad has no listener yet.
        ref={(img) => {
          if (img?.complete && img.naturalWidth) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        // Slightly oversized so the parallax drift never shows an edge. On desktop the home angel is
        // anchored right (clear of the logo and buttons) and near the top of the image, so the extra
        // sky stays in view and she sits low in the window.
        className={`absolute inset-0 size-full scale-[1.06] object-cover transition-opacity duration-700 ${scene === "home" ? "lg:object-[100%_20%]" : ""} ${loaded && active ? "opacity-100" : "opacity-0"}`}
      />
    </picture>
  );
}

export function Background() {
  const root = useRef<HTMLDivElement>(null);
  const { platform, slug } = useRoute();
  const scene: Scene = slug ? "product" : platform ? "shop" : "home";
  const sceneDesktop = useAsset(`bg-${scene}`);
  const sceneMobile = useAsset(`bg-${scene}-mobile`);
  const homeDesktop = useAsset("bg-home");
  const homeMobile = useAsset("bg-home-mobile");
  // Every route uses its own scene if generated, otherwise the home scene (the site-wide artwork).
  const shown: Scene = sceneDesktop || sceneMobile ? scene : "home";
  const sceneHasImage = Boolean(sceneDesktop || sceneMobile || homeDesktop || homeMobile);
  const bubble = useAsset("sprite-bubble");
  const mascot = useAsset("mascot-stand");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add({ all: ALL, reduce: REDUCED_MOTION, fine: FINE_POINTER }, (ctx) => {
        const { reduce, fine } = ctx.conditions as { reduce: boolean; fine: boolean };
        if (reduce) return;

        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]");

        // Scroll parallax: deeper layers drift further while the page scrolls under them.
        layers.forEach((layer) => {
          const depth = Number(layer.dataset.depth);
          gsap.to(layer, {
            yPercent: -18 * depth,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: 0,
              end: "max",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        });

        if (!fine) return;

        // Pointer parallax on the inner wrapper, so it never fights the scroll tween.
        const movers = layers.map((layer) => {
          const inner = layer.firstElementChild as HTMLElement;
          const depth = Number(layer.dataset.depth);
          return {
            depth,
            x: gsap.quickTo(inner, "x", { duration: 1.2, ease: "power3" }),
            y: gsap.quickTo(inner, "y", { duration: 1.2, ease: "power3" }),
          };
        });
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(-nx * 40 * m.depth);
            m.y(-ny * 28 * m.depth);
          });
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="sky absolute inset-0" />

      {SCENES.map((name) => (
        <div key={name} data-depth={0.06} className="absolute inset-0">
          <div className="absolute inset-0">
            <SceneImage scene={name} active={name === shown} />
          </div>
        </div>
      ))}

      {/* Win7-style light beams; hidden when a generated scene supplies its own light. */}
      <svg
        className={`absolute inset-0 size-full transition-opacity duration-700 ${sceneHasImage ? "opacity-0" : "opacity-100"}`}
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <polygon points="0,560 0,900 260,900 1180,0 960,0" fill="white" fillOpacity={0.07} />
        <polygon points="420,900 820,900 1600,170 1600,-60 1500,0" fill="white" fillOpacity={0.1} />
        <polygon points="560,900 600,900 1600,40 1600,0" fill="white" fillOpacity={0.22} />
        <polygon points="1040,900 1600,420 1600,900" fill="#0b1e4a" fillOpacity={0.08} />
      </svg>

      {/* The emblem: a glass disc holding a glowing yellow inverted pentagram. */}
      {/* Fallbacks for when the scene isn't generated: the emblem and the standing mascot. */}
      <div data-depth={0.12} className={`absolute inset-0 ${sceneHasImage ? "hidden" : ""}`}>
        <div className="absolute top-1/2 left-[44%] size-[min(52vmin,520px)] -translate-x-1/2 -translate-y-1/2">
          <svg viewBox="-100 -100 200 200" className="size-full overflow-visible">
            <defs>
              <radialGradient id="emblem-glass" cx="35%" cy="28%" r="80%">
                <stop offset="0" stopColor="white" stopOpacity={0.32} />
                <stop offset="0.55" stopColor="white" stopOpacity={0.12} />
                <stop offset="1" stopColor="white" stopOpacity={0.2} />
              </radialGradient>
              <filter id="emblem-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle r="96" fill="url(#emblem-glass)" stroke="white" strokeOpacity={0.35} strokeWidth="1.5" />
            <g filter="url(#emblem-glow)" stroke="#ffd93b" fill="none" strokeLinejoin="round">
              <circle r="62" strokeWidth="3.2" />
              <circle r="55" strokeWidth="1.4" />
              <polygon points={PENTAGRAM} strokeWidth="3.2" />
            </g>
          </svg>
        </div>
      </div>

      {/* The mascot stands on the right, like the reference wallpaper; product pages keep that side for the product info. */}
      {mascot && !slug && !sceneHasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mascot}
          alt=""
          decoding="async"
          className="absolute right-0 bottom-0 h-[40svh] max-w-[70vw] object-contain object-bottom opacity-90 drop-shadow-[0_18px_40px_rgba(11,30,74,0.35)] lg:right-[2vw] lg:h-[min(92vh,980px)] lg:max-w-[42vw] lg:opacity-100"
        />
      )}

      {LAYERS.map((layer) => (
        <div key={layer.depth} data-depth={layer.depth} className="absolute inset-0 will-change-transform">
          <div className="absolute inset-0">
            {layer.bubbles.map((b, i) => (
              <span
                key={i}
                className={`bubble-float absolute ${bubble ? "" : "bubble"}`}
                style={
                  {
                    left: `${b.x}vw`,
                    top: `${b.y}vh`,
                    width: b.s,
                    height: b.s,
                    opacity: layer.opacity,
                    "--dur": `${b.dur}s`,
                    "--delay": `${b.delay}s`,
                    // The generated bubble sprite replaces the CSS gradient bubble.
                    ...(bubble && { background: `url(${bubble}) center / contain no-repeat` }),
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
