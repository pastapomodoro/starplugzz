import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPlatform, PLATFORMS, PLATFORM_LABEL, productsFor, SHELF_CATEGORIES } from "@/data/products";
import { publicImage } from "@/lib/images";
import { Shelves, type ShelfRow } from "@/components/Shelves";

type Props = { params: Promise<{ platform: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PLATFORMS.map((platform) => ({ platform }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform } = await params;
  return { title: isPlatform(platform) ? `StarPlugzz · ${PLATFORM_LABEL[platform]}` : "StarPlugzz" };
}

export default async function PlatformPage({ params }: Props) {
  const { platform } = await params;
  if (!isPlatform(platform)) notFound();

  const available = productsFor(platform);
  const rows: ShelfRow[] = SHELF_CATEGORIES.map((category) => ({
    category,
    products: available
      .filter((p) => p.category === category)
      .map((p) => ({ ...p, src: publicImage(p.image) })),
  })).filter((row) => row.products.length > 0);

  return <Shelves platform={platform} rows={rows} />;
}
