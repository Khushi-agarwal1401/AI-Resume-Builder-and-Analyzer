"use client";
import Preloader from "@/components/ui/Preloader";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
    cta: "Your Current Plan",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 19900, yearly: 14900 },
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
    highlight: true,
  },
  {
    id: "executive",
    name: "Executive",
    price: { monthly: 29900, yearly: 24900 },
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
    highlight: false,
  },
];

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [subData, setSubData] = useState<Record<string, unknown> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetch("/api/stripe/checkout")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSubData(json.subscription);
          setIsAdmin(json.isAdmin === true);
        }
      })
      .catch(() => {});
  }, [user, authLoading, router]);

  const isPro = subData?.plan_id === "pro";
  // Admins have full access to every feature without a paid subscription.
  const hasFullAccess = isAdmin || isPro;

  async function handleCheckout(planId: string) {
    if (planId === "free") return;

    setCheckoutLoading(true);
    try {
      const priceId = billing === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY;

      if (!priceId) {
        toast.error("Stripe is not configured.");
        setCheckoutLoading(false);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/settings/subscription?checkout=success`,
          cancelUrl: `${window.location.origin}/settings/subscription`,
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
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal");
    const json = await res.json();
    if (json.success && json.url) window.location.href = json.url;
  }

  if (authLoading) return <DashboardLayout><Preloader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-h1 text-black">Subscription</h1>
          <p className="text-body text-gray-500 mt-1">Choose the plan that fits your needs.</p>
        </div>

        {/* Current plan banner */}
        {subData && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="text-small font-medium text-indigo-900">
                Current plan: <strong>{isAdmin ? "Full access (admin)" : isPro ? "Pro" : "Free"}</strong>
              </p>
              {isAdmin && (
                <p className="text-micro text-indigo-700 mt-0.5">
                  Admins have full access to every feature — no subscription or payment required.
                </p>
              )}
              {!!(isPro && subData?.current_period_end) && (
                <p className="text-micro text-indigo-700 mt-0.5">
                  Renews {new Date((subData.current_period_end as string)).toLocaleDateString()}
                  {(subData.cancel_at_period_end as boolean) && (
                    <span className="text-red-600 block mt-1">Cancels at end of period</span>
                  )}
                </p>
              )}
            </div>
            {isPro && (
              <Button variant="secondary" size="sm" onClick={handlePortal}>
                Manage Billing
              </Button>
            )}
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
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

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.map((plan) => {
            const priceDisplay = plan.id === "free"
              ? "₹0"
              : `₹${(plan.price[billing] / 100).toFixed(0)}`;
            const periodDisplay = plan.id === "free" ? "forever" : `/mo${billing === "yearly" ? " (billed annually)" : ""}`;
            // Admins effectively hold the Pro plan (full access).
            const isCurrentPlan = hasFullAccess
              ? plan.id === "pro"
              : (plan.id === "pro" && isPro) || (plan.id === "free" && !isPro);

            return (
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
                    {priceDisplay}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    {periodDisplay}
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
                
                {isAdmin ? (
                  <Button variant="secondary" className="w-full py-6 rounded-xl font-bold text-base transition-all" disabled>
                    Full Access
                  </Button>
                ) : isCurrentPlan ? (
                  <Button variant="secondary" className="w-full py-6 rounded-xl font-bold text-base transition-all" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlight ? "primary" : "secondary"}
                    className={`w-full py-6 rounded-xl font-bold text-base transition-all ${plan.highlight ? "shadow-md hover:shadow-lg hover:bg-accent-600" : ""}`}
                    onClick={() => handleCheckout(plan.id)}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? <Spinner /> : plan.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Note about integrations */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-sm">
          <p className="text-micro text-gray-500">
            Note: GitHub sync and LinkedIn profile import are included in the Pro plan.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
