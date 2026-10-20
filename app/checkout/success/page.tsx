import type { Metadata } from "next";
import Link from "next/link";
import type Stripe from "stripe";
import { formatCents, getStripe } from "@/lib/stripe";
import { ClearCartWhenPaid } from "@/components/ClearCartWhenPaid";

export const metadata: Metadata = {
  title: "Order · StarPlugzz",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ session_id?: string | string[] }> };

async function loadSession(id: string | undefined): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
  if (!stripe || !id || !id.startsWith("cs_")) return null;
  try {
    return await stripe.checkout.sessions.retrieve(id, { expand: ["line_items"] });
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const session = await loadSession(typeof session_id === "string" ? session_id : undefined);
  const paid = session?.payment_status === "paid" || session?.payment_status === "no_payment_required";

  return (
    <div className="mx-auto max-w-[640px] px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
      <section className="glass glass-dense-sm flex flex-col gap-6 p-6 [--radius:0px] sm:p-10">
        {!session ? (
          <>
            <h1 className="text-[clamp(28px,4vw,40px)] leading-tight font-semibold tracking-[-0.03em]">
              Order not found
            </h1>
            <p className="text-[15px] text-ink-soft">
              This confirmation link isn&apos;t valid. If you paid, the receipt from Stripe has your order details.
            </p>
          </>
        ) : (
          <>
            {paid && <ClearCartWhenPaid />}
            <div className="flex flex-col gap-3">
              {!session.livemode && (
                <span className="self-start bg-sun px-2.5 py-1 text-[12px] font-medium text-ink">Test mode</span>
              )}
              <h1 className="text-[clamp(28px,4vw,40px)] leading-tight font-semibold tracking-[-0.03em]">
                {paid ? "Payment received" : "Payment processing"}
              </h1>
              <p className="text-[15px] text-ink-soft">
                {paid
                  ? "Thank you! Your order is confirmed."
                  : "We'll confirm your order as soon as the payment clears."}
              </p>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[14px]">
              <dt className="text-ink-soft">Order</dt>
              <dd className="font-medium break-all select-all">{session.id.slice(-12).toUpperCase()}</dd>
              {session.customer_details?.email && (
                <>
                  <dt className="text-ink-soft">Email</dt>
                  <dd className="break-all">{session.customer_details.email}</dd>
                </>
              )}
            </dl>

            {session.line_items && (
              <ul className="border-t border-ink/10">
                {session.line_items.data.map((item) => (
                  <li key={item.id} className="flex items-baseline gap-4 border-b border-ink/10 py-3 text-[15px]">
                    <span className="min-w-0 flex-1">
                      {item.description}
                      {(item.quantity ?? 1) > 1 && <span className="text-ink-soft"> × {item.quantity}</span>}
                    </span>
                    <span className="tabular-nums">{formatCents(item.amount_total)}</span>
                  </li>
                ))}
              </ul>
            )}

            {session.amount_total != null && (
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] text-ink-soft">Total</span>
                <span className="text-[26px] font-semibold tracking-[-0.02em] tabular-nums">
                  {formatCents(session.amount_total)}
                </span>
              </div>
            )}
          </>
        )}

        <Link
          href="/"
          className="glass flex h-11 items-center self-start px-6 text-[15px] font-medium [--radius:9999px]"
        >
          Back to the store
        </Link>
      </section>
    </div>
  );
}
