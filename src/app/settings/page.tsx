"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { UpgradePrompt } from "@/features/subscription/components/UpgradePrompt";

type Tab = "profile" | "billing" | "account";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [subData, setSubData] = useState<Record<string, unknown> | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, fullName: user.name || "", email: user.email || "" }));
      fetch("/api/stripe/checkout")
        .then((r) => r.json())
        .then((j) => { if (j.success) setSubData(j.subscription); })
        .catch(() => {});
    }
  }, [user]);

  async function handleProfileSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage("Profile updated");
      } else {
        setMessage(json.error || "Failed to update");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (form.newPassword !== form.confirmPassword) {
      setMessage("Passwords don't match");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const json = await res.json();
      setMessage(json.success ? "Password updated" : json.error || "Failed");
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleBillingPortal() {
    const res = await fetch("/api/stripe/portal");
    const json = await res.json();
    if (json.success && json.url) window.location.href = json.url;
  }

  if (authLoading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div></DashboardLayout>;

  const tabs: Tab[] = ["profile", "billing", "account"];

  return (
    <DashboardLayout>
      <div className="max-w-[640px] mx-auto px-8 py-12">
        <h1 className="text-h1 text-black mb-1">Settings</h1>
        <p className="text-body text-gray-500 mb-8">Manage your account and subscription.</p>

        <div className="flex gap-0 border-b border-gray-300 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-body border-b-2 capitalize transition-all ${
                activeTab === tab
                  ? "border-accent-500 text-black font-medium"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-sm text-small border ${
            message === "Profile updated" || message === "Password updated"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {message}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <label className="text-small font-medium text-black block mb-2">Full Name</label>
              <input
                className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-small font-medium text-black block mb-2">Email</label>
              <input
                className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none bg-gray-50 text-gray-500 cursor-not-allowed"
                value={form.email}
                disabled
              />
              <p className="text-micro text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? <Spinner /> : "Save Changes"}
            </Button>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-h3 text-black">Current Plan</p>
                  <p className="text-body text-gray-500 mt-1">
                    {subData ? (
                      <>
                        {(subData as Record<string, string>).plan_id === "pro" ? "Pro" : "Free"} plan
                        {(subData as Record<string, boolean>).cancel_at_period_end && (
                          <span className="ml-2 text-warning">(Cancels at period end)</span>
                        )}
                      </>
                    ) : "Free plan"}
                  </p>
                </div>
                <span className={`px-3 py-1 text-small font-medium rounded-sm ${
                  (subData as Record<string, string>)?.plan_id === "pro"
                    ? "bg-indigo-50 text-accent-600 border border-indigo-200"
                    : "bg-gray-100 text-gray-500 border border-gray-300"
                }`}>
                  {(subData as Record<string, string>)?.plan_id === "pro" ? "Active" : "Free"}
                </span>
              </div>
              {subData ? (
                <div className="space-y-2 text-small text-gray-500">
                  <p>Status: {(subData as Record<string, string>).status || "active"}</p>
                  {(subData as Record<string, string>).current_period_end && (
                    <p>Period ends: {new Date((subData as Record<string, string>).current_period_end).toLocaleDateString()}</p>
                  )}
                </div>
              ) : (
                <UpgradePrompt variant="banner" />
              )}
            </div>

            <div className="flex gap-3">
              {(subData as Record<string, string>)?.plan_id === "pro" ? (
                <Button variant="secondary" onClick={handleBillingPortal}>
                  Manage Billing
                </Button>
              ) : (
                <a href="/pricing">
                  <Button variant="primary">Upgrade to Pro</Button>
                </a>
              )}
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-6">
            <div>
              <label className="text-small font-medium text-black block mb-2">Current Password</label>
              <input
                type="password"
                className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                value={form.currentPassword}
                onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-small font-medium text-black block mb-2">New Password</label>
              <input
                type="password"
                className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-small font-medium text-black block mb-2">Confirm New Password</label>
              <input
                type="password"
                className="h-10 w-full rounded-sm border border-gray-300 px-4 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            <Button onClick={handlePasswordChange} disabled={saving || !form.currentPassword || !form.newPassword}>
              {saving ? <Spinner /> : "Update Password"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
