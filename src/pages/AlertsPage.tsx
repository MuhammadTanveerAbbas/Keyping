import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Trash2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import {
 PageHeader,
 PageShell,
 Panel,
 Notice,
 EmptyState,
 SkeletonBlock,
 dashInput,
 dashPrimaryBtn,
} from "@/components/dashboard/ui";

type Alert = {
 id: string;
 key_nickname: string;
 expiry_date: string;
 reminder_days: number;
 notified: boolean;
 created_at: string;
};

const alertFormSchema = z.object({
 key_nickname: z.string().min(1, "Key nickname is required").max(200, "Nickname too long"),
 expiry_date: z.string().min(1, "Expiry date is required"),
 reminder_days: z.coerce.number().min(1).max(365),
});

const AlertsPage = () => {
 const { user } = useAuth();
 const [alerts, setAlerts] = useState<Alert[]>([]);
 const [loading, setLoading] = useState(true);

 const form = useForm<z.infer<typeof alertFormSchema>>({
  resolver: zodResolver(alertFormSchema),
  defaultValues: {
   key_nickname: "",
   expiry_date: "",
   reminder_days: 7,
  },
 });
 const creating = form.formState.isSubmitting;

 const fetchAlerts = useCallback(async () => {
  if (!user) return;
  setLoading(true);
  const { data, error } = await supabase
   .from("alerts")
   .select(
    "id, key_nickname, expiry_date, reminder_days, notified, created_at",
   )
   .eq("user_id", user.id)
   .order("expiry_date", { ascending: true });
  if (error) toast.error(error.message);
  else setAlerts((data as Alert[]) || []);
  setLoading(false);
 }, [user]);

 useEffect(() => {
  fetchAlerts();
 }, [fetchAlerts]);

 const createAlert = async (values: z.infer<typeof alertFormSchema>) => {
  if (!user) return;
  const { error } = await supabase.from("alerts").insert({
   user_id: user.id,
   key_nickname: values.key_nickname.trim(),
   expiry_date: new Date(values.expiry_date).toISOString(),
   reminder_days: values.reminder_days,
  });
  if (error) toast.error(error.message);
  else {
   toast.success("Alert created!");
   form.reset();
   fetchAlerts();
  }
 };

 const deleteAlert = async (id: string) => {
  const { error } = await supabase.from("alerts").delete().eq("id", id);
  if (error) toast.error(error.message);
  else {
   toast.success("Alert deleted");
   setAlerts((prev) => prev.filter((a) => a.id !== id));
  }
 };

 const getDaysUntil = (date: string) =>
  differenceInDays(new Date(date), new Date());

 const getUrgency = (date: string) => {
  const days = getDaysUntil(date);
  if (days < 0) return "expired";
  if (days <= 3) return "critical";
  if (days <= 7) return "warning";
  return "ok";
 };

 const urgencyBadge = (urgency: string) => {
  switch (urgency) {
   case "expired":
    return (
     <span className="font-mono text-xs bg-red-950 text-red-400 border border-red-800/50 rounded-md px-2 py-0.5">
      Expired
     </span>
    );
   case "critical":
    return (
     <span className="font-mono text-xs bg-red-950 text-red-400 border border-red-800/50 rounded-md px-2 py-0.5 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" /> Critical
     </span>
    );
   case "warning":
    return (
     <span className="font-mono text-xs bg-amber-950 text-amber-400 border border-amber-800/50 rounded-md px-2 py-0.5">
      Expiring Soon
     </span>
    );
   default:
    return (
     <span className="font-mono text-xs bg-green-950 text-green-400 border border-green-800/50 rounded-md px-2 py-0.5">
      Active
     </span>
    );
  }
 };

 const urgentAlerts = alerts.filter((a) => getDaysUntil(a.expiry_date) <= 7);

 return (
  <DashboardLayout>
   <PageShell width="sm">
    <PageHeader
     title="Expiry Alerts"
     description="Set reminders for key expiry dates. Alerts appear on this page when due — email delivery is not enabled yet."
    />

    {urgentAlerts.length > 0 && (
     <Notice variant="warning">
      <strong>{urgentAlerts.length} key(s)</strong> expiring within 7 days:{" "}
      {urgentAlerts.map((a) => a.key_nickname).join(", ")}
     </Notice>
    )}

    <Panel title="New reminder" description="In-app only for now">
     <Form {...form}>
      <form onSubmit={form.handleSubmit(createAlert)} className="space-y-4">
       <div className="grid gap-3 sm:grid-cols-3">
        <FormField
         control={form.control}
         name="key_nickname"
         render={({ field }) => (
          <FormItem>
           <FormLabel className="text-xs font-medium text-slate-600">
            Key nickname
           </FormLabel>
           <FormControl>
            <Input placeholder="e.g. Production OpenAI" {...field} className={dashInput} />
           </FormControl>
           <FormMessage className="text-xs text-red-500" />
          </FormItem>
         )}
        />
        <FormField
         control={form.control}
         name="expiry_date"
         render={({ field }) => (
          <FormItem>
           <FormLabel className="text-xs font-medium text-slate-600">
            Expiry date
           </FormLabel>
           <FormControl>
            <Input type="date" {...field} className={dashInput} />
           </FormControl>
           <FormMessage className="text-xs text-red-500" />
          </FormItem>
         )}
        />
        <FormField
         control={form.control}
         name="reminder_days"
         render={({ field }) => (
          <FormItem>
           <FormLabel className="text-xs font-medium text-slate-600">
            Remind before
           </FormLabel>
           <FormControl>
            <select
             {...field}
             onChange={(e) => field.onChange(parseInt(e.target.value))}
             className={dashInput + " w-full px-3 text-sm"}
            >
             <option value="1">1 day before</option>
             <option value="3">3 days before</option>
             <option value="7">7 days before</option>
            </select>
           </FormControl>
           <FormMessage className="text-xs text-red-500" />
          </FormItem>
         )}
        />
       </div>
       <Button type="submit" disabled={creating} className={dashPrimaryBtn}>
        {creating ? "Creating..." : "Create reminder"}
       </Button>
      </form>
     </Form>
    </Panel>

    {loading ? (
     <div className="space-y-3">
      <SkeletonBlock className="h-16" />
      <SkeletonBlock className="h-16" />
     </div>
    ) : alerts.length === 0 ? (
     <Panel>
      <EmptyState
       icon={Bell}
       title="No reminders yet"
       description="Add an expiry date above to track keys before they lapse."
      />
     </Panel>
    ) : (
     <div className="space-y-2">
      {alerts.map((alert) => {
       const urgency = getUrgency(alert.expiry_date);
       const daysLeft = getDaysUntil(alert.expiry_date);
       return (
        <div
         key={alert.id}
          className={`flex items-center justify-between rounded-xl border bg-white p-4 transition-shadow duration-200 hover:shadow-sm ${
           urgency === "expired" || urgency === "critical"
            ? "border-red-200"
            : urgency === "warning"
             ? "border-amber-200"
             : "border-slate-200"
          }`}
        >
         <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-slate-400" />
          <div>
           <p className="font-sans text-sm font-medium text-slate-800">
            {alert.key_nickname}
           </p>
           <div className="flex items-center gap-2 mt-0.5">
            {urgencyBadge(urgency)}
            <span className="font-mono text-xs text-slate-400">
             {daysLeft < 0
              ? `Expired ${Math.abs(daysLeft)}d ago`
              : daysLeft === 0
               ? "Expires today"
               : `${daysLeft}d left`}
            </span>
            <span className="font-mono text-xs text-slate-400">
             · {format(new Date(alert.expiry_date), "MMM d, yyyy")}
            </span>
           </div>
          </div>
         </div>
         <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
          onClick={() => deleteAlert(alert.id)}
         >
          <Trash2 className="h-3.5 w-3.5" />
         </Button>
        </div>
       );
      })}
     </div>
    )}
   </PageShell>
  </DashboardLayout>
 );
};

export default AlertsPage;
