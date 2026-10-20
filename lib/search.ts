import {
  CATEGORY_LABEL,
  formatsFor,
  PLATFORM_LABEL,
  formatPrice,
  products,
  type Category,
  type Platform,
  type Product,
} from "@/data/products";

/** Lowercase without accents, so "Glacé" matches "glace". */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** What a query asks for: free words plus the filters it spelled out. */
export type ParsedQuery = {
  words: string[];
  platform?: Platform;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
};

// "au" only exists on Mac, so asking for it is asking for Mac.
const PLATFORM_WORDS: Record<string, Platform> = {
  mac: "mac",
  macos: "mac",
  osx: "mac",
  au: "mac",
  win: "windows",
  windows: "windows",
  pc: "windows",
};

const CATEGORY_WORDS: Record<string, Category> = {
  vst: "Synth",
  vsts: "Synth",
  synth: "Synth",
  synths: "Synth",
  instrument: "Synth",
  instruments: "Synth",
  effects: "Effetti",
  effect: "Effetti",
  fx: "Effetti",
  effetti: "Effetti",
  drums: "Drum",
  drum: "Drum",
  daw: "DAW",
  daws: "DAW",
  bundle: "Bundle",
  bundles: "Bundle",
};

const BELOW = new Set(["under", "below", "max", "sotto", "<"]);
const ABOVE = new Set(["over", "above", "min", "sopra", ">"]);

/**
 * Free text plus a few words that act as filters: a platform ("mac", "win", "au"),
 * a category ("vst", "fx", "drums") and prices ("<50", "under 50", "sotto 50", "20-60").
 */
export function parseQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = { words: [] };
  const tokens = normalize(raw).replace(/€/g, "").split(/\s+/).filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const next = tokens[i + 1];
    let m: RegExpMatchArray | null;

    if ((m = token.match(/^<=?(\d+)$/))) parsed.maxPrice = Number(m[1]);
    else if ((m = token.match(/^>=?(\d+)$/))) parsed.minPrice = Number(m[1]);
    else if ((m = token.match(/^(\d+)-(\d+)$/))) {
      parsed.minPrice = Number(m[1]);
      parsed.maxPrice = Number(m[2]);
    } else if (BELOW.has(token) && next && /^\d+$/.test(next)) {
      parsed.maxPrice = Number(next);
      i++;
    } else if (ABOVE.has(token) && next && /^\d+$/.test(next)) {
      parsed.minPrice = Number(next);
      i++;
    } else if (PLATFORM_WORDS[token]) parsed.platform = PLATFORM_WORDS[token];
    else if (CATEGORY_WORDS[token]) parsed.category = CATEGORY_WORDS[token];
    else parsed.words.push(token);
  }
  return parsed;
}

/**
 * How well one word matches a piece of text: exact > prefix > word start > inside > letters in order.
 * `loose` (letters in order) is for short fields only: in long text almost any word would match.
 */
function wordScore(text: string, word: string, loose = true): number {
  const t = normalize(text);
  if (!t) return 0;
  if (t === word) return 100;
  if (t.startsWith(word)) return 80;
  if (t.split(/[\s-]+/).some((part) => part.startsWith(word))) return 60;
  if (t.includes(word)) return 40;
  // Loose typing: "acdv" still finds "Acid V".
  if (loose && word.length >= 3) {
    let i = 0;
    for (const c of t) if (c === word[i]) i++;
    if (i === word.length) return 15;
  }
  return 0;
}

export type Hit = { product: Product; score: number };

/**
 * Ranked products for a query. Every free word has to match something (name first, then maker,
 * category, formats and feature lines); filters typed in the query win over the scope chosen in the panel.
 */
export function searchProducts(
  raw: string,
  scope: { platform: Platform; category: Category | null },
): { hits: Hit[]; parsed: ParsedQuery; platform: Platform } {
  const parsed = parseQuery(raw);
  const platform = parsed.platform ?? scope.platform;
  const category = parsed.category ?? scope.category;

  const hits: Hit[] = [];
  for (const product of products) {
    if (!product.platforms.includes(platform)) continue;
    if (category && product.category !== category) continue;
    // A price filter only keeps products that show a price.
    const price = product.price;
    if (parsed.maxPrice != null && (price == null || price > parsed.maxPrice)) continue;
    if (parsed.minPrice != null && (price == null || price < parsed.minPrice)) continue;

    const formats = formatsFor(product, platform).join(" ");
    let score = product.featured ? 5 : 0;
    let matchedAll = true;
    for (const word of parsed.words) {
      const best = Math.max(
        wordScore(product.name, word),
        wordScore(product.vendor ?? "", word) * 0.7,
        wordScore(CATEGORY_LABEL[product.category], word) * 0.5,
        wordScore(formats, word, false) * 0.4,
        // What's inside a bundle ("sausage", "reverb") counts too, a little.
        wordScore((product.features ?? []).join(" "), word, false) * 0.35,
      );
      if (!best) {
        matchedAll = false;
        break;
      }
      score += best;
    }
    if (matchedAll) hits.push({ product, score });
  }

  hits.sort((a, b) => b.score - a.score || (a.product.price ?? 1e9) - (b.product.price ?? 1e9));
  return { hits, parsed, platform };
}

/** The filters a query spelled out, as short labels ("Windows", "VST", "under €50"). */
export function filterLabels(parsed: ParsedQuery): string[] {
  const labels: string[] = [];
  if (parsed.platform) labels.push(PLATFORM_LABEL[parsed.platform]);
  if (parsed.category) labels.push(CATEGORY_LABEL[parsed.category]);
  if (parsed.minPrice != null && parsed.maxPrice != null) labels.push(`${formatPrice(parsed.minPrice)}–${formatPrice(parsed.maxPrice)}`);
  else if (parsed.maxPrice != null) labels.push(`under ${formatPrice(parsed.maxPrice)}`);
  else if (parsed.minPrice != null) labels.push(`over ${formatPrice(parsed.minPrice)}`);
  return labels;
}

/** Where the first matching word sits in `text`, for highlighting (same indices: accents strip 1:1). */
export function matchRange(text: string, words: string[]): [number, number] | null {
  const n = normalize(text);
  for (const word of words) {
    const at = n.indexOf(word);
    if (at >= 0) return [at, at + word.length];
  }
  return null;
}

// Recent searches stay in this browser only; storage can be missing or blocked.
const RECENT_KEY = "starplugzz:recent-searches";

export function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecent(query: string) {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const next = [q, ...readRecent().filter((r) => normalize(r) !== normalize(q))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: recents just aren't kept.
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Nothing to clear.
  }
}
