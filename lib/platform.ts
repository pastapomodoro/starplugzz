"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { isPlatform, type Platform } from "@/data/products";

export function useRoute(): { platform: Platform | null; slug: string | null } {
  const [first, second] = (usePathname() ?? "/").split("/").filter(Boolean);
  const platform = first && isPlatform(first) ? first : null;
  return { platform, slug: platform && second ? second : null };
}

const noSubscribe = () => () => {};

/** The visitor's own OS (Windows or else Mac); "mac" on the server and during hydration. */
export function usePreferredPlatform(): Platform {
  return useSyncExternalStore(
    noSubscribe,
    () => (/Windows/i.test(navigator.userAgent) ? "windows" : "mac"),
    () => "mac",
  );
}

/** Runs before first paint so /windows never flashes the Mac sky. */
export const PLATFORM_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var p=location.pathname.split('/')[1];if(p==='mac'||p==='windows')d.dataset.platform=p;if(navigator.userAgentData)d.classList.add('lg-svg');}catch(e){}})();`;
