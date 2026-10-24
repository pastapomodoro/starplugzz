"use client";

import { motion } from "motion/react";

const PRESS = { type: "spring", bounce: 0.3, duration: 0.3 } as const;

/** Buy button for a Whop plan: goes to Whop's hosted checkout for that plan. */
export function WhopBuy({ planId }: { planId: string }) {
  return (
    <motion.a
      href={`https://whop.com/checkout/${planId}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={PRESS}
      className="sun-fill flex h-12 items-center rounded-full px-6 text-[16px] font-medium"
    >
      Buy now
    </motion.a>
  );
}
