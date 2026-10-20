"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CATEGORY_LABEL,
  formatsFor,
  PLATFORM_LABEL,
  PLATFORMS,
  SHELF_CATEGORIES,
  type Category,
  type Platform,
} from "@/data/products";
import { usePreferredPlatform, useRoute } from "@/lib/platform";
import { clearRecent, filterLabels, matchRange, readRecent, saveRecent, searchProducts } from "@/lib/search";
import { getLenis } from "./SmoothScroll";
import { ProductImage } from "./ProductImage";
import { CloseIcon, SearchIcon } from "./icons";

const MORPH = { type: "spring", bounce: 0.16, duration: 0.55 } as const;
const SLIDE = { type: "spring", bounce: 0.15, duration: 0.4 } as const;
const MAX_RESULTS = 8;
const CHIP_CATEGORIES: readonly Category[] = SHELF_CATEGORIES;

/** The matched part of a name, tinted. */
function Highlight({ text, words }: { text: string; words: string[] }) {
  const range = matchRange(text, words);
  if (!range) return <>{text}</>;
  const [from, to] = range;
  return (
    <>
      {text.slice(0, from)}
      <mark className="rounded-[4px] bg-sun/45 px-px text-ink">{text.slice(from, to)}</mark>
      {text.slice(to)}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-[6px] bg-white/70 px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink-soft shadow-[inset_0_0_0_0.5px_rgb(20_40_80/0.18)]">
      {children}
    </kbd>
  );
}

/**
 * Spotlight-style liquid glass search. The navbar pill morphs into a floating panel with category
 * chips, a Mac/Windows scope and ranked live results. Space (outside text fields and buttons),
 * ⌘K / Ctrl+K or "/" opens it; arrows pick, Enter opens, Esc closes. Typing "win", "fx" or
 * "under 50" filters too (see lib/search.ts).
 */
