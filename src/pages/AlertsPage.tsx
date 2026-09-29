import { useState } from "react";
import { differenceInDays, format } from "date-fns";
import { Bell, CalendarClock, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, PageShell, Panel, Notice } from "@/components/dashboard/ui";
import { useAlerts } from "@/hooks/useAlerts";
import { notifyDataChanged } from "@/lib/data-events";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const { user } = useAuth();
  const { alerts, loading, error, refresh, removeAlert } = useAlerts();
  const [nickname, setNickname] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderDays, setReminderDays] = useState("7");
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  // The query already orders by expiry_date ascending, so the alerts arrive
  // sorted and re-sorting them here was redundant work on every render.
  const sortedAlerts = alerts;

  const createAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const trimmedNickname = nickname.trim();
    const days = Number(reminderDays);
    if (!trimmedNickname || !expiryDate) {
      toast.error("Add a nickname and expiry date");
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      toast.error("Reminder days must be between 1 and 365");
      return;
    }
    // The date input gives a bare yyyy-MM-dd, which Postgres reads as midnight
    // UTC. The day count is then computed against the user's own midnight, so
    // for anyone west of UTC an alert created for today or tomorrow already
    // read as expired. Sending the value as the user's own local noon keeps
    // both the stored instant and the displayed date on the intended day in
    // every timezone.
    const expiryInstant = new Date(`${expiryDate}T12:00:00`);
    if (Number.isNaN(expiryInstant.getTime())) {
      toast.error("Enter a valid expiry date");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("alerts").insert({
      user_id: user.id,
      key_nickname: trimmedNickname,
      expiry_date: expiryInstant.toISOString(),
      reminder_days: days,
    });
    setSaving(false);
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    setNickname("");
    setExpiryDate("");
    setReminderDays("7");
    await refresh();
    notifyDataChanged("alerts");
    toast.success("Expiry alert created");
  };

  const deleteAlert = async (id: string) => {
    const result = await removeAlert(id);
    if (result.ok) {
      notifyDataChanged("alerts");
      toast.success("Alert removed");
    } else {
      toast.error(result.message || "Could not remove the alert");
    }
  };

  return (
    <>
      <PageShell width="md">
        <PageHeader title="Expiry alerts" description="Get a clear view of credentials that need attention before they expire." />
        <div className="mb-1 overflow-hidden rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50 to-indigo-50/40">
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 shadow-sm">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-900">Delivery not connected</p>
              <p className="mt-0.5 text-[11px] leading-4 text-blue-700">Alerts are saved to your account. Email and webhook delivery will be available in a future release.</p>
            </div>
          </div>
        </div>

        <Panel title="Create an alert" description="Use a nickname that identifies the key without storing the secret.">
          <form onSubmit={createAlert} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.7fr_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="alert-nickname" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Key nickname</Label>
              <Input id="alert-nickname" placeholder="Production OpenAI key" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={200} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-expiry" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Expiry date</Label>
              <Input id="alert-expiry" type="date" min={today} value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-reminder" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Remind days before</Label>
              <Input id="alert-reminder" type="number" min={1} max={365} value={reminderDays} onChange={(event) => setReminderDays(event.target.value)} className="h-10 rounded-xl" />
            </div>
            <Button type="submit" disabled={saving} className="h-10 gap-2 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add alert
            </Button>
          </form>
        </Panel>

        <Panel title="Your alerts" description={`${alerts.length} reminder${alerts.length === 1 ? "" : "s"} configured`}>
          {error && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</div>}
          {loading ? (
            <div className="space-y-2" role="status" aria-live="polite" aria-label="Loading alerts">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : sortedAlerts.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">No alerts configured</p>
              <p className="mt-1 text-sm text-slate-500">Create one above when a key has an expiry date.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedAlerts.map((alert) => {
                const days = differenceInDays(new Date(alert.expiry_date), new Date());
                const urgent = days <= alert.reminder_days;
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all",
                      urgent ? "border-amber-200 bg-amber-50/60 shadow-sm" : "border-slate-200/90 bg-white hover:border-slate-300",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", urgent ? "bg-amber-100 text-amber-600 shadow-sm" : "bg-blue-50 text-blue-600 shadow-sm")}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{alert.key_nickname}</p>
                        <p className={cn("text-xs font-medium", urgent ? "text-amber-700" : "text-slate-500")}>
                          {days < 0 ? "Expired" : days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`} on {format(new Date(alert.expiry_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                        {alert.reminder_days}d notice
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void deleteAlert(alert.id)}
                        aria-label={`Delete ${alert.key_nickname} alert`}
                        className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Only the nickname and expiry metadata are stored for reminders.
        </div>
      </PageShell>
    </>
  );
}
