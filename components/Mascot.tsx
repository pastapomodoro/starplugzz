"use client";

import Image from "next/image";
import { useAsset } from "@/lib/assets";

export type MascotPose = "wave" | "cheer" | "sit" | "point";

/** The StarPlugzz mascot (original character), or an empty space until her art is generated. */
export function Mascot({
  pose,
  className = "",
  sizes = "320px",
  preload,
}: {
  pose: MascotPose;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  const src = useAsset(`mascot-${pose}`);

  // Until her art exists, keep the space but draw nothing.
  if (!src) return <div aria-hidden className={`relative aspect-[3/4] ${className}`} />;

  return (
    <div className={`relative aspect-[3/4] ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        draggable={false}
        className="object-contain drop-shadow-[0_18px_30px_rgba(11,30,74,0.35)]"
      />
    </div>
  );
}
