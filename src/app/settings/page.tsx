"use client";

import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  User,
  Bell,
  Palette,
  Download,
  Link as LinkIcon,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun
} from "lucide-react";

type Tab = "profile" | "resume" | "notifications" | "appearance" | "integrations" | "export" | "account";

interface IntegrationStatus {
  github_connected: boolean;
  linkedin_connected: boolean;
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();

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
    email_digest: false,
  });

  const [resumeDefaults, setResumeDefaults] = useState({
    defaultTemplate: "",
    defaultLanguage: "en",
    autoSave: true,
  });

  const [appearance, setAppearance] = useState({
    theme: "light" as "light" | "dark" | "system",
    fontSize: "medium" as "small" | "medium" | "large",
  });

  const [exportPreferences, setExportPreferences] = useState({
    defaultFormat: "pdf" as "pdf" | "docx",
    includeAtsScore: true,
    includeMetadata: false,
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

  // Honor ?tab=account (deep link from the navbar user menu) on first load.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const validTabs: Tab[] = ["profile", "resume", "notifications", "appearance", "integrations", "export", "account"];
    if (tab && validTabs.includes(tab as Tab)) {
      setActiveTab(tab as Tab);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    setForm((f) => ({ ...f, fullName: user.name || "", email: user.email || "" }));

    // Fetch integration status & settings via API
    async function fetchProfile() {
      if (!user) return;
      try {
        // Fetch integration status from profiles
        // Try fetching profile integration status
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
        } catch { }
        // Fetch notification settings via /api/settings
        const settingsRes = await fetch("/api/settings");
        const settingsJson = await settingsRes.json();
        if (settingsJson.success && settingsJson.data) {
          setNotifications({
            resume_updates: settingsJson.data.resume_updates ?? true,
            job_alerts: settingsJson.data.job_alerts ?? true,
            email_digest: settingsJson.data.email_digest ?? false,
          });
        }
      } catch { }
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

  async function handleEmailChange() {
    if (!form.email || form.email === user?.email) {
      showMessage("Enter a different email address", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const json = await res.json();
      if (json.success) {
        showMessage(
          "Confirmation email sent to the new address. Your email changes once you confirm."
        );
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
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_notifications: notifications.resume_updates,
          resume_updates: notifications.resume_updates,
          job_alerts: notifications.job_alerts,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showMessage("Notification preferences saved");
      } else {
        showMessage(json.error || "Failed to save", "error");
      }
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
      // 1. Export data (full resume content + application/JD history, K-13)
      const exportRes = await fetch(`/api/data-export`);
      const exportJson = await exportRes.json();
      if (exportJson.success && exportJson.data) {
        // Download as JSON
        const blob = new Blob([JSON.stringify(exportJson.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resumeai-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // 2. Delete account via the server-side API route. The browser
      // Supabase client has no auth session (auth is NextAuth-based), so
      // calling the delete_user_account RPC directly always fails — the
      // route verifies the session server-side and deletes via the
      // service-role client, which cascades to every user table.
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!json.success) {
        showMessage(json.error || "Failed to delete account. Please contact support.", "error");
        return;
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

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "resume", label: "Resume Defaults", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "integrations", label: "Connected Accounts", icon: LinkIcon },
    { id: "export", label: "Export", icon: Download },
    { id: "account", label: "Account", icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[640px] mx-auto px-8 py-12">
        <h1 className="text-h1 text-black mb-1">Settings</h1>
        <p className="text-body text-gray-500 mb-8">Manage your account, integrations, and preferences.</p>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-gray-300 mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-body border-b-2 capitalize whitespace-nowrap transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-accent-500 text-black font-medium"
                    : "border-transparent text-gray-500 hover:text-black"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Message banner */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-sm text-small border ${messageType === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
            }`}>
            {message}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Full Name</label>
                  <input
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Email</label>
                  <input
                    type="email"
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll email a confirmation link to the new address before it takes effect.{' '}
                    <button
                      className="text-accent-500 hover:underline disabled:opacity-50"
                      onClick={handleEmailChange}
                      disabled={saving}
                    >
                      Request change
                    </button>
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? <Spinner /> : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Current Password</label>
                  <input
                    type="password"
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.currentPassword}
                    onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">New Password</label>
                  <input
                    type="password"
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button variant="secondary" onClick={handlePasswordChange} disabled={saving || !form.currentPassword || !form.newPassword}>
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== RESUME DEFAULTS TAB ===== */}
        {activeTab === "resume" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resume Defaults</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Default Template</label>
                  <select
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={resumeDefaults.defaultTemplate}
                    onChange={(e) => setResumeDefaults((r) => ({ ...r, defaultTemplate: e.target.value }))}
                  >
                    <option value="">None (select each time)</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                    <option value="professional">Professional</option>
                    <option value="executive">Executive</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">This template will be pre-selected when creating new resumes.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Default Language</label>
                  <select
                    className="h-10 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
                    value={resumeDefaults.defaultLanguage}
                    onChange={(e) => setResumeDefaults((r) => ({ ...r, defaultLanguage: e.target.value }))}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto-save</p>
                    <p className="text-xs text-gray-500">Automatically save changes while editing</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={resumeDefaults.autoSave}
                      onChange={(e) => setResumeDefaults((r) => ({ ...r, autoSave: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      resumeDefaults.autoSave ? "bg-accent-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        resumeDefaults.autoSave ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                </label>
              </div>
              <div className="mt-6">
                <Button onClick={() => { showMessage("Resume defaults saved"); }} disabled={saving}>
                  {saving ? <Spinner /> : "Save Defaults"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== NOTIFICATIONS TAB ===== */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Resume Update Alerts</p>
                    <p className="text-xs text-gray-500">Get notified when new GitHub repositories are detected</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.resume_updates}
                      onChange={(e) => setNotifications((n) => ({ ...n, resume_updates: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      notifications.resume_updates ? "bg-accent-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        notifications.resume_updates ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                </label>
                <div className="border-t border-gray-100" />
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Job Alerts</p>
                    <p className="text-xs text-gray-500">Receive reminders about upcoming interviews and follow-ups</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.job_alerts}
                      onChange={(e) => setNotifications((n) => ({ ...n, job_alerts: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      notifications.job_alerts ? "bg-accent-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        notifications.job_alerts ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                </label>
                <div className="border-t border-gray-100" />
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Weekly Email Digest</p>
                    <p className="text-xs text-gray-500">Get a weekly summary of your resume activity</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.email_digest}
                      onChange={(e) => setNotifications((n) => ({ ...n, email_digest: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      notifications.email_digest ? "bg-accent-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        notifications.email_digest ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
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

        {/* ===== APPEARANCE TAB ===== */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "system", label: "System", icon: Shield },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => setAppearance((a) => ({ ...a, theme: theme.value as "light" | "dark" | "system" }))}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                            appearance.theme === theme.value
                              ? "border-accent-500 bg-accent-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Font Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ].map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setAppearance((a) => ({ ...a, fontSize: size.value as "small" | "medium" | "large" }))}
                        className={cn(
                          "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                          appearance.fontSize === size.value
                            ? "border-accent-500 bg-accent-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={() => { showMessage("Appearance settings saved"); }} disabled={saving}>
                  {saving ? <Spinner /> : "Save Appearance"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== INTEGRATIONS TAB ===== */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">GitHub</h3>
                    <p className="text-sm text-gray-500">
                      {integrations.github_connected
                        ? "Connected — auto-detection active"
                        : "Not connected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integrations.github_connected && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  <Link
                    href="/integrations/github"
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-accent-500 text-accent-600 hover:bg-accent-50 transition-all flex items-center gap-2"
                  >
                    Manage
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg text-blue-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">LinkedIn</h3>
                    <p className="text-sm text-gray-500">
                      {integrations.linkedin_connected
                        ? "Connected"
                        : "Not connected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integrations.linkedin_connected && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  <Link
                    href="/integrations/linkedin"
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-accent-500 text-accent-600 hover:bg-accent-50 transition-all flex items-center gap-2"
                  >
                    Manage
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs text-gray-500">
                  Add your LinkedIn profile link to a resume. Auto-import of experience is not available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== EXPORT TAB ===== */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Export Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Default Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "pdf", label: "PDF" },
                      { value: "docx", label: "DOCX" },
                    ].map((format) => (
                      <button
                        key={format.value}
                        onClick={() => setExportPreferences((prev) => ({ ...prev, defaultFormat: format.value as "pdf" | "docx" }))}
                        className={cn(
                          "p-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-2",
                          exportPreferences.defaultFormat === format.value
                            ? "border-accent-500 bg-accent-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Download className="w-5 h-5" />
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Include ATS Score</p>
                    <p className="text-xs text-gray-500">Add ATS score to exported PDFs</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={exportPreferences.includeAtsScore}
                      onChange={(e) => setExportPreferences((prev) => ({ ...prev, includeAtsScore: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      exportPreferences.includeAtsScore ? "bg-accent-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        exportPreferences.includeAtsScore ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Include Metadata</p>
                    <p className="text-xs text-gray-500">Add creation date and template info to exports</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={exportPreferences.includeMetadata}
                      onChange={(e) => setExportPreferences((prev) => ({ ...prev, includeMetadata: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-11 h-6 rounded-full transition-colors",
                      exportPreferences.includeMetadata ? "bg-accent-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white shadow transition-transform",
                        exportPreferences.includeMetadata ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                </label>
              </div>
              <div className="mt-6">
                <Button onClick={() => { showMessage("Export preferences saved"); }} disabled={saving}>
                  {saving ? <Spinner /> : "Save Preferences"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ACCOUNT TAB ===== */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data. Before deletion,
                    we&apos;ll offer you a data export of your resumes and application history.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 border-t border-red-100 pt-4">
                  <p className="text-sm text-red-700 font-medium">
                    This action is permanent. Type <strong>DELETE</strong> to confirm.
                  </p>
                  <input
                    className="h-10 w-full max-w-xs rounded-lg border border-red-300 px-4 text-sm outline-none focus:border-red-500 focus:ring-[3px] focus:ring-red-500/15"
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

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <Link
                href="/settings/subscription"
                className="flex items-center justify-between text-accent-600 hover:text-accent-700 text-sm font-medium"
              >
                <span>Manage Subscription</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
