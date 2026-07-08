import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PROVIDERS } from "@/lib/providers";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Trash2,
 ChevronDown,
 ChevronUp,
 CheckCircle2,
 XCircle,
 AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
 dashSelectTrigger,
 dashSelectContent,
 EmptyState,
 Panel,
 SkeletonBlock,
} from "@/components/dashboard/ui";
import { format } from "date-fns";
import { HealthScoreRing } from "@/components/HealthScoreRing";
import { ProviderIcon, ProviderIconBadge } from "@/components/ProviderIcon";
import { StatusBadge } from "@/components/StatusBadge";

type RateLimitInfo = {
 remaining?: number;
 resetAt?: string;
};

type KeyTest = {
 id: string;
 provider: string;
 key_preview: string;
 nickname: string | null;
 notes: string | null;
 status: string;
 scopes: Json;
 rate_limit_info: Json;
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

 const fetchTests = useCallback(async () => {
  if (!user) return;
  setLoading(true);
  let query = supabase
   .from("key_tests")
   .select(
    "id, provider, key_preview, nickname, notes, status, scopes, rate_limit_info, tested_at, health_score, latency_ms",
   )
   .eq("user_id", user.id)
   .order("tested_at", { ascending: false });

  if (filterProvider !== "all") query = query.eq("provider", filterProvider);
  if (filterStatus !== "all") query = query.eq("status", filterStatus);

  const { data, error } = await query;
  if (error) toast.error(error.message);
  else setTests((data as KeyTest[]) || []);
  setLoading(false);
 }, [user, filterProvider, filterStatus]);

 useEffect(() => {
  fetchTests();
 }, [fetchTests]);

 const handleDelete = async (id: string) => {
  const { error } = await supabase.from("key_tests").delete().eq("id", id);
  if (error) toast.error(error.message);
  else {
   toast.success("Deleted");
   setTests((prev) => prev.filter((t) => t.id !== id));
  }
 };

 const providerName = (id: string) =>
  PROVIDERS.find((p) => p.id === id)?.name || id;

 const statusIcon = (s: string) => {
  if (s === "valid")
   return <CheckCircle2 className="h-3 w-3 text-green-400" />;
  if (s === "invalid") return <XCircle className="h-3 w-3 text-red-400" />;
  return <AlertTriangle className="h-3 w-3 text-amber-400" />;
 };

 // Group by nickname for changelog
 const getChangelog = (nickname: string | null, currentId: string) => {
  if (!nickname) return [];
  return tests
   .filter((t) => t.nickname === nickname && t.id !== currentId)
   .slice(0, 5);
 };

 return (
  <div className="space-y-4">
   {/* Filters */}
   <div className="flex flex-wrap gap-3">
    <Select value={filterProvider} onValueChange={setFilterProvider}>
     <SelectTrigger className={`w-40 ${dashSelectTrigger}`}>
      <SelectValue placeholder="Provider" />
     </SelectTrigger>
     <SelectContent className={dashSelectContent}>
      <SelectItem value="all">All providers</SelectItem>
      {PROVIDERS.filter((p) => p.id !== "custom").map((p) => (
       <SelectItem key={p.id} value={p.id}>
        {p.name}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>

    <Select value={filterStatus} onValueChange={setFilterStatus}>
     <SelectTrigger className={`w-36 ${dashSelectTrigger}`}>
      <SelectValue placeholder="Status" />
     </SelectTrigger>
     <SelectContent className={dashSelectContent}>
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
     <SkeletonBlock className="h-16" />
     <SkeletonBlock className="h-16" />
    </div>
   ) : tests.length === 0 ? (
    <Panel>
     <EmptyState icon={CheckCircle2} title="No saved tests" description="Results appear here after you save a test from the tester." />
    </Panel>
   ) : (
    <div className="space-y-2">
     {tests.map((t) => {
      const changelog = getChangelog(t.nickname, t.id);
      return (
       <div
        key={t.id}
        className="rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow"
       >
        <button
         className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 rounded-xl"
         onClick={() =>
          setExpandedId(expandedId === t.id ? null : t.id)
         }
        >
         <div className="flex items-center gap-3 min-w-0">
          <ProviderIconBadge
           provider={t.provider}
           className="h-7 w-7"
          />
          <StatusBadge status={t.status} size="sm" />
          <span className="font-sans text-sm font-medium text-slate-700 truncate">
           {t.nickname || providerName(t.provider)}
          </span>
          <span className="font-mono text-xs text-slate-400">
           ****{t.key_preview}
          </span>
          {t.health_score !== null && (
           <span
            className={`font-mono text-xs font-bold ${
             t.health_score >= 80
              ? "text-green-600"
              : t.health_score >= 50
               ? "text-amber-500"
               : "text-red-500"
            }`}
           >
            {t.health_score}
           </span>
          )}
         </div>
         <div className="flex items-center gap-2 shrink-0">
          {t.latency_ms !== null && (
           <span className="font-mono text-xs text-slate-400 hidden sm:inline">
            {t.latency_ms}ms
           </span>
          )}
          <span className="font-mono text-xs text-slate-400 hidden sm:inline">
           {format(new Date(t.tested_at), "MMM d, yyyy HH:mm")}
          </span>
          {expandedId === t.id ? (
           <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
           <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
         </div>
        </button>

        {expandedId === t.id && (
         <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
          <div className="flex flex-col sm:flex-row gap-6">
           {t.health_score !== null && (
            <HealthScoreRing
             score={t.health_score}
             size={80}
             strokeWidth={6}
            />
           )}
           <div className="flex-1 space-y-2 font-sans text-sm">
            <p>
             <span className="text-slate-500">
              Provider:
             </span>{" "}
             <span className="text-slate-800">
              {providerName(t.provider)}
             </span>
            </p>
            {t.latency_ms !== null && (
             <p>
              <span className="text-slate-500">
               Latency:
              </span>{" "}
              <span className="font-mono text-slate-800">
               {t.latency_ms}ms
              </span>
             </p>
            )}
            {t.notes && (
             <p>
              <span className="text-slate-500">
               Notes:
              </span>{" "}
              <span className="text-slate-800">
               {t.notes}
              </span>
             </p>
            )}
            {t.scopes &&
             Array.isArray(t.scopes) &&
             t.scopes.length > 0 && (
              <div>
               <span className="text-slate-500">
                Scopes:{" "}
               </span>
               {(t.scopes as string[]).map((s) => (
                <span
                 key={s}
                 className="font-mono text-xs bg-blue-50 border border-blue-100 text-blue-600 rounded px-2 py-0.5 mr-1 mb-1 inline-block"
                >
                 {s}
                </span>
               ))}
              </div>
             )}
            {t.rate_limit_info && (
             <p>
              <span className="text-slate-500">
               Rate limit remaining:{" "}
              </span>
              <span className="font-mono text-slate-800">
               {(t.rate_limit_info as RateLimitInfo | null)?.remaining ?? "N/A"}
              </span>
             </p>
            )}
           </div>
          </div>

          {changelog.length > 0 && (
           <div className="border-t border-slate-100 pt-3">
            <p className="font-sans text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">
             Status Changelog
            </p>
            <div className="space-y-2 pl-3 border-l-2 border-blue-200">
             <div className="relative pl-4">
              <div className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-blue-500" />
              <span className="font-mono text-xs text-slate-700 flex items-center gap-1">
               {format(new Date(t.tested_at), "MMM d")}{" "}
               {statusIcon(t.status)} {t.status}
              </span>
             </div>
             {changelog.map((cl) => (
              <div key={cl.id} className="relative pl-4">
               <div className="absolute -left-[9px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
               <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                {format(new Date(cl.tested_at), "MMM d")}{" "}
                {statusIcon(cl.status)} {cl.status}
               </span>
              </div>
             ))}
            </div>
           </div>
          )}

          <Button
           variant="ghost"
           size="sm"
           className="text-slate-400 hover:text-red-500 hover:bg-red-50 gap-1 font-sans text-xs rounded-xl"
           onClick={() => handleDelete(t.id)}
          >
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
