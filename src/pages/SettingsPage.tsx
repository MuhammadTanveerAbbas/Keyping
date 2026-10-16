import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Download,
  LogOut,
  Save,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  dashGhostBtn,
  dashInput,
  dashPrimaryBtn,
  Notice,
  PageHeader,
  PageShell,
  Panel,
} from "@/components/dashboard/ui";
import { usePreferences } from "@/hooks/usePreferences";
import { downloadCsv } from "@/lib/csv";
import { supabase } from "@/integrations/supabase/client";
import { PROVIDERS } from "@/lib/providers";
import { notifyDataChanged } from "@/lib/data-events";

const profileFormSchema = z.object({
  displayName: z.string().max(100, "Display name must be 100 characters or fewer"),
});

type PreferenceKey = "emailNotifications" | "expiryAlerts" | "weeklyDigest";

const navSections = [
  { id: "profile", icon: User, label: "Profile" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "security", icon: Shield, label: "Security & data" },
] as const;


function formatJson(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function SignOutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch {
      setSigningOut(false);
      toast.error("Could not sign out. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className={cn(
        "flex min-h-11 w-full touch-manipulation select-none items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-2 text-left text-[13px] font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      {signingOut ? "Signing out..." : "Sign out"}
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: user?.user_metadata?.full_name || "" },
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const { preferences: storedPreferences, loading: preferencesLoading, error: preferencesError, savePreferences } = usePreferences();
  const preferences = {
    emailNotifications: storedPreferences.email_notifications,
    expiryAlerts: storedPreferences.expiry_alerts,
    weeklyDigest: storedPreferences.weekly_digest,
  };
  const [exportingData, setExportingData] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof navSections)[number]["id"]>("profile");

  useEffect(() => {
    profileForm.reset({ displayName: user?.user_metadata?.full_name || "" });
  }, [profileForm, user?.id, user?.user_metadata?.full_name]);

  useEffect(() => {
    const sections = navSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id as (typeof navSections)[number]["id"]);
      },
      { rootMargin: "-88px 0px -55%", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const updatePreference = async (key: PreferenceKey, value: boolean) => {
    const result = await savePreferences({
      email_notifications: key === "emailNotifications" ? value : preferences.emailNotifications,
      expiry_alerts: key === "expiryAlerts" ? value : preferences.expiryAlerts,
      weekly_digest: key === "weeklyDigest" ? value : preferences.weeklyDigest,
    });
    if (result.ok) toast.success("Preference saved");
    else toast.error(result.error ?? "Could not save preference");
  };

  const resetPreferences = async () => {
    const result = await savePreferences({ email_notifications: true, expiry_alerts: true, weekly_digest: false });
    if (result.ok) toast.success("Preferences reset");
    else toast.error(result.error ?? "Could not reset preferences");
  };

  const handleSaveProfile = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: values.displayName.trim() } });
      if (error) throw error;
      toast.success("Profile updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? `Could not save profile: ${error.message}` : "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportingData(true);
    try {
      const { data, error } = await supabase
        .from("key_tests")
        .select("provider, key_preview, nickname, status, health_score, latency_ms, tested_at, notes, scopes, rate_limit_info")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) {
        toast.info("There is no saved test history to export");
        return;
      }

      const headers = ["Provider", "Key preview", "Nickname", "Status", "Health score", "Latency (ms)", "Tested at", "Notes", "Scopes", "Rate limit info"];
      const rows = data.map((record) => [
        PROVIDERS.find((provider) => provider.id === record.provider)?.name || record.provider,
        `****${record.key_preview}`,
        record.nickname || "",
        record.status,
        record.health_score ?? "",
        record.latency_ms ?? "",
        new Date(record.tested_at).toLocaleString(),
        record.notes || "",
        formatJson(record.scopes),
        formatJson(record.rate_limit_info),
      ]);
      // Shared exporter, so this file gets the same spreadsheet formula
      // injection guard and UTF-8 handling as the other two exporters.
      downloadCsv("keyping-export", [headers, ...rows]);
      toast.success("Test history exported");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not export test history");
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    setDeletingData(true);
    try {
      const { error } = await supabase.from("key_tests").delete().eq("user_id", user.id);
      if (error) throw error;
      notifyDataChanged("key_tests");
      setDeleteDataOpen(false);
      toast.success("Saved test history deleted");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? `Could not delete test history: ${error.message}` : "Could not delete test history");
    } finally {
      setDeletingData(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const container = el.closest("main");
    if (!container) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      return;
    }
    // Use absolute scrollTop so repeated clicks never overshoot.
    const HEADER_OFFSET = 24;
    const target = container.scrollTop + el.getBoundingClientRect().top - container.getBoundingClientRect().top - HEADER_OFFSET;
    container.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <PageShell width="md">
        <PageHeader
          title="Settings"
          description="Manage your profile, account preferences, data controls, and dashboard guidance."
          action={
            <Button type="button" onClick={() => void handleExportData()} disabled={exportingData} className={cn("h-10 w-full sm:w-auto", dashPrimaryBtn)}>
              {exportingData ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {exportingData ? "Exporting..." : "Export data"}
            </Button>
          }
        />

        <nav className="flex flex-wrap gap-2" aria-label="Settings sections">
          {navSections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                activeSection === id
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
              )}
              onClick={() => { setActiveSection(id); scrollToSection(id); }}
              aria-current={activeSection === id ? "location" : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div id="profile" className="scroll-mt-0">
          <Panel title="Profile" description="Manage the account information available to KeyPing.">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-email" className="text-xs font-medium text-slate-500">Email</Label>
                <Input id="settings-email" value={user?.email || ""} disabled className={cn(dashInput, "opacity-70")} />
                <p className="text-xs text-slate-400">Managed by your authentication provider</p>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-medium text-slate-500">Display name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your display name" autoComplete="name" {...field} className={dashInput} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Account access</p>
                      <p className="text-xs text-slate-500">Your current KeyPing workspace</p>
                    </div>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-700">Active</span>
                  </div>

                  <Button type="submit" size="sm" disabled={savingProfile} className={cn("h-9 gap-1.5", dashPrimaryBtn)}>
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    {savingProfile ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </Form>
            </div>
          </Panel>
        </div>

        <div id="notifications" className="scroll-mt-0">
          <Panel title="Notification preferences" description="These choices are saved in your KeyPing account. Delivery integrations are not connected yet.">
            <div className="mb-5 overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50/40">
              <div className="flex items-start gap-3 px-4 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600 shadow-sm">
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-amber-900">Delivery not connected</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-amber-700">Preferences are saved to your account. Email and webhook delivery will be available in a future release.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-amber-200/60 bg-amber-50/60 px-4 py-2.5">
                {!preferencesLoading && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    preferencesError
                      ? "border-red-200 bg-white text-red-600"
                      : "border-emerald-200 bg-white text-emerald-700"
                  }`}>
                    {preferencesError
                      ? <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      : <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                    {preferencesError ? "Could not sync" : "Synced to account"}
                  </span>
                )}
                <Link
                  to="/dashboard/alerts"
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Manage expiry alerts
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {([
                { key: "emailNotifications" as const, label: "Email notifications", desc: "Reserved for a future email provider integration", disabled: true },
                { key: "expiryAlerts" as const, label: "Expiry alert preference", desc: "Remember whether you want expiry reminders enabled", disabled: false },
                { key: "weeklyDigest" as const, label: "Weekly digest preference", desc: "Remember whether you want a weekly summary enabled", disabled: false },
              ]).map(({ key, label, desc, disabled }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{label}</p>
                      {disabled && <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">Not connected</span>}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
                  </div>
                  <Switch
                    checked={disabled ? false : preferences[key]}
                    onCheckedChange={(value) => updatePreference(key, value)}
                    disabled={disabled}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => void resetPreferences()} className={cn("h-9 text-xs", dashGhostBtn)}>Reset account preferences</Button>
            </div>
          </Panel>
        </div>

        <div id="security" className="scroll-mt-0 space-y-4">
          <Panel title="Sign out" description="End your current session and return to the login page.">
            <SignOutButton />
          </Panel>
          
          <Panel title="Security & data" description="Review retention, export, and deletion controls.">
            <div className="space-y-4">
              <Notice variant="info">
                KeyPing stores a masked key preview when you choose to save a result. Automatic retention is not currently configured, so saved history remains until you delete it or delete your account.
              </Notice>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Auto-delete old tests</p>
                  <p className="text-xs leading-relaxed text-slate-500">Not available yet. Use Delete all data below when you need to clear saved history.</p>
                </div>
                {/* A switch that is permanently off and permanently disabled is
                    a control the user can never operate, so it is shown as a
                    status instead. The notification preferences above use the
                    same treatment for the settings that have no delivery
                    mechanism yet. */}
                <span className="shrink-0 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">Not connected</span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => void handleExportData()} disabled={exportingData} className={cn("h-9 gap-1.5 border-slate-200 bg-white", dashGhostBtn)}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> {exportingData ? "Exporting..." : "Export data"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteDataOpen(true)} disabled={deletingData} className="h-9 gap-1.5 rounded-lg border-red-200 bg-white text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> {deletingData ? "Deleting..." : "Delete all data"}
                </Button>
              </div>

              <div className="border-t border-red-100 pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This requests deletion of your account and associated KeyPing data:</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
                          <li>All saved test history and masked previews</li>
                          <li>Team memberships and teams you own</li>
                          <li>Alerts and account profile data</li>
                        </ul>
                        <p className="font-medium text-red-600">This action cannot be undone. Transfer or delete owned teams first if the service blocks account deletion.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deletingAccount}
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={async (event) => {
                          event.preventDefault();
                          if (!user) return;
                          setDeletingAccount(true);
                          try {
                            const { error } = await supabase.rpc("delete_user_account");
                            if (error) throw error;
                          } catch (error: unknown) {
                            // Only a failure of the RPC itself means the account
                            // still exists.
                            toast.error(error instanceof Error ? error.message : "Could not delete account");
                            setDeletingAccount(false);
                            return;
                          }

                          // The account row is already gone at this point, so
                          // this is cleanup only. A sign out failure here used
                          // to fall into the catch above and report "could not
                          // delete account" for an account that had in fact
                          // been deleted, leaving the user on a settings page
                          // for an account that no longer exists.
                          try {
                            await supabase.auth.signOut();
                          } catch {
                            // Nothing to recover. The session is already
                            // invalid because the user no longer exists.
                          }
                          toast.success("Account deleted");
                          navigate("/", { replace: true });
                        }}
                      >
                        {deletingAccount ? "Deleting..." : "Delete account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Panel>
        </div>

      </PageShell>

      <AlertDialog open={deleteDataOpen} onOpenChange={(open) => { if (!deletingData) setDeleteDataOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all saved test data?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes every saved validation result for this account, including masked previews, notes, and history metadata. Team data and your account are not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingData}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deletingData} onClick={(event) => { event.preventDefault(); void handleDeleteAllData(); }} className="bg-red-600 text-white hover:bg-red-700">
              {deletingData ? "Deleting..." : "Delete all data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
