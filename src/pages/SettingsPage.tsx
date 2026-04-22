import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Bell,
  Palette,
  Shield,
  Download,
  Trash2,
  Save,
  Monitor,
  Sun,
  Moon,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);
  const [retentionDays, setRetentionDays] = useState("90");
  const [deletingData, setDeletingData] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName },
    });
    setSavingProfile(false);
    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Profile updated");
  };

  const handleExportData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("key_tests")
      .select(
        "provider, key_preview, nickname, status, health_score, latency_ms, tested_at, notes",
      )
      .eq("user_id", user.id)
      .order("tested_at", { ascending: false });
    if (error) {
      toast.error("Export failed: " + error.message);
      return;
    }
    if (!data?.length) {
      toast.info("No data to export");
      return;
    }

    const headers = [
      "Provider",
      "Key Preview",
      "Nickname",
      "Status",
      "Health Score",
      "Latency (ms)",
      "Tested At",
      "Notes",
    ];
    const rows = data.map((r) => [
      r.provider,
      `****${r.key_preview}`,
      r.nickname || "",
      r.status,
      r.health_score ?? "",
      r.latency_ms ?? "",
      new Date(r.tested_at).toLocaleString(),
      r.notes || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyping-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported!");
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    if (!window.confirm("Delete all your test history? This cannot be undone."))
      return;
    setDeletingData(true);
    const { error } = await supabase
      .from("key_tests")
      .delete()
      .eq("user_id", user.id);
    setDeletingData(false);
    if (error) toast.error("Failed to delete: " + error.message);
    else toast.success("All test data deleted");
  };

  const sections = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "appearance", icon: Palette, label: "Appearance" },
    { id: "security", icon: Shield, label: "Security & Data" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Quick nav */}
        <div className="flex items-center gap-2 flex-wrap">
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className="flex items-center gap-1.5 font-sans text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-blue-500/20 hover:border-blue-500 dark:hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg px-3 py-1.5 transition-all"
              onClick={() =>
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile */}
        <div
          id="profile"
          className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-blue-500/20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 dark:text-white text-sm">
                Profile
              </p>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                Manage your account information
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide"
              >
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-slate-50 dark:bg-[#0A0A0A] border-slate-200 dark:border-blue-500/10 text-slate-400 dark:text-slate-500 rounded-xl opacity-70"
              />
              <p className="font-sans text-xs text-slate-400 dark:text-slate-500">
                Managed by your authentication provider
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="displayName"
                className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide"
              >
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-400/30 rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-sm font-medium text-slate-800 dark:text-slate-300">
                  Plan
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                  Your current subscription
                </p>
              </div>
              <span className="font-mono text-xs bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md px-2 py-0.5">
                Free
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-blue-500/10 pt-4">
              <Button
                size="sm"
                disabled={savingProfile}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-xs rounded-xl border-0 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                onClick={handleSaveProfile}
              >
                <Save className="h-3.5 w-3.5" />{" "}
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div
          id="notifications"
          className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-blue-500/20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 dark:text-white text-sm">
                Notifications
              </p>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                Configure how you receive alerts
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {[
              {
                label: "Email Notifications",
                desc: "Get notified about test results via email",
                val: emailNotifs,
                set: setEmailNotifs,
              },
              {
                label: "Expiry Alerts",
                desc: "Receive alerts before API keys expire",
                val: expiryAlerts,
                set: setExpiryAlerts,
              },
              {
                label: "Weekly Digest",
                desc: "Summary of all key health statuses",
                val: weeklyDigest,
                set: setWeeklyDigest,
              },
            ].map(({ label, desc, val, set }, i) => (
              <div key={label}>
                {i > 0 && (
                  <div className="border-t border-slate-100 dark:border-blue-500/10 mb-4" />
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans text-sm font-medium text-slate-800 dark:text-slate-300">
                      {label}
                    </p>
                    <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                      {desc}
                    </p>
                  </div>
                  <Switch
                    checked={val}
                    onCheckedChange={set}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div
          id="appearance"
          className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-blue-500/20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 dark:text-white text-sm">
                Appearance
              </p>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                Customize how KeyPing looks
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Theme
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "system", icon: Monitor, label: "System" },
                  { value: "light", icon: Sun, label: "Light" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all font-sans text-xs font-medium ${
                      theme === value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-200 dark:border-blue-500/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-blue-500/30"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Data */}
        <div
          id="security"
          className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-blue-500/20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 dark:text-white text-sm">
                Security & Data
              </p>
              <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                Manage data retention and exports
              </p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sans text-sm font-medium text-slate-800 dark:text-slate-300">
                  Auto-delete Old Tests
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                  Automatically remove test history after a period
                </p>
              </div>
              <Switch
                checked={autoDelete}
                onCheckedChange={setAutoDelete}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
            {autoDelete && (
              <div className="flex items-center gap-3 pl-1">
                <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Select value={retentionDays} onValueChange={setRetentionDays}>
                  <SelectTrigger className="w-40 bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 text-slate-900 dark:text-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-blue-500/20">
                    {["30", "60", "90", "180", "365"].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d === "365" ? "1 year" : `${d} days`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="border-t border-slate-100 dark:border-blue-500/10 pt-4 flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 font-sans text-xs rounded-xl"
                onClick={handleExportData}
              >
                <Download className="h-3.5 w-3.5" /> Export Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deletingData}
                className="gap-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-sans text-xs rounded-xl"
                onClick={handleDeleteAllData}
              >
                <Trash2 className="h-3.5 w-3.5" />{" "}
                {deletingData ? "Deleting..." : "Delete All Data"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
