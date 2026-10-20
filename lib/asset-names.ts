/** Generated artwork (scripts/generate-images.ts) by name → file under public/generated/. */
export const ASSET_FILES = {
  // 3:2 with open sky above her, so she can sit lower on wide screens (made from bg-home.png).
  "bg-home": "backgrounds/bg-home-tall.png",
  "bg-home-mobile": "backgrounds/bg-home-mobile.png",
  "bg-shop": "backgrounds/bg-shop.png",
  "bg-shop-mobile": "backgrounds/bg-shop-mobile.png",
  "bg-product": "backgrounds/bg-product.png",
  "bg-product-mobile": "backgrounds/bg-product-mobile.png",

  "icon-synth": "icons/icon-synth.png",
  "icon-effetti": "icons/icon-effetti.png",
  "icon-drum": "icons/icon-drum.png",
  "icon-daw": "icons/icon-daw.png",
  "icon-bundle": "icons/icon-bundle.png",
  "icon-cart": "icons/icon-cart.png",
  "icon-star": "icons/icon-star.png",
  "icon-mac": "icons/icon-mac.png",
  "icon-windows": "icons/icon-windows.png",

  "sprite-bubble": "sprites/bubble.png",

  "mascot-stand": "mascot/mascot-stand.png",
  "mascot-wave": "mascot/mascot-wave.png",
  "mascot-cheer": "mascot/mascot-cheer.png",
  "mascot-sit": "mascot/mascot-sit.png",
  "mascot-point": "mascot/mascot-point.png",

  "decor-scolopendra": "decor/scolopendra.png",
} as const;

export type AssetName = keyof typeof ASSET_FILES;
/** URL of each asset, or null while it hasn't been generated yet. */
export type Assets = Record<AssetName, string | null>;
