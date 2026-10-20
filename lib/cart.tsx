"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getProduct, type Platform, type Product } from "@/data/products";

const STORAGE_KEY = "starplugzz-cart-v1";

type StoredLine = { slug: string; platform: Platform; qty: number };
export type CartLine = StoredLine & { key: string; product: Product };

// ───────────── localStorage-backed store ─────────────

const EMPTY: StoredLine[] = [];
let cache: StoredLine[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): StoredLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as StoredLine[];
    return parsed.filter((l) => getProduct(l.slug) && l.qty > 0);
  } catch {
    return EMPTY;
  }
}

const getSnapshot = () => (cache ??= readStorage());
const getServerSnapshot = () => EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(fn: (prev: StoredLine[]) => StoredLine[]) {
  cache = fn(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Private mode or full storage: the cart still works for this visit.
  }
  listeners.forEach((l) => l());
}

// ───────────── React API ─────────────

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, platform: Platform) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  /** Empties the cart (after a completed payment). */
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (slug: string, platform: Platform) => `${slug}:${platform}`;

export function CartProvider({ children }: { children: ReactNode }) {
  // Server and first hydration render see an empty cart; the stored one follows right after.
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((slug: string, platform: Platform) => {
    update((prev) => {
      const existing = prev.find((l) => l.slug === slug && l.platform === platform);
      if (existing) return prev.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { slug, platform, qty: 1 }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    update((prev) =>
      qty <= 0
        ? prev.filter((l) => lineKey(l.slug, l.platform) !== key)
        : prev.map((l) => (lineKey(l.slug, l.platform) === key ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => {
    update((prev) => prev.filter((l) => lineKey(l.slug, l.platform) !== key));
  }, []);

  const clear = useCallback(() => update(() => []), []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const lines = stored.flatMap((l) => {
      const product = getProduct(l.slug);
      return product ? [{ ...l, key: lineKey(l.slug, l.platform), product }] : [];
    });
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((sum, l) => sum + l.qty * (l.product.price ?? 0), 0),
      isOpen,
      open,
      close,
      add,
      setQty,
      remove,
      clear,
    };
  }, [stored, isOpen, open, close, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
