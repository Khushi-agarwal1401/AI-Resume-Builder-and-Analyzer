import type Stripe from "stripe";

let _stripe: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Set the STRIPE_SECRET_KEY environment variable."
      );
    }
    if (!process.env.STRIPE_PRO_PRICE_ID_MONTHLY || !process.env.STRIPE_PRO_PRICE_ID_YEARLY) {
      throw new Error(
        "STRIPE_PRO_PRICE_ID_MONTHLY and STRIPE_PRO_PRICE_ID_YEARLY must be set in environment."
      );
    }
    const StripeModule = await import("stripe");
    _stripe = new StripeModule.default(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    }) as unknown as Stripe;
  }
  return _stripe;
}

export const PLANS = {
  free: { id: "free", name: "Free", price: 0 },
  pro: {
    id: "pro",
    name: "Pro",
    monthly: { priceId: process.env.STRIPE_PRO_PRICE_ID_MONTHLY!, amount: 1200 },
    yearly: { priceId: process.env.STRIPE_PRO_PRICE_ID_YEARLY!, amount: 9000 },
  },
} as const;

export function getPlanLimits(planId: string) {
  const isPro = planId === "pro";
  return {
    maxResumes: isPro ? 99 : 1,
    maxAtsChecks: isPro ? 99 : 3,
    maxJdAnalyses: isPro ? 99 : 3,
    maxAiActions: isPro ? 9999 : 20,
    hasAdvancedTemplates: isPro,
    hasExportPdf: isPro,
    hasCoverLetter: isPro,
    hasPrioritySupport: isPro,
  };
}
