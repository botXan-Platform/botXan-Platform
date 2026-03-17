import { env } from "../../config/env.js";
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutResult,
} from "./types.js";

export const mockProvider: PaymentProvider = {
  name: "mock",

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const qs = new URLSearchParams();
    qs.set("invoiceId", input.invoiceId);

    // allow passing where to redirect after paid
    if (input.successUrlTemplate) qs.set("successUrl", input.successUrlTemplate);
    if (input.cancelUrlTemplate) qs.set("cancelUrl", input.cancelUrlTemplate);

    const url = `${env.PUBLIC_BASE_URL}/billing/mock/checkout?${qs.toString()}`;
    return { url, providerRef: `mock-${Date.now()}` };
  },

  async verifyAndParseWebhook() {
    return { ok: false, ignored: true, reason: "mock provider has no webhooks" };
  },
};