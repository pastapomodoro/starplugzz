"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useCart } from "@/lib/cart";
import { CART_BUMP_EVENT } from "@/lib/fly";
import { CartIcon } from "./icons";
import {AssetIcon} from "./AssetIcon";

export function CartButton() {
  const { count, open } = useCart();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const reduce = useReducedMotion();

  // The fly-to-cart Flip dispatches this when the product lands.
  useEffect(() => {
    const bump = () => {
      if (!scope.current) return;
      if (reduce) {
        animate(scope.current, { opacity: [0.6, 1] }, { duration: 0.2 });
        return;
      }
      animate(
        scope.current,
        { transform: ["scale(1)", "scale(1.1)", "scale(1)"] },
        { type: "spring", bounce: 0.3, duration: 0.45 },
      );
    };
    window.addEventListener(CART_BUMP_EVENT, bump);
    return () => window.removeEventListener(CART_BUMP_EVENT, bump);
  }, [animate, scope, reduce]);

  return (
    <motion.button
      ref={scope}
      type="button"
      onClick={open}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="glass relative grid size-10 shrink-0 place-items-center [--radius:9999px] sm:size-11"
    >
      <span data-cart-target className="grid size-6 place-items-center">
        <AssetIcon name="icon-cart" className="size-8 max-w-none" fallback={<CartIcon className="size-5 text-ink" />} />
      </span>
      <AnimatePresence initial={false}>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ opacity: 0, transform: "scale(0.6)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.6)" }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.35 }}
            className="sun-fill absolute -top-1 -right-1 z-[3] grid h-5 min-w-5 place-items-center overflow-hidden rounded-full px-1.5 text-[11px] font-semibold tabular-nums"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ transform: "translateY(100%)", opacity: 0 }}
                animate={{ transform: "translateY(0%)", opacity: 1 }}
                exit={{ transform: "translateY(-100%)", opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
