"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
      { text: "3 Estimated Compatibility Score checks", included: true },
      { text: "3 JD analyses", included: true },
      { text: "All templates", included: false },
      { text: "Unlimited AI actions", included: false },
      { text: "GitHub sync & auto-detection", included: false },
      { text: "Company-specific variants", included: false },
      { text: "Cover letter generator", included: false },
      { text: "PDF export", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Your Current Plan",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 1200, yearly: 9000 },
    description: "Unlock everything for your job search.",
    features: [
      { text: "Unlimited resumes", included: true },
      { text: "All templates (Modern, ATS, Student, Minimal, more)", included: true },
      { text: "Unlimited AI actions", included: true },
      { text: "Unlimited Estimated Compatibility Score checks", included: true },
      { text: "Unlimited JD analyses", included: true },
      { text: "GitHub sync & auto-detection", included: true },
      { text: "Company-specific variants", included: true },
      { text: "Role-specific variants", included: true },
      { text: "Cover letter generator", included: true },
      { text: "PDF export", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
    cta: "Subscribe",
    highlight: true,
  },
];

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [subData, setSubData] = useState<Record<string, unknown> | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetch("/api/stripe/checkout")
      .then((r) => r.json())
      .then((json) => { if (json.success) setSubData(json.subscription); })
      .catch(() => {});
  }, [user, authLoading, router]);

  const isPro = subData?.plan_id === "pro";

  async function handleCheckout(planId: string) {
    if (planId === "free") return;

    setCheckoutLoading(true);
    try {
      const priceId = billing === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY;

      if (!priceId) {
        alert("Stripe is not configured.");
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
        alert(json.error || "Checkout failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal");
    const json = await res.json();
    if (json.success && json.url) window.location.href = json.url;
  }

  if (authLoading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div></DashboardLayout>;

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
                Current plan: <strong>{isPro ? "Pro" : "Free"}</strong>
              </p>
              {!!(isPro && (subData as any)?.current_period_end) && (
                <p className="text-micro text-indigo-700 mt-0.5">
                  Renews {new Date(((subData as any).current_period_end as string)).toLocaleDateString()}
                  {((subData as any).cancel_at_period_end) && (
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
        <div className="flex items-center justify-center gap-3 mb-10">
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

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const priceDisplay = plan.id === "free"
              ? "$0"
              : `$${(plan.price[billing] / 100).toFixed(0)}`;
            const periodDisplay = plan.id === "free" ? "forever" : `/mo${billing === "yearly" ? ", billed annually" : ""}`;
            const isCurrentPlan = (plan.id === "pro" && isPro) || (plan.id === "free" && !isPro);

            return (
              <div
                key={plan.id}
                className={`rounded-sm border-2 p-8 flex flex-col ${
                  plan.highlight ? "border-accent-500 bg-white shadow-2" : "border-gray-300 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="text-micro text-accent-500 font-semibold uppercase tracking-widest mb-2">
                    Most Popular
                  </span>
                )}
                <h3 className="text-h2 text-black mb-1">{plan.name}</h3>
                <p className="text-body text-gray-500 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-display text-black">{priceDisplay}</span>
                  <span className="text-body text-gray-500 ml-2">{periodDisplay}</span>
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

                {isCurrentPlan ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlight ? "primary" : "secondary"}
                    className="w-full"
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

        {/* Note about LinkedIn */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-sm">
          <p className="text-micro text-gray-500">
            Note: LinkedIn sync is not currently available as a feature. GitHub sync is included in the Pro plan.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
