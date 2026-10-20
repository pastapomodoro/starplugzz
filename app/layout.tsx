import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { getAssets, publicImage } from "@/lib/images";
import { AssetsProvider } from "@/lib/assets";
import { products } from "@/data/products";
import { PLATFORM_BOOT_SCRIPT } from "@/lib/platform";
import { LiquidGlassDefs } from "@/components/LiquidGlassDefs";
import { Background } from "@/components/Background";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { CartDrawer } from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "StarPlugzz",
  description: "Plugins for Mac and Windows",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#eef5fc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The boot script sets data-platform and .lg-svg before paint.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PLATFORM_BOOT_SCRIPT }} />
      </head>
      <body>
        {/* Generated artwork that exists right now; components use CSS for the rest. */}
        <AssetsProvider assets={getAssets()}>
          <CartProvider>
            <LiquidGlassDefs />
            <Background />
            <SmoothScroll />
            <Navbar />
            <PageTransition>{children}</PageTransition>
            <CartDrawer images={Object.fromEntries(products.map((p) => [p.slug, publicImage(p.image)]))} />
          </CartProvider>
        </AssetsProvider>
      </body>
    </html>
  );
}
