import "server-only";
import Stripe from "stripe";
import { formatPrice } from "@/data/products";

export const CURRENCY = "eur";

let client: Stripe | null = null;

/** The Stripe client, or null until STRIPE_SECRET_KEY is set (use a sk_test_… key for test mode). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (client ??= new Stripe(key));
}

/** Euros as in data/products.ts → the smallest currency unit Stripe expects. */
export const toCents = (euros: number) => Math.round(euros * 100);

/** Stripe amount (cents) → the site's own price format ("€1", "€4,99"). */
export const formatCents = (cents: number) => formatPrice(cents / 100);