export function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [scopePlatform, setScopePlatform] = useState<Platform>("mac");
  const [scopeCategory, setScopeCategory] = useState<Category | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { platform } = useRoute();
  const preferred = usePreferredPlatform();

  const openSearch = useCallback(() => {
    // Scope starts where the visitor is: this section's platform, or their own OS on the home page.
    setScopePlatform(platform ?? preferred);
    setRecent(readRecent());
    setOpen(true);
  }, [platform, preferred]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
    setScopeCategory(null);
  };

  // A route change (picking a result, the back button) closes the search.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) close();
  }

  // Space anywhere outside text fields and buttons, plus ⌘K / Ctrl+K and "/".
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      const typing = el?.closest("input, textarea, select, [contenteditable]");
      const pressable = el?.closest("button, [role=button], [role=option], summary");
      const dialogOpen = document.querySelector("[role=dialog]");
      const bare = !e.metaKey && !e.ctrlKey && !e.altKey;
      const shortcut =
        (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) ||
        (bare && !typing && e.key === "/") ||
        (bare && !typing && !pressable && !dialogOpen && e.code === "Space");
      if (!shortcut) return;
      e.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  // Page scroll freezes under the open search.
  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    return () => lenis?.start();
  }, [open]);

  const { hits, parsed, platform: resultPlatform } = useMemo(
    () => searchProducts(query, { platform: scopePlatform, category: scopeCategory }),
    [query, scopePlatform, scopeCategory],
  );
  const results = hits.slice(0, MAX_RESULTS);
  const typedFilters = filterLabels(parsed);
  const hrefFor = (slug: string) => `/${resultPlatform}/${slug}`;

  // Keep the highlighted row in view while arrowing through the list.
  const activeSlug = results[active]?.product.slug;
  useEffect(() => {
    if (activeSlug) document.getElementById(`search-${activeSlug}`)?.scrollIntoView({ block: "nearest" });
  }, [activeSlug]);

  const go = (slug: string) => {
    saveRecent(query);
    router.push(hrefFor(slug));
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeSlug) {
      e.preventDefault();
      go(activeSlug);
    }
  };

  const morph = reduce ? { duration: 0 } : MORPH;
  const slide = reduce ? { duration: 0 } : SLIDE;
  const fadeIn = reduce
    ? { opacity: 1, transition: { duration: 0.1 } }
    : { opacity: 1, transition: { delay: 0.14, duration: 0.3 } };

  return (
    <>
      {!open && (
        <motion.button
          layoutId="search-glass"
          type="button"
          onClick={openSearch}
          aria-label="Search"
          aria-keyshortcuts="Space Meta+K Control+K /"
          whileTap={{ scale: 0.95 }}
          transition={morph}
          // Corner radius set inline so Motion keeps it right while the shape morphs.
          style={{ borderRadius: 22 }}
          className="glass flex size-10 shrink-0 items-center justify-center gap-2.5 text-ink-soft sm:size-11 lg:w-[236px] lg:justify-start lg:pr-2.5 lg:pl-4"
        >
          <motion.span layoutId="search-icon" transition={morph} className="grid place-items-center text-ink">
            <SearchIcon className="size-5" />
          </motion.span>
          <span className="hidden flex-1 text-left text-[14px] lg:block">Search plugins</span>
          <span className="hidden lg:block">
            <Kbd>Space</Kbd>
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <div key="search" className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={close}
              className="absolute inset-0 touch-none bg-white/35 backdrop-blur-[6px]"
            />

            <div className="absolute inset-x-3 top-[max(12px,env(safe-area-inset-top))] mx-auto max-w-[660px] sm:top-[11vh]">
              <motion.div
                layoutId="search-glass"
                transition={morph}
                style={{ borderRadius: 28 }}
                role="search"
                className="glass glass-dense overflow-hidden shadow-[0_30px_80px_-30px_rgb(20_40_80/0.45)]"
              >
                <motion.div layout initial={{ opacity: 0 }} animate={fadeIn} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                  <div className="flex h-16 items-center gap-3 pr-3 pl-5">
                    <motion.span layoutId="search-icon" transition={morph} className="grid place-items-center text-ink-soft">
                      <SearchIcon className="size-5" />
                    </motion.span>
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActive(0);
                      }}
                      onKeyDown={onInputKey}
                      placeholder="Search plugins, makers, “fx under 30”…"
                      aria-label="Search plugins"
                      role="combobox"
                      aria-expanded
                      aria-controls="search-results"
                      aria-activedescendant={activeSlug ? `search-${activeSlug}` : undefined}
                      enterKeyHint="go"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-full min-w-0 flex-1 bg-transparent text-[19px] tracking-[-0.01em] outline-none placeholder:text-ink-soft/60"
                    />
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close search"
                      className="grid h-9 min-w-9 shrink-0 place-items-center rounded-full bg-white/60 px-2 text-[12px] font-medium text-ink-soft transition-colors hover:bg-white/90"
                    >
                      <span className="hidden lg:block">esc</span>
                      <CloseIcon className="size-4 lg:hidden" />
                    </button>
                  </div>

                  {/* Scope: category chips and the platform, each with a sliding thumb. */}
                  <div className="flex items-center gap-3 border-t border-ink/10 px-3 py-2.5">
                    <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
                      {[null, ...CHIP_CATEGORIES].map((category) => {
                        const on = scopeCategory === category && !parsed.category;
                        return (
                          <button
                            key={category ?? "all"}
                            type="button"
                            aria-pressed={on}
                            onClick={() => {
                              setScopeCategory(category);
                              setActive(0);
                            }}
                            className={`relative h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-300 ${on ? "text-ink" : "text-ink-soft hover:text-ink"}`}
                          >
                            {on && (
                              <motion.span
                                layoutId="search-chip"
                                transition={slide}
                                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgb(20_40_80/0.1),0_4px_10px_-4px_rgb(20_40_80/0.2)]"
                              />
                            )}
                            <span className="relative">{category ? CATEGORY_LABEL[category] : "All"}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex shrink-0 rounded-full bg-ink/[0.05] p-0.5" aria-label="Platform">
                      {PLATFORMS.map((p) => {
                        const on = resultPlatform === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            aria-pressed={on}
                            onClick={() => {
                              setScopePlatform(p);
                              setActive(0);
                            }}
                            className={`relative h-7 rounded-full px-3 text-[12px] font-medium transition-colors duration-300 ${on ? "text-ink" : "text-ink-soft"}`}
                          >
                            {on && (
                              <motion.span
                                layoutId="search-platform"
                                transition={slide}
                                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgb(20_40_80/0.1)]"
                              />
                            )}
                            <span className="relative">{PLATFORM_LABEL[p]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <ul
                    id="search-results"
                    role="listbox"
                    aria-label="Results"
                    data-lenis-prevent
                    className="max-h-[min(52svh,470px)] overflow-y-auto overscroll-contain border-t border-ink/10 px-2 py-2"
                  >
                    {!query && recent.length > 0 && (
                      <li role="presentation" className="flex flex-wrap items-center gap-1.5 px-3 pt-1 pb-3">
                        <span className="mr-1 text-[12px] text-ink-soft">Recent</span>
                        {recent.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setQuery(r)}
                            className="h-7 rounded-full bg-white/60 px-3 text-[12px] font-medium text-ink transition-colors hover:bg-white"
                          >
                            {r}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            clearRecent();
                            setRecent([]);
                          }}
                          className="ml-auto text-[12px] text-ink-soft hover:text-ink"
                        >
                          Clear
                        </button>
                      </li>
                    )}

                    <li role="presentation" className="flex items-center justify-between px-3 pt-1 pb-1.5 text-[12px] text-ink-soft">
                      <span>{query ? "Results" : "Suggested"}</span>
                      {typedFilters.length > 0 && <span>{typedFilters.join(" · ")}</span>}
                    </li>

                    <AnimatePresence initial={false} mode="popLayout">
                      {results.map(({ product: p }, i) => (
                        <motion.li
                          key={p.slug}
                          layout={!reduce}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          id={`search-${p.slug}`}
                          role="option"
                          aria-selected={i === active}
                        >
                          <Link
                            href={hrefFor(p.slug)}
                            onClick={() => saveRecent(query)}
                            onMouseMove={() => setActive(i)}
                            className={`flex items-center gap-3.5 rounded-[18px] p-2 transition-colors duration-200 ${i === active ? "bg-white/80 shadow-[0_1px_2px_rgb(20_40_80/0.06)]" : ""}`}
                          >
                            <span className="relative aspect-video w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-white/50">
                              <ProductImage src={p.image ?? null} name="" sizes="88px" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-medium">
                                <Highlight text={p.name} words={parsed.words} />
                              </span>
                              <span className="block truncate text-[12px] text-ink-soft">
                                {p.vendor ? `${p.vendor} · ` : ""}
                                {CATEGORY_LABEL[p.category]} · {formatsFor(p, resultPlatform).join(" ")}
                              </span>
                            </span>
                            <span className={`hidden w-6 shrink-0 text-center text-[13px] text-ink-soft transition-opacity lg:block ${i === active ? "opacity-100" : "opacity-0"}`}>
                              ↵
                            </span>
                          </Link>
                        </motion.li>
                      ))}
                    </AnimatePresence>

                    {results.length === 0 && (
                      <li role="presentation" className="px-3 py-6 text-center">
                        <p className="text-[15px] text-ink">No plugins match “{query}”.</p>
                        <p className="mt-1 text-[13px] text-ink-soft">Try “vst”, “fx under 30” or “win drums”.</p>
                      </li>
                    )}
                  </ul>

                  <div className="hidden items-center justify-between border-t border-ink/10 px-5 py-2.5 text-[12px] text-ink-soft lg:flex">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd> navigate
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Kbd>↵</Kbd> open
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Kbd>esc</Kbd> close
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {hits.length} {hits.length === 1 ? "plugin" : "plugins"} · {PLATFORM_LABEL[resultPlatform]}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
