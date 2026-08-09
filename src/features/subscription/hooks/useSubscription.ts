"use client";

import { useState, useEffect } from "react";

interface SubscriptionState {
  planId: string;
  planName: string;
  status: string;
  loading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    planId: "free",
    planName: "Free",
    status: "active",
    loading: true,
    isPro: false,
    isAdmin: false,
    cancelAtPeriodEnd: false,
  });

  useEffect(() => {
    fetch("/api/stripe/checkout")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.subscription) {
          const isAdmin = json.isAdmin === true;
          setState({
            planId: json.subscription.plan_id,
            planName: json.subscription.plan_id === "pro" ? "Pro" : "Free",
            status: json.subscription.status,
            loading: false,
            // Admins get full access — treat them as Pro so no premium locks show.
            isPro: json.subscription.plan_id === "pro" || isAdmin,
            isAdmin,
            cancelAtPeriodEnd: json.subscription.cancel_at_period_end,
          });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  return state;
}
