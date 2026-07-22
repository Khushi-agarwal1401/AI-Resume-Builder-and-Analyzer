"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";

type Tab = "profile" | "integrations" | "notifications" | "account";

interface IntegrationStatus {
  github_connected: boolean;
  linkedin_connected: boolean;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    github_connected: false,
    linkedin_connected: false,
  });
  const [notifications, setNotifications] = useState({
    resume_updates: true,
    job_alerts: true,
  });

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const showMessage = useCallback((msg: string, type: "success" | "error" = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    setForm((f) => ({ ...f, fullName: user.name || "", email: user.email || "" }));

    // Fetch integration status
    async function fetchProfile() {
      if (!user) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("github_connected, linkedin_connected")
          .eq("id", user.id)
          .single();
        if (profile) {
          setIntegrations({
            github_connected: profile.github_connected || false,
            linkedin_connected: profile.linkedin_connected || false,
          });
        }
        // Fetch notification settings
        const { data: settings } = await supabase
          .from("settings")
          .select("email_notifications")
          .eq("user_id", user.id)
          .maybeSingle();
        if (settings) {
          setNotifications({
            resume_updates: settings.email_notifications ?? true,
            job_alerts: settings.email_notifications ?? true,
          });
        }
      } catch {}
    }
    fetchProfile();
  }, [user, authLoading]);

  async function handleProfileSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.fullName }),
      });
      const json = await res.json();
      if (json.success) showMessage("Profile updated");
      else showMessage(json.error || "Failed to update", "error");
    } catch {
      showMessage("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (form.newPassword !== form.confirmPassword) {
      showMessage("Passwords don't match", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showMessage("Password updated");
        setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else showMessage(json.error || "Failed", "error");
    } catch {
      showMessage("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleNotificationsSave() {
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.from("settings").upsert({
        user_id: user!.id,
        email_notifications: notifications.resume_updates,
      }, { onConflict: "user_id" });
      showMessage("Notification preferences saved");
    } catch {
      showMessage("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== "DELETE") return;
    setSaving(true);
    try {
      // 1. Export data
      const exportRes = await fetch(`/api/resumes`);
      const exportJson = await exportRes.json();
      if (exportJson.success && exportJson.data?.length > 0) {
        // Download as JSON
        const blob = new Blob([JSON.stringify(exportJson.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resumeai-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // 2. Delete account via API
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: deleteError } = await supabase.rpc("delete_user_account");
      if (deleteError) {
        // Fallback: delete profiles data and sign out
        await supabase.from("profiles").delete().eq("id", user!.id);
      }

      // 3. Sign out
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/" });
    } catch {
      showMessage("Failed to delete account. Please contact support.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div></DashboardLayout>;

  const tabs: Tab[] = ["profile", "integrations", "notifications", "account"];

  return (
    <DashboardLayout>
      <div className="max-w-[640px] mx-auto px-8 py-12">
        <h1 className="text-h1 text-black mb-1">Settings</h1>
        <p className="text-body text-gray-500 mb-8">Manage your account, integrations, and preferences.</p>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-gray-300 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-body border-b-2 capitalize whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "border-accent-500 text-black font-medium"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Message banner */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-sm text-small border ${
            messageType === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {message}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
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
              <p className="text-micro text-gray-500 mt-1">
                Email cannot be changed here.{' '}
                <button className="text-accent-500 hover:underline">Request change</button>
              </p>
            </div>

            <h3 className="text-h3 text-black pt-4 border-t border-gray-200">Change Password</h3>
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
            <div className="flex gap-3">
              <Button onClick={handleProfileSave} disabled={saving}>
                {saving ? <Spinner /> : "Save Changes"}
              </Button>
              <Button variant="secondary" onClick={handlePasswordChange} disabled={saving || !form.currentPassword || !form.newPassword}>
                Update Password
              </Button>
            </div>
          </div>
        )}

        {/* ===== INTEGRATIONS TAB ===== */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-h3 text-black">GitHub</h3>
                    <p className="text-small text-gray-500">
                      {integrations.github_connected
                        ? "Connected — auto-detection active"
                        : "Not connected"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/integrations/github"
                  className={`px-3 py-1.5 text-small font-medium rounded-sm border transition-all ${
                    integrations.github_connected
                      ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                      : "border-accent-500 text-accent-600 hover:bg-accent-50"
                  }`}
                >
                  {integrations.github_connected ? "Manage" : "Connect"}
                </Link>
              </div>
              {integrations.github_connected && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-micro text-gray-500">
                    Disconnecting will stop auto-detection of new repositories.
                    Already-imported projects will remain on your resume.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg text-blue-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-h3 text-black">LinkedIn</h3>
                    <p className="text-small text-gray-500">
                      {integrations.linkedin_connected
                        ? "Connected"
                        : "Not connected"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/integrations/linkedin"
                  className="px-3 py-1.5 text-small font-medium rounded-sm border border-gray-300 text-gray-500 hover:bg-gray-50 transition-all"
                >
                  {integrations.linkedin_connected ? "Manage" : "Connect"}
                </Link>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-micro text-gray-500">
                  LinkedIn sync is limited to profile import. Auto-detection of new positions or certificates is not available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 rounded-sm p-6">
              <h3 className="text-h3 text-black mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-body font-medium text-black">Resume Update Alerts</p>
                    <p className="text-small text-gray-500">Get notified when new GitHub repositories are detected</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.resume_updates}
                    onChange={(e) => setNotifications((n) => ({ ...n, resume_updates: e.target.checked }))}
                    className="w-5 h-5 accent-accent-500 cursor-pointer"
                  />
                </label>
                <div className="border-t border-gray-100" />
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-body font-medium text-black">Job Alerts</p>
                    <p className="text-small text-gray-500">Receive reminders about upcoming interviews and follow-ups</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.job_alerts}
                    onChange={(e) => setNotifications((n) => ({ ...n, job_alerts: e.target.checked }))}
                    className="w-5 h-5 accent-accent-500 cursor-pointer"
                  />
                </label>
              </div>
              <div className="mt-6">
                <Button onClick={handleNotificationsSave} disabled={saving}>
                  {saving ? <Spinner /> : "Save Preferences"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ACCOUNT TAB ===== */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="bg-white border border-red-200 rounded-sm p-6">
              <h3 className="text-h3 text-black mb-2">Delete Account</h3>
              <p className="text-body text-gray-600 mb-4">
                Permanently delete your account and all associated data. Before deletion,
                we&apos;ll offer you a data export of your resumes and application history.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 border-t border-red-100 pt-4">
                  <p className="text-small text-red-700 font-medium">
                    This action is permanent. Type <strong>DELETE</strong> to confirm.
                  </p>
                  <input
                    className="h-10 w-full max-w-xs rounded-sm border border-red-300 px-4 text-body outline-none focus:border-red-500 focus:ring-[3px] focus:ring-red-500/15"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder='Type "DELETE"'
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteText !== "DELETE" || saving}
                    >
                      {saving ? <Spinner /> : "Permanently Delete"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <Link
                href="/settings/subscription"
                className="text-accent-500 hover:underline text-small font-medium"
              >
                Manage Subscription →
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
