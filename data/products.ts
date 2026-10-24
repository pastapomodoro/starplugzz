export const PLATFORMS = ["mac", "windows"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CATEGORIES = ["Synth", "Effetti", "Drum", "DAW", "Bundle"] as const;
export type Category = (typeof CATEGORIES)[number];

/** What each category is called on screen. */
export const CATEGORY_LABEL: Record<Category, string> = {
  Synth: "VST",
  Effetti: "Effects",
  Drum: "Drums",
  DAW: "DAW",
  Bundle: "Bundles",
};

/** Anchor id of a category's shelf on the platform page (e.g. /mac#effects). */
export const categoryId = (category: Category) => CATEGORY_LABEL[category].toLowerCase();

/** Categories shown as shelves on the platform pages. */
export const SHELF_CATEGORIES: readonly Category[] = ["DAW", "Synth", "Effetti"];

export const FORMATS: Record<Platform, readonly string[]> = {
  mac: ["AU", "VST3", "AAX"],
  windows: ["VST3", "AAX"],
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  mac: "Mac",
  windows: "Windows",
};

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Left out for showcase products whose price lives on the maker's store. */
  price?: number;
  platforms: readonly Platform[];
  /**
   * Poster image under /public, e.g. "/products/serum.png" (put the file in public/products/).
   * Leave it out and the poster stays an empty glass slot.
   */
  image?: string;
  /** Invented demo entry: replace with the real plugin. */
  placeholder?: true;
  /** Whop plan (plan_...) sold on this site: the page opens Whop's checkout inside it. */
  whopPlanId?: string;

  /**
   * Showcase of a plugin sold by its maker: the page shows it and the button sends
   * buyers to the official store, instead of adding it to the StarPlugzz cart.
   */
  store?: { label: string; url: string };
  /** Shown big on the home page. */
  featured?: true;
  /** Who makes it, shown above the name. */
  vendor?: string;
  /** Short feature lines, listed under the hero. */
  features?: readonly string[];
  /** Formats when they differ from the platform's usual ones (FORMATS). */
  formats?: Partial<Record<Platform, readonly string[]>>;
  /** Formats beyond the platform's usual ones (e.g. "Standalone"). */
  extraFormats?: readonly string[];
  /** Extra screenshots under /public, beside the features. */
  gallery?: readonly { src: string; alt: string; width: number; height: number }[];
};

const both = PLATFORMS;

// Showcases of plugins and DAWs sold by their makers: each links to the official page.
export const products: readonly Product[] = [
  {
    slug: "acid-v",
    name: "Acid V",
    featured: true,
    vendor: "Arturia",
    category: "Synth",
    platforms: both,
    image: "/products/acid-v/cover.webp",
    features: [
      "Modeled TB-303 voice and resonant filter",
      "Sub oscillator: 3 waveforms, 2-octave range",
      "14 distortion algorithms",
      "Polymetric sequencer, up to 64 steps, MIDI export",
      "3 function generators, 4 FX slots, 17 effects",
      "150+ presets, MTS-ESP microtuning",
    ],
    extraFormats: ["Standalone"],
    gallery: [{ src: "/products/acid-v/fx.webp", alt: "Acid V effects section", width: 600, height: 384 }],
    price: 15,
    whopPlanId: "plan_XOjnwJNdDlsHE",
  },
  {
    slug: "punchbox-2",
    name: "PunchBox 2",
    vendor: "D16 Group",
    category: "Synth",
    platforms: both,
    image: "/products/punchbox-2/thumbnail.webp",
    features: [
      "Kick drum synthesizer",
      "Four generators: three sample layers plus a Kick generator",
      "FX rack with ten routing topologies",
      "Multi-stage envelope editor and five outputs",
    ],
    formats: { mac: ["AU", "VST", "VST3", "AAX"], windows: ["VST", "VST3", "AAX"] },
    gallery: [
      { src: "/products/punchbox-2/effects.webp", alt: "PunchBox 2 effects", width: 1358, height: 850 },
      { src: "/products/punchbox-2/modules.webp", alt: "PunchBox 2 modules", width: 1280, height: 720 },
    ],
    store: { label: "View on d16.pl", url: "https://d16.pl/punchbox2" },
  },
  {
    slug: "dada-life-bundle",
    name: "Dada Life Bundle",
    vendor: "Dada Life",
    category: "Effetti",
    platforms: both,
    image: "/products/dada-life-bundle/thumbnail-v2.webp",
    features: [
      "Sausage Fattener: fatness, colour and gain in three knobs",
      "Endless Smile: one-knob build-ups and risers",
      "Secret Sauce: Space In-Your-Face reverb, Eternal Return riser, Wide Awake widener",
      "Developed with Tailored Noise",
    ],
    // As listed by Dada Life for these plugins.
    formats: { mac: ["AU", "VST"], windows: ["VST"] },
    gallery: [
      { src: "/products/dada-life-bundle/sausage-fattener.webp", alt: "Sausage Fattener", width: 850, height: 638 },
      { src: "/products/dada-life-bundle/endless-smile.webp", alt: "Endless Smile", width: 836, height: 492 },
    ],
    store: { label: "View on dadalife.com", url: "https://dadalife.com/plugins/" },
  },
  {
    slug: "valhalla-dsp",
    name: "Valhalla DSP Plugins",
    vendor: "Valhalla DSP",
    category: "Effetti",
    platforms: both,
    image: "/products/valhalla-dsp/thumbnail.webp",
    features: [
      "Reverbs: VintageVerb, Room, Plate and Shimmer",
      "Delay and ÜberMod",
      "Supermassive, Freq Echo and Space Modulator are free",
    ],
    gallery: [{ src: "/products/valhalla-dsp/plugins.webp", alt: "Valhalla DSP plugins", width: 800, height: 464 }],
    formats: { mac: ["AU", "VST", "VST3", "AAX"], windows: ["VST", "VST3", "AAX"] },
    store: { label: "View on valhalladsp.com", url: "https://valhalladsp.com/plugins/" },
  },
  {
    slug: "fl-studio",
    name: "FL Studio",
    vendor: "Image-Line",
    category: "DAW",
    platforms: both,
    image: "/products/fl-studio/thumbnail.webp",
    features: ["Channel Rack step sequencer and Piano roll", "Mixer with built-in instruments and effects", "Lifetime free updates"],
    formats: { mac: ["Standalone"], windows: ["Standalone"] },
    store: { label: "View on image-line.com", url: "https://www.image-line.com/fl-studio/" },
  },
  {
    slug: "ableton-live-12-suite",
    name: "Ableton Live 12 Suite",
    vendor: "Ableton",
    category: "DAW",
    platforms: both,
    image: "/products/ableton-live-12-suite/thumbnail.webp",
    features: [
      "Session View for clip-based writing and performance",
      "Max for Live included",
      "Suite's full set of instruments, effects and sounds",
    ],
    formats: { mac: ["Standalone"], windows: ["Standalone"] },
    store: { label: "View on ableton.com", url: "https://www.ableton.com/en/live/" },
  },
];

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function productsFor(platform: Platform) {
  return products.filter((p) => p.platforms.includes(platform));
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

/** Formats a product ships in on one platform. */
export function formatsFor(product: Product, platform: Platform): string[] {
  return [...(product.formats?.[platform] ?? FORMATS[platform]), ...(product.extraFormats ?? [])];
}

export function formatPrice(value: number) {
  return `€${value.toLocaleString("it-IT")}`;
}
