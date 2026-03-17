import Stripe from "stripe";
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutResult,
} from "./types.js";

function required(name: string, v: string) {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getStripeSecretKey(): string {
  return required("STRIPE_SECRET_KEY", (process.env.STRIPE_SECRET_KEY ?? "").trim());
}

function getStripeWebhookSecret(): string {
  return required(
    "STRIPE_WEBHOOK_SECRET",
    (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim()
  );
}

function fillUrlTemplate(template: string, invoiceId: string): string {
  return template.replaceAll("{INVOICE_ID}", encodeURIComponent(invoiceId));
}

function makeStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey(), { apiVersion: "2023-10-16" as any });
}

function coerceRawBody(raw: any): Buffer | string | null {
  if (!raw) return null;
  if (Buffer.isBuffer(raw)) return raw;
  if (typeof raw === "string") return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);
  return null;
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const stripe = makeStripeClient();

    const defaultSuccessTpl =
      (process.env.STRIPE_SUCCESS_URL ?? "").trim() ||
      `http://localhost:3001/billing/stripe/success?invoiceId={INVOICE_ID}`;

    const defaultCancelTpl =
      (process.env.STRIPE_CANCEL_URL ?? "").trim() ||
      `http://localhost:3001/billing/stripe/cancel?invoiceId={INVOICE_ID}`;

    const successTpl = (input.successUrlTemplate ?? "").trim() || defaultSuccessTpl;
    const cancelTpl = (input.cancelUrlTemplate ?? "").trim() || defaultCancelTpl;

    const success_url = fillUrlTemplate(successTpl, input.invoiceId);
    const cancel_url = fillUrlTemplate(cancelTpl, input.invoiceId);

    const currency = (input.currency || "AZN").toLowerCase();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url,
      cancel_url,

      metadata: {
        invoiceId: input.invoiceId,
      },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.max(0, Math.trunc(input.amount)),
            product_data: {
              name: `Subscription renewal (${input.periodDays ?? 30} days)`,
            },
          },
        },
      ],
    });

    if (!session.url) throw new Error("Stripe session created but no URL");

    return { url: session.url, providerRef: session.id };
  },

  async verifyAndParseWebhook(req: any) {
    let webhookSecret = "";
    try {
      webhookSecret = getStripeWebhookSecret();
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? "Missing STRIPE_WEBHOOK_SECRET" };
    }

    const sig = req.headers?.["stripe-signature"];
    if (!sig) return { ok: false, reason: "Missing stripe-signature header" };

    const raw = coerceRawBody(req.rawBody);
    if (!raw) {
      return {
        ok: false,
        reason:
          "Missing req.rawBody (need raw body for Stripe). Ensure index.ts saves rawBody via express.json verify.",
      };
    }

    const stripe = makeStripeClient();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (e: any) {
      return {
        ok: false,
        reason: `Stripe webhook signature failed: ${e?.message ?? e}`,
      };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = (session.metadata as any)?.invoiceId;
      if (!invoiceId) return { ok: false, reason: "No invoiceId in session metadata" };
      return { ok: true, invoiceId, providerRef: session.id, eventType: event.type };
    }

    return { ok: false, ignored: true, reason: `Ignored event: ${event.type}` };
  },
};