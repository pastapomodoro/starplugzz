"use client";

import Image from "next/image";
import { useState } from "react";

/** The product's real poster (data/products.ts → image), or an empty glass slot. */
export function ProductImage({
  src,
  name,
  sizes,
  preload,
  className = "",
}: {
  src: string | null;
  name: string;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div role="img" aria-label={name} className={`poster-empty card-img size-full ${className}`} />;
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      preload={preload}
      draggable={false}
      onError={() => setFailed(true)}
      className={`card-img object-cover ${className}`}
    />
  );
}
