"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useCart, type CartLine } from "@/lib/cart";
import { formatPrice, PLATFORM_LABEL, FORMATS } from "@/data/products";
import { useRoute } from "@/lib/platform";
import { getLenis } from "./SmoothScroll";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import { Mascot } from "./Mascot";

const SHEET = { type: "spring", bounce: 0.18, duration: 0.45 } as const;
const PRESS = { type: "spring", bounce: 0.3, duration: 0.3 } as const;

function Thumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-[10px] bg-white/50">
      {!src || failed ? (
        <div className="poster-empty size-full" />
      ) : (
        <Image src={src} alt="" fill sizes="64px" className="object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function Line({ line, src }: { line: CartLine; src: string | null }) {
  const { setQty, remove, close } = useCart();
  const reduce = useReducedMotion();

  return (
    <motion.li
      layout={!reduce}
      initial={{ opacity: 0, transform: "translateX(24px)" }}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      exit={{ opacity: 0, transform: "translateX(40px)" }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-center gap-3 rounded-[18px] bg-white/55 p-2.5"
    >
      <Thumb src={src} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/${line.platform}/${line.slug}`}
          onClick={close}
          className="block truncate text-[15px] leading-tight font-medium tracking-[-0.01em]"
        >
          {line.product.name}
        </Link>
        {/* The variant (platform + formats) always shows, not just the name. */}
        <p className="mt-0.5 truncate text-[12px] text-ink-soft">
          {PLATFORM_LABEL[line.platform]} · {FORMATS[line.platform].join(" ")}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={PRESS}
            onClick={() => setQty(line.key, line.qty - 1)}
            aria-label={`Remove one: ${line.product.name}`}
            className="grid size-7 place-items-center rounded-full bg-white/70"
          >
            <MinusIcon className="size-3.5" />
          </motion.button>
          <span className="w-6 text-center text-[14px] font-medium tabular-nums" aria-live="polite">
            {line.qty}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            transition={PRESS}
            onClick={() => setQty(line.key, line.qty + 1)}
            aria-label={`Add one: ${line.product.name}`}
            className="grid size-7 place-items-center rounded-full bg-white/70"
          >
            <PlusIcon className="size-3.5" />
          </motion.button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-[15px] font-medium tabular-nums">{formatPrice((line.product.price ?? 0) * line.qty)}</span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={PRESS}
          onClick={() => remove(line.key)}
          aria-label={`Remove ${line.product.name}`}
          className="grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white/70"
        >
          <TrashIcon className="size-4" />
        </motion.button>
      </div>
    </motion.li>
  );
}

export function CartDrawer({
  images,
}: {
  /** slug → product poster URL (null while the product has none) */
  images: Record<string, string | null>;
}) {
  const { lines, count, total, isOpen, close } = useCart();
  const { platform } = useRoute();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [checkout, setCheckout] = useState<"idle" | "loading">("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Freeze page scroll under the sheet, focus the close button, Esc closes.
  useEffect(() => {
    if (!isOpen) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [isOpen, close]);

  // Server-side prices: only slugs, platforms and quantities leave the browser.
  const startCheckout = async () => {
    setCheckout("loading");
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map(({ slug, platform, qty }) => ({ slug, platform, qty })) }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout is unavailable right now.");
      window.location.assign(data.url);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout is unavailable right now.");
      setCheckout("idle");
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110 || info.velocity.x > 600) close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="cart" className="fixed inset-0 z-50">
          {/* A white frost, not a dark dim: navy over the yellow buttons would read as olive. */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="absolute inset-0 bg-white/35 backdrop-blur-[3px]"
          />

          <motion.aside
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            initial={reduce ? { opacity: 0 } : { x: "105%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "105%" }}
            transition={reduce ? { duration: 0.2 } : SHEET}
            drag={reduce ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.04, right: 0.7 }}
            onDragEnd={onDragEnd}
            className="glass glass-dense absolute top-2 right-2 bottom-2 flex w-[min(92vw,400px)] flex-col p-4 [--radius:30px] sm:top-3 sm:right-3 sm:bottom-3"
          >
            <header className="flex items-center justify-between gap-3 px-1 pb-3">
              <h2 className="flex items-baseline gap-2 text-[22px] font-semibold tracking-[-0.02em]">
                Cart
                {count > 0 && <span className="text-[15px] font-normal text-ink-soft tabular-nums">{count}</span>}
              </h2>
              <motion.button
                ref={closeRef}
                type="button"
                onClick={close}
                whileTap={{ scale: 0.9 }}
                transition={PRESS}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full bg-white/70"
              >
                <CloseIcon className="size-4" />
              </motion.button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <Mascot pose="sit" className="w-36" sizes="144px" />
                <p className="text-[17px] text-ink-soft">Empty</p>
                <motion.div whileTap={{ scale: 0.96 }} transition={PRESS}>
                  <Link
                    href={`/${platform ?? "mac"}`}
                    onClick={close}
                    className="glass flex h-11 items-center px-6 text-[15px] font-medium [--radius:9999px]"
                  >
                    Browse
                  </Link>
                </motion.div>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="-mx-1 flex flex-1 flex-col gap-2.5 overflow-y-auto px-1 py-1">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <Line key={line.key} line={line} src={images[line.slug] ?? null} />
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="mt-3 flex flex-col gap-3 border-t border-ink/10 px-1 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[15px] text-ink-soft">Total</span>
                    <span className="text-[26px] font-semibold tracking-[-0.02em] tabular-nums">{formatPrice(total)}</span>
                  </div>
                  <motion.button
                    type="button"
                    onClick={startCheckout}
                    disabled={checkout === "loading"}
                    aria-busy={checkout === "loading"}
                    whileTap={{ scale: 0.97 }}
                    transition={PRESS}
                    className="sun-fill h-12 rounded-full text-[16px] font-medium disabled:opacity-70"
                  >
                    {checkout === "loading" ? "Opening secure checkout…" : "Checkout"}
                  </motion.button>
                  {checkoutError && (
                    <p role="alert" className="text-center text-[13px] text-ink">
                      {checkoutError}
                    </p>
                  )}
                  <p className="text-center text-[12px] text-ink-soft">Secure payment by Stripe</p>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
