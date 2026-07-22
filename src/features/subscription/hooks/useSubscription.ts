"use client";

import { useState, useEffect } from "react";

interface SubscriptionState {
  planId: string;
  planName: string;
  status: string;
  loading: boolean;
  isPro: boolean;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    planId: "free",
    planName: "Free",
    status: "active",
    loading: true,
    isPro: false,
    cancelAtPeriodEnd: false,
  });

  useEffect(() => {
    fetch("/api/stripe/checkout")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.subscription) {
          setState({
            planId: json.subscription.plan_id,
            planName: json.subscription.plan_id === "pro" ? "Pro" : "Free",
            status: json.subscription.status,
            loading: false,
            isPro: json.subscription.plan_id === "pro",
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
