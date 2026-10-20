import { getProduct, isPlatform, isPurchasable, PLATFORM_LABEL } from "@/data/products";
import { CURRENCY, getStripe, toCents } from "@/lib/stripe";

/** Tags these sessions in the Stripe Dashboard (fixed label + random suffix, as Stripe recommends). */
const INTEGRATION_ID = "starplugzz-cart-checkout-ekpurwwp";

const MAX_LINES = 50;
const MAX_QTY = 20;

type IncomingLine = { slug: string; platform: string; qty: number };

function isLine(value: unknown): value is IncomingLine {
  const v = value as IncomingLine;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.slug === "string" &&
    typeof v.platform === "string" &&
    Number.isInteger(v.qty) &&
    v.qty >= 1 &&
    v.qty <= MAX_QTY
  );
}

const error = (status: number, message: string) => Response.json({ error: message }, { status });

/**
 * Starts a Stripe Checkout session for the cart. The browser sends only slugs, platforms and
 * quantities; names and prices come from data/products.ts, so the client can't change them.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "Invalid request.");
  }

  const lines = (body as { lines?: unknown })?.lines;
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES || !lines.every(isLine)) {
    return error(400, "The cart is empty or invalid.");
  }

  const items = [];
  for (const line of lines) {
    const product = getProduct(line.slug);
    if (!product || !isPlatform(line.platform) || !product.platforms.includes(line.platform)) {
      return error(400, `"${line.slug}" isn't available.`);
    }
    // Showcases link to their maker's store; only products sold here can be paid for.
    if (!isPurchasable(product)) {
      return error(400, `${product.name} can't be bought here.`);
    }
    items.push({ product, platform: line.platform, qty: line.qty });
  }

  const stripe = getStripe();
  if (!stripe) {
    return error(503, "Payments aren't set up yet: add STRIPE_SECRET_KEY to .env.local.");
  }

  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map(({ product, platform, qty }) => ({
        quantity: qty,
        price_data: {
          currency: CURRENCY,
          unit_amount: toCents(product.price!),
          product_data: {
            name: `${product.name} · ${PLATFORM_LABEL[platform]}`,
            metadata: { slug: product.slug, platform },
          },
        },
      })),
      // What to deliver, read back by the webhook ("slug:platform:qty", comma separated).
      metadata: { items: items.map(({ product, platform, qty }) => `${product.slug}:${platform}:${qty}`).join(",") },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      locale: "auto",
      integration_identifier: INTEGRATION_ID,
    });

    if (!session.url) return error(502, "Stripe didn't return a checkout page.");
    return Response.json({ url: session.url });
  } catch (err) {
    // Only the safe fields: never log the whole error object (it carries request details).
    const e = err as { type?: string; code?: string; requestId?: string };
    console.error("[checkout] Stripe error:", { type: e.type, code: e.code, requestId: e.requestId, message: err instanceof Error ? err.message : String(err) });
    const detail = err instanceof Error ? err.message : String(err);
    // Stripe's message helps while setting things up; visitors of the live site get a generic one.
    return error(502, process.env.NODE_ENV === "production" ? "Payment is unavailable right now." : detail);
  }
}
