"use client";

import { motion } from "motion/react";
import type { RefObject } from "react";
import { useCart } from "@/lib/cart";
import { flyToCart } from "@/lib/fly";
import type { Platform } from "@/data/products";
import { PlusIcon } from "./icons";

const PRESS = { type: "spring", bounce: 0.3, duration: 0.3 } as const;

/** Round "+" that adds to the cart and sends the product image flying into the navbar. */
export function AddButton({
  slug,
  name,
  platform,
  imageRef,
  size = "md",
  label,
  tabIndex,
}: {
  slug: string;
  name: string;
  platform: Platform;
  imageRef: RefObject<HTMLElement | null>;
  size?: "md" | "lg";
  label?: string;
  tabIndex?: number;
}) {
  const { add } = useCart();

  const onClick = () => {
    add(slug, platform);
    flyToCart(imageRef.current);
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      tabIndex={tabIndex}
      aria-label={`Add ${name} to cart`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={PRESS}
      className={
        size === "lg"
          ? "sun-fill flex h-12 items-center gap-2 rounded-full pr-6 pl-5 text-[16px] font-medium"
          : "sun-fill grid size-9 shrink-0 place-items-center rounded-full"
      }
    >
      <PlusIcon className={size === "lg" ? "size-5" : "size-[18px]"} />
      {label && <span>{label}</span>}
    </motion.button>
  );
}
