"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Essential tools for crafting your first resume.",
    features: [
      { text: "1 Master Resume", included: true },
      { text: "Basic ATS Score Check", included: true },
      { text: "3 Standard Templates", included: true },
      { text: "PDF Export with Watermark", included: true },
      { text: "Standard Support", included: true },
    ],
    cta: "Get Started",
    href: "/sign-up",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 199, yearly: 149 },
    description: "For active job seekers who want interviews guaranteed.",
    features: [
      { text: "Unlimited Resumes & Cover Letters", included: true },
      { text: "Advanced AI ATS Match Simulator", included: true },
      { text: "All 11 Premium Templates", included: true },
      { text: "PDF + DOCX High-Res Export", included: true },
      { text: "AI Action Verb & Metric Rewriter", included: true },
      { text: "LinkedIn & GitHub Auto Sync", included: true },
    ],
    cta: "Subscribe",
    href: "/sign-up?plan=pro",
    highlight: true,
  },
  {
    id: "executive",
    name: "Executive",
    price: { monthly: 299, yearly: 249 },
    description: "For career accelerators and senior leadership.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "1-on-1 AI Interview Prep Assistant", included: true },
      { text: "Unlimited AI Rewrite Credits", included: true },
      { text: "Custom Color & Typography Themes", included: true },
      { text: "Priority Recruiter Scan Audit", included: true },
      { text: "24/7 Dedicated Support", included: true },
    ],
    cta: "Go Executive",
    href: "/sign-up?plan=executive",
    highlight: false,
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
        toast.error("Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY/YEARLY env vars.");
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
        toast.error(json.error || "Checkout failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-300 bg-white">
        <div className="max-w-[1120px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-h3 text-black font-semibold tracking-tight">ResumeCareer</Link>
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

        <div className="flex justify-center mb-12">
          <div className="relative flex p-1 bg-gray-100/80 rounded-full font-sans border border-gray-200">
            <button
              onClick={() => setBilling("monthly")}
              className={`relative w-32 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                billing === "monthly"
                  ? "bg-white text-gray-900 shadow-sm shadow-gray-200/50 ring-1 ring-gray-900/5"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`relative w-32 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                billing === "yearly"
                  ? "bg-white text-gray-900 shadow-sm shadow-gray-200/50 ring-1 ring-gray-900/5"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-3 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-emerald-500/20 tracking-wider uppercase">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto items-stretch pt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-[24px] p-8 flex flex-col transition-all duration-300 hover:shadow-3 ${
                plan.highlight 
                  ? "border-2 border-accent-500 bg-white shadow-2 md:-mt-4 md:mb-4 z-10" 
                  : "border border-gray-200 bg-white hover:-translate-y-1"
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-accent-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-sm text-center whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 h-10">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight text-gray-900 font-sans">
                  {plan.id === "free" ? "₹0" : `₹${plan.price[billing]}`}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  {plan.id === "free" ? "forever" : `/mo${billing === "yearly" ? " (billed annually)" : ""}`}
                </span>
              </div>
              
              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      {f.included ? (
                        <div className="shrink-0 w-5 h-5 rounded-full bg-accent-50 flex items-center justify-center mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-accent-600">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="shrink-0 w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center mt-0.5">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-300">
                            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                      <span className={f.included ? "font-medium text-gray-700" : "text-gray-400"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button
                variant={plan.highlight ? "primary" : "secondary"}
                className={`w-full py-6 rounded-xl font-bold text-base transition-all ${plan.highlight ? "shadow-md hover:shadow-lg hover:bg-accent-600" : ""}`}
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
            All plans include end-to-end encryption and data privacy. ❤️
          </p>
        </div>
      </div>
    </div>
  );
}
