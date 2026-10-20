import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

/** Called when a paid order should be delivered. */
async function fulfill(session: Stripe.Checkout.Session) {
  // "slug:platform:qty" entries written by app/api/checkout/route.ts.
  const items = (session.metadata?.items ?? "").split(",").filter(Boolean);
  // TODO when products have files: email the buyer (session.customer_details?.email) their download links.
  console.info("[stripe] paid order", {
    session: session.id,
    email: session.customer_details?.email,
    total: session.amount_total,
    items,
    testMode: !session.livemode,
  });
}

/**
 * Stripe → server notifications. The signature check needs the raw body, so it's read as text.
 * Local testing: stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    console.warn("[stripe] webhook signature check failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      // Cards are paid at this point; delayed methods (bank transfers) settle later, below.
      if (event.data.object.payment_status === "paid") await fulfill(event.data.object);
      break;
    case "checkout.session.async_payment_succeeded":
      await fulfill(event.data.object);
      break;
  }

  return Response.json({ received: true });
}
