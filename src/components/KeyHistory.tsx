import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon, ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";

type KeyTest = {
  id: string;
  provider: string;
  key_preview: string;
  nickname: string | null;
  notes: string | null;
  status: string;
  scopes: any;
  rate_limit_info: any;
  tested_at: string;
  health_score: number | null;
  latency_ms: number | null;
};

export default function KeyHistory() {
  const { user } = useAuth();
  const [tests, setTests] = useState<KeyTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTests = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("key_tests")
      .select("id, provider, key_preview, nickname, notes, status, scopes, rate_limit_info, tested_at, health_score, latency_ms")
      .order("tested_at", { ascending: false });

    if (filterProvider !== "all") query = query.eq("provider", filterProvider);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setTests((data as KeyTest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, [user, filterProvider, filterStatus]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("key_tests").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setTests((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const providerName = (id: string) => PROVIDERS.find((p) => p.id === id)?.name || id;

  const statusIcon = (s: string) => {
    if (s === "valid") return <CheckCircle2 className="h-3 w-3 text-green-400" />;
    if (s === "invalid") return <XCircle className="h-3 w-3 text-red-400" />;
    return <AlertTriangle className="h-3 w-3 text-amber-400" />;
  };

  // Group by nickname for changelog
  const getChangelog = (nickname: string | null, currentId: string) => {
    if (!nickname) return [];
    return tests.filter(t => t.nickname === nickname && t.id !== currentId).slice(0, 5);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-40 bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 text-slate-900 dark:text-white rounded-xl">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-blue-500/20">
            <SelectItem value="all">All providers</SelectItem>
            {PROVIDERS.filter((p) => p.id !== "custom").map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 bg-white dark:bg-[#0A0A0A] border-slate-300 dark:border-blue-500/20 text-slate-900 dark:text-white rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-blue-500/20">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-8 text-center">
          <p className="font-mono text-sm text-slate-400 dark:text-blue-400/40">&gt; No saved tests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tests.map((t) => {
            const changelog = getChangelog(t.nickname, t.id);
            return (
              <div key={t.id} className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl card-hover-lift">
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProviderIconBadge provider={t.provider} className="h-7 w-7" />
                    <StatusBadge status={t.status} size="sm" />
                    <span className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {t.nickname || providerName(t.provider)}
                    </span>
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-600">
                      ****{t.key_preview}
                    </span>
                    {t.health_score !== null && (
                      <span className={`font-mono text-xs font-bold ${
                        t.health_score >= 80 ? "text-green-600 dark:text-green-400" : t.health_score >= 50 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"
                      }`}>
                        {t.health_score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.latency_ms !== null && (
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-600 hidden sm:inline">{t.latency_ms}ms</span>
                    )}
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-600 hidden sm:inline">
                      {format(new Date(t.tested_at), "MMM d, yyyy HH:mm")}
                    </span>
                    {expandedId === t.id ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                </button>

                {expandedId === t.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-blue-500/10 pt-3">
                    <div className="flex flex-col sm:flex-row gap-6">
                      {t.health_score !== null && (
                        <HealthScoreRing score={t.health_score} size={80} strokeWidth={6} />
                      )}
                      <div className="flex-1 space-y-2 font-sans text-sm">
                        <p><span className="text-slate-500 dark:text-slate-400">Provider:</span> <span className="text-slate-800 dark:text-slate-300">{providerName(t.provider)}</span></p>
                        {t.latency_ms !== null && (
                          <p><span className="text-slate-500 dark:text-slate-400">Latency:</span> <span className="font-mono text-slate-800 dark:text-slate-300">{t.latency_ms}ms</span></p>
                        )}
                        {t.notes && <p><span className="text-slate-500 dark:text-slate-400">Notes:</span> <span className="text-slate-800 dark:text-slate-300">{t.notes}</span></p>}
                        {t.scopes && Array.isArray(t.scopes) && t.scopes.length > 0 && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400">Scopes: </span>
                            {t.scopes.map((s: string) => (
                              <span key={s} className="font-mono text-xs bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded px-2 py-0.5 mr-1 mb-1 inline-block">{s}</span>
                            ))}
                          </div>
                        )}
                        {t.rate_limit_info && (
                          <p>
                            <span className="text-slate-500 dark:text-slate-400">Rate limit remaining: </span>
                            <span className="font-mono text-slate-800 dark:text-slate-300">{(t.rate_limit_info as any).remaining ?? "N/A"}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {changelog.length > 0 && (
                      <div className="border-t border-slate-100 dark:border-blue-500/10 pt-3">
                        <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase tracking-wide">Status Changelog</p>
                        <div className="space-y-2 pl-3 border-l-2 border-blue-200 dark:border-blue-500/20">
                          <div className="relative pl-4">
                            <div className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-blue-500" />
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              {format(new Date(t.tested_at), "MMM d")}  {statusIcon(t.status)} {t.status}
                            </span>
                          </div>
                          {changelog.map(cl => (
                            <div key={cl.id} className="relative pl-4">
                              <div className="absolute -left-[7px] top-1.5 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <span className="font-mono text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                {format(new Date(cl.tested_at), "MMM d")}  {statusIcon(cl.status)} {cl.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button variant="ghost" size="sm"
                      className="text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 font-sans text-xs rounded-xl"
                      onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
