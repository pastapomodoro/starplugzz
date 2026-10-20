"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { CartButton } from "./CartButton";
import { PlatformSwitch } from "./PlatformSwitch";
import { Search } from "./Search";

export function Navbar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-6">
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-1.5 sm:gap-2">
        <motion.div whileTap={{ scale: 0.96 }} transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}>
          {/* The sticker logo carries its own outline, so it sits on the page without a glass pill. */}
          <Link href="/" className="block">
            <Image
              src="/brand/logo.png"
              alt="StarPlugzz"
              width={1602}
              height={723}
              sizes="120px"
              className="h-8 w-auto drop-shadow-[0_4px_10px_rgb(20_40_80/0.18)] sm:h-12"
            />
          </Link>
        </motion.div>

        <PlatformSwitch />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Search />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
