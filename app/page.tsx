import { products } from "@/data/products";
import { publicImage } from "@/lib/images";
import { Splash } from "@/components/Splash";

export default function Home() {
  const pick = products.find((p) => p.featured);
  return <Splash featured={pick ? { ...pick, src: publicImage(pick.image) } : null} />;
}
