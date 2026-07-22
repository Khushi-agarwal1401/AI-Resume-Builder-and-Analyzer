"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Get started with basic resume building.",
    features: [
      { text: "1 resume", included: true },
      { text: "1 template (Modern)", included: true },
      { text: "Basic AI suggestions (20/mo)", included: true },
      { text: "3 ATS checks", included: true },
      { text: "3 JD analyses", included: true },
      { text: "All 4 templates", included: false },
      { text: "Cover letter generator", included: false },
      { text: "PDF export", included: false },
      { text: "Unlimited AI actions", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started",
    href: "/sign-up",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 12, yearly: 90 },
    description: "Unlock everything for your job search.",
    features: [
      { text: "Unlimited resumes", included: true },
      { text: "All 4 templates", included: true },
      { text: "Unlimited AI actions", included: true },
      { text: "Unlimited ATS checks", included: true },
      { text: "Unlimited JD analyses", included: true },
      { text: "Cover letter generator", included: true },
      { text: "PDF export", included: true },
      { text: "Role & company variants", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
    cta: "Subscribe",
    href: "/sign-up",
    highlight: true,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    if (!user) {
      window.location.href = "/sign-up";
      return;
    }

    if (planId === "free") {
      window.location.href = "/dashboard";
      return;
    }

    setCheckoutLoading(planId);

    try {
      const priceId = billing === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY;

      if (!priceId) {
        alert("Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY/YEARLY env vars.");
        setCheckoutLoading(null);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/settings?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const json = await res.json();
      if (json.success && json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Checkout failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-300 bg-white">
        <div className="max-w-[1120px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-h3 text-black font-semibold tracking-tight">ResumeAI</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-body text-gray-500 hover:text-black transition-colors">Sign in</Link>
            {user && (
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1120px] mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-display text-black mb-4">Simple, transparent pricing</h1>
          <p className="text-body-lg text-gray-500 max-w-[560px] mx-auto">
            Start free, upgrade when you need more. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 text-body rounded-sm border transition-all ${
              billing === "monthly"
                ? "border-accent-500 bg-accent-50 text-accent-600 font-medium"
                : "border-gray-300 text-gray-500 hover:text-black"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 text-body rounded-sm border transition-all ${
              billing === "yearly"
                ? "border-accent-500 bg-accent-50 text-accent-600 font-medium"
                : "border-gray-300 text-gray-500 hover:text-black"
            }`}
          >
            Yearly
            <span className="ml-1.5 text-micro text-success font-medium">Save 37%</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[720px] mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-sm border-2 p-8 flex flex-col ${
                plan.highlight ? "border-accent-500 bg-white shadow-2" : "border-gray-300 bg-white"
              }`}
            >
              {plan.highlight && (
                <span className="text-micro text-accent-500 font-semibold uppercase tracking-widest mb-2">Most Popular</span>
              )}
              <h3 className="text-h2 text-black mb-1">{plan.name}</h3>
              <p className="text-body text-gray-500 mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-display text-black">${plan.price[billing]}</span>
                <span className="text-body text-gray-500 ml-2">
                  {plan.price[billing] === 0 ? "forever" : `/month${billing === "yearly" ? ", billed annually" : ""}`}
                </span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-gray-700">
                    {f.included ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                        <circle cx="9" cy="9" r="7" fill="#6366F1" fillOpacity="0.1" stroke="#6366F1" strokeWidth="1.3"/>
                        <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                        <circle cx="9" cy="9" r="7" fill="#D4D4D4" fillOpacity="0.3" stroke="#D4D4D4" strokeWidth="1.3"/>
                        <path d="M6 6l6 6M12 6l-6 6" stroke="#D4D4D4" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? "primary" : "secondary"}
                className="w-full"
                onClick={() => handleCheckout(plan.id)}
                disabled={checkoutLoading === plan.id}
              >
                {checkoutLoading === plan.id ? <Spinner /> : plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-small text-gray-500">
            All plans include end-to-end encryption and data privacy. {/* insert a heart emoji */}
          </p>
        </div>
      </div>
    </div>
  );
}
