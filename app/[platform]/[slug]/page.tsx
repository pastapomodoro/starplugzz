import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, isPlatform, products } from "@/data/products";
import { publicImage } from "@/lib/images";
import { ProductView } from "@/components/ProductView";

type Props = { params: Promise<{ platform: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return products.flatMap((p) => p.platforms.map((platform) => ({ platform, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product ? `${product.name} · StarPlugzz` : "StarPlugzz" };
}

export default async function ProductPage({ params }: Props) {
  const { platform, slug } = await params;
  const product = getProduct(slug);
  if (!isPlatform(platform) || !product || !product.platforms.includes(platform)) notFound();

  const similar = products
    .filter((p) => p.slug !== product.slug && p.category === product.category && p.platforms.includes(platform))
    .map((p) => ({ ...p, src: publicImage(p.image) }));

  return (
    <ProductView
      platform={platform}
      product={{
        ...product,
        src: publicImage(product.image),
        gallery: product.gallery?.filter((shot) => publicImage(shot.src)),
      }}
      similar={similar}
    />
  );
}
