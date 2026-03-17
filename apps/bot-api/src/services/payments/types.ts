export type ProviderName = "mock" | "stripe" | "portmanat";

export type CreateCheckoutInput = {
  invoiceId: string;
  amount: number; // smallest unit
  currency: string; // "AZN"
  ownerPhone?: string;
  periodDays?: number;

  // Optional redirect templates (webapp receipt/cancel)
  // Example: https://owner-web.com/receipt?invoiceId={INVOICE_ID}
  successUrlTemplate?: string;
  cancelUrlTemplate?: string;
};

export type CreateCheckoutResult = {
  url: string;
  providerRef?: string; // e.g. stripe session id
};

export type PaymentProvider = {
  name: ProviderName;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyAndParseWebhook(req: any): Promise<
    | { ok: true; invoiceId: string; providerRef?: string; eventType: string }
    | { ok: false; ignored?: boolean; reason: string }
  >;
};