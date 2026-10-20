"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Mounted on the order confirmation once Stripe reports the payment: the cart's job is done. */
export function ClearCartWhenPaid() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
