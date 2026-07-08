import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
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
 User,
 Bell,
 Shield,
 Download,
 Trash2,
 Save,
 AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
 PageShell,
 PageHeader,
 Panel,
 dashInput,
 dashPrimaryBtn,
 dashGhostBtn,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const profileFormSchema = z.object({
 displayName: z.string().max(100, "Display name must be under 100 characters"),
});

const navSections = [
 { id: "profile", icon: User, label: "Profile" },
 { id: "notifications", icon: Bell, label: "Notifications" },
 { id: "security", icon: Shield, label: "Security & Data" },
] as const;

const SettingsPage = () => {
 const { user } = useAuth();
 const navigate = useNavigate();
 const profileForm = useForm<z.infer<typeof profileFormSchema>>({
  resolver: zodResolver(profileFormSchema),
  defaultValues: {
   displayName: user?.user_metadata?.full_name || "",
  },
 });
 const [savingProfile, setSavingProfile] = useState(false);
 const [emailNotifs, setEmailNotifs] = useState(true);
 const [expiryAlerts, setExpiryAlerts] = useState(true);
 const [weeklyDigest, setWeeklyDigest] = useState(false);
 const [deletingData, setDeletingData] = useState(false);
 const [deletingAccount, setDeletingAccount] = useState(false);

 const handleSaveProfile = async (values: z.infer<typeof profileFormSchema>) => {
  if (!user) return;
  setSavingProfile(true);
  const { error } = await supabase.auth.updateUser({
   data: { full_name: values.displayName },
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

 return (
  <DashboardLayout>
   <PageShell width="sm">
    <PageHeader
     title="Settings"
     description="Profile, notifications, appearance, and data controls."
    />

    <div className="flex flex-wrap gap-2">
     {navSections.map(({ id, icon: Icon, label }) => (
      <button
       key={id}
       type="button"
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm"
       onClick={() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
       }
      >
       <Icon className="h-3.5 w-3.5" />
       {label}
      </button>
     ))}
    </div>

    <div id="profile">
     <Panel title="Profile" description="Manage your account information">
      <div className="space-y-4">
       <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-medium text-slate-500">
         Email
        </Label>
        <Input
         id="email"
         value={user?.email || ""}
         disabled
         className={cn(dashInput, "opacity-70")}
        />
        <p className="text-xs text-slate-400">
         Managed by your authentication provider
        </p>
       </div>

       <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
         <FormField
          control={profileForm.control}
          name="displayName"
          render={({ field }) => (
           <FormItem className="space-y-2">
            <FormLabel className="text-xs font-medium text-slate-500">
             Display name
            </FormLabel>
            <FormControl>
             <Input placeholder="Enter your display name" {...field} className={dashInput} />
            </FormControl>
            <FormMessage className="text-xs text-red-500" />
           </FormItem>
          )}
         />

         <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <div>
           <p className="text-sm font-medium text-slate-800">Plan</p>
           <p className="text-xs text-slate-500">Your current subscription</p>
          </div>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-700">
           Free
          </span>
         </div>

         <Button type="submit" size="sm" disabled={savingProfile} className={cn("gap-1.5 h-9", dashPrimaryBtn)}>
          <Save className="h-3.5 w-3.5" />
          {savingProfile ? "Saving…" : "Save changes"}
         </Button>
        </form>
       </Form>
      </div>
     </Panel>
    </div>

    <div id="notifications">
     <Panel title="Notifications" description="Configure how you receive alerts">
      <div className="divide-y divide-slate-100">
       {([
        {
         label: "Email notifications",
         desc: "Get notified about test results via email",
         val: emailNotifs,
         set: setEmailNotifs,
         comingSoon: true,
        },
        {
         label: "Expiry alerts",
         desc: "Receive alerts before API keys expire",
         val: expiryAlerts,
         set: setExpiryAlerts,
         comingSoon: false,
        },
        {
         label: "Weekly digest",
         desc: "Summary of all key health statuses",
         val: weeklyDigest,
         set: setWeeklyDigest,
         comingSoon: true,
        },
       ] as const).map(({ label, desc, val, set, comingSoon }) => (
        <div key={label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
         <div>
          <div className="flex items-center gap-2">
           <p className="text-sm font-medium text-slate-800">{label}</p>
           {comingSoon && (
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">
             Coming soon
            </span>
           )}
          </div>
          <p className="text-xs text-slate-500">{desc}</p>
         </div>
         <Switch checked={val} onCheckedChange={set} disabled={comingSoon} />
        </div>
       ))}
      </div>
     </Panel>
    </div>

    <div id="security">
     <Panel title="Security & data" description="Manage data retention and exports">
      <div className="space-y-4">
       <div className="flex items-center justify-between gap-4 opacity-60">
        <div>
         <p className="text-sm font-medium text-slate-800">
          Auto-delete old tests
         </p>
         <p className="text-xs text-slate-500">
          Coming soon — use Delete all data below for now
         </p>
        </div>
        <Switch checked={false} disabled />
       </div>

       <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button
         variant="ghost"
         size="sm"
         className={cn("gap-1.5 h-9", dashGhostBtn)}
         onClick={handleExportData}
        >
         <Download className="h-3.5 w-3.5" /> Export data
        </Button>
        <Button
         variant="ghost"
         size="sm"
         disabled={deletingData}
          className="gap-1.5 h-9 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-200"
         onClick={handleDeleteAllData}
        >
         <Trash2 className="h-3.5 w-3.5" />
         {deletingData ? "Deleting…" : "Delete all data"}
        </Button>
       </div>

       <div className="border-t border-red-100 pt-4">
        <AlertDialog>
         <AlertDialogTrigger asChild>
          <Button
           variant="ghost"
           size="sm"
           className="gap-1.5 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:shadow-sm transition-all duration-200"
          >
           <AlertTriangle className="h-3.5 w-3.5" /> Delete account
          </Button>
         </AlertDialogTrigger>
         <AlertDialogContent className="border-slate-200 bg-white">
          <AlertDialogHeader>
           <AlertDialogTitle>Delete your account?</AlertDialogTitle>
           <AlertDialogDescription className="space-y-2">
            <p>This permanently deletes your account and all associated data:</p>
            <ul className="list-disc pl-4 text-sm text-slate-500">
             <li>All test history and saved keys</li>
             <li>Team memberships and owned teams</li>
             <li>Alerts and notification preferences</li>
             <li>Your Supabase authentication profile</li>
            </ul>
            <p className="font-medium text-red-600">
             This action cannot be undone.
            </p>
           </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
           <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
           <AlertDialogAction
            disabled={deletingAccount}
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
             if (!user) return;
             setDeletingAccount(true);
             try {
              const { error: deleteError } = await supabase.rpc("delete_user_account");
              if (deleteError) throw deleteError;
              await supabase.auth.signOut();
              toast.success("Account deleted");
              navigate("/");
             } catch (err: unknown) {
              const message =
               err instanceof Error ? err.message : "Failed to delete account";
              toast.error(message);
              setDeletingAccount(false);
             }
            }}
           >
            {deletingAccount ? "Deleting…" : "Delete account"}
           </AlertDialogAction>
          </AlertDialogFooter>
         </AlertDialogContent>
        </AlertDialog>
       </div>
      </div>
     </Panel>
    </div>
   </PageShell>
  </DashboardLayout>
 );
};

export default SettingsPage;
