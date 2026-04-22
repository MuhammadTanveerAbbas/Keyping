import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Key, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function VaultPage() {
  const { user } = useAuth();
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const { data: savedKeys, isLoading } = useQuery({
    queryKey: ["vault-keys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_tests")
        .select("*")
        .eq("user_id", user.id)
        .order("tested_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyPreview = (preview: string) => {
    navigator.clipboard.writeText(`****${preview}`);
    toast.success("Key preview copied");
  };

  const validKeys = savedKeys?.filter((k) => k.status === "valid") || [];
  const invalidKeys = savedKeys?.filter((k) => k.status !== "valid") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              API Key Vault
            </h2>
            <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-1">
              Securely manage and monitor your tested API keys
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {savedKeys?.length || 0}
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                  Total Keys
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-800/50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-green-600 dark:text-green-400">
                  {validKeys.length}
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                  Valid Keys
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl p-5 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800/50 flex items-center justify-center">
                <Key className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-red-600 dark:text-red-400">
                  {invalidKeys.length}
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400">
                  Invalid Keys
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#000000] border border-slate-200 dark:border-blue-500/20 rounded-2xl overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.04)]">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-blue-500/20">
            <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm">
              Stored Keys
            </h3>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keys from your test history only last 4 characters are stored
            </p>
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-slate-100 dark:bg-blue-500/5 animate-pulse"
                  />
                ))}
              </div>
            ) : !savedKeys?.length ? (
              <div className="text-center py-12">
                <Shield className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-blue-500/20" />
                <p className="font-sans font-medium text-slate-500 dark:text-slate-400">
                  No keys in vault
                </p>
                <p className="font-sans text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Test an API key to add it here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-blue-500/10 hover:bg-slate-50 dark:hover:bg-blue-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
                        <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-sans text-sm font-medium text-slate-700 dark:text-slate-300">
                          {key.nickname || key.provider}
                        </p>
                        <p className="font-mono text-xs text-slate-400 dark:text-slate-600">
                          {revealedKeys.has(key.id)
                            ? `****${key.key_preview}`
                            : "••••••••"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono text-xs rounded-lg border px-2 py-0.5 ${
                          key.status === "valid"
                            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50"
                            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50"
                        }`}
                      >
                        {key.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
                        onClick={() => toggleReveal(key.id)}
                      >
                        {revealedKeys.has(key.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300"
                        onClick={() => copyPreview(key.key_preview)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
