import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Plus, Trash2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

type Alert = {
  id: string;
  key_nickname: string;
  expiry_date: string;
  reminder_days: number;
  notified: boolean;
  created_at: string;
};

const AlertsPage = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reminderDays, setReminderDays] = useState("7");
  const [creating, setCreating] = useState(false);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("alerts").select("*").order("expiry_date", { ascending: true });
    if (error) toast.error(error.message);
    else setAlerts((data as Alert[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, [user]);

  const createAlert = async () => {
    if (!user || !nickname.trim() || !expiryDate) return;
    setCreating(true);
    const { error } = await supabase.from("alerts").insert({
      user_id: user.id,
      key_nickname: nickname.trim(),
      expiry_date: new Date(expiryDate).toISOString(),
      reminder_days: parseInt(reminderDays) || 7,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Alert created!");
      setNickname("");
      setExpiryDate("");
      fetchAlerts();
    }
    setCreating(false);
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Alert deleted");
      setAlerts(prev => prev.filter(a => a.id !== id));
    }
  };

  const getDaysUntil = (date: string) => differenceInDays(new Date(date), new Date());

  const getUrgency = (date: string) => {
    const days = getDaysUntil(date);
    if (days < 0) return "expired";
    if (days <= 3) return "critical";
    if (days <= 7) return "warning";
    return "ok";
  };

  const urgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "expired": return <span className="font-mono text-xs bg-red-950 text-red-400 border border-red-800/50 rounded-md px-2 py-0.5">Expired</span>;
      case "critical": return <span className="font-mono text-xs bg-red-950 text-red-400 border border-red-800/50 rounded-md px-2 py-0.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Critical</span>;
      case "warning": return <span className="font-mono text-xs bg-amber-950 text-amber-400 border border-amber-800/50 rounded-md px-2 py-0.5">Expiring Soon</span>;
      default: return <span className="font-mono text-xs bg-green-950 text-green-400 border border-green-800/50 rounded-md px-2 py-0.5">Active</span>;
    }
  };

  const urgentAlerts = alerts.filter(a => getDaysUntil(a.expiry_date) <= 7);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Alert banner */}
        {urgentAlerts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-sm font-semibold text-slate-900 dark:text-white">
                {urgentAlerts.length} key(s) expiring within 7 days
              </p>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {urgentAlerts.map(a => a.key_nickname).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Create alert */}
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-500" /> Set Key Expiry Reminder
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Key Nickname</Label>
              <Input
                placeholder="e.g. Production OpenAI"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-blue-400/30 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 text-slate-900 dark:text-white rounded-xl mt-1 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <Label className="font-sans text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Remind Before</Label>
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-blue-500/20 bg-white dark:bg-[#0A0A0A] px-3 py-2 font-sans text-sm text-slate-900 dark:text-white mt-1 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none"
              >
                <option value="1">1 day before</option>
                <option value="3">3 days before</option>
                <option value="7">7 days before</option>
              </select>
            </div>
          </div>
          <Button
            onClick={createAlert}
            disabled={creating || !nickname.trim() || !expiryDate}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-black font-sans font-semibold text-sm rounded-xl dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all border-0"
          >
            Create Reminder
          </Button>
        </div>

        {/* Alerts list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-4 h-16 animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-8 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-blue-500/20" />
            <p className="font-sans text-sm text-slate-500 dark:text-slate-400">No alerts set. Create one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => {
              const urgency = getUrgency(alert.expiry_date);
              const daysLeft = getDaysUntil(alert.expiry_date);
              return (
                <div key={alert.id}
                  className={`bg-white dark:bg-[#000000] border rounded-2xl p-4 flex items-center justify-between card-hover-lift transition-all ${
                    urgency === "expired" || urgency === "critical" ? "border-red-200 dark:border-red-800/40" :
                    urgency === "warning" ? "border-amber-200 dark:border-amber-800/40" : "border-slate-200 dark:border-blue-500/20"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <div>
                      <p className="font-sans text-sm font-medium text-slate-800 dark:text-slate-300">{alert.key_nickname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {urgencyBadge(urgency)}
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-600">
                          {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` :
                           daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                        </span>
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-600">
                          · {format(new Date(alert.expiry_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => deleteAlert(alert.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AlertsPage;
