"use client";

import { motion } from "motion/react";
import { ArrowUpRightIcon } from "./icons";

const PRESS = { type: "spring", bounce: 0.3, duration: 0.3 } as const;

/** For showcase products: opens the maker's official store in a new tab (takes the place of AddButton). */
export function StoreButton({
  url,
  label,
  name,
  size = "md",
  tabIndex,
}: {
  url: string;
  label: string;
  name: string;
  size?: "md" | "lg";
  tabIndex?: number;
}) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      aria-label={size === "lg" ? undefined : `${label}: ${name}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={PRESS}
      className={
        size === "lg"
          ? "sun-fill flex h-12 items-center gap-2 rounded-full pr-5 pl-6 text-[16px] font-medium"
          : "sun-fill grid size-9 shrink-0 place-items-center rounded-full"
      }
    >
      {size === "lg" && <span>{label}</span>}
      <ArrowUpRightIcon className={size === "lg" ? "size-[18px]" : "size-4"} />
    </motion.a>
  );
}
