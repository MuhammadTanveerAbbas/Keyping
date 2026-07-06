import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Key, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  PageHeader,
  PageShell,
  Panel,
  Stat,
  StatGrid,
  EmptyState,
  SkeletonBlock,
} from "@/components/dashboard/ui";

export default function VaultPage() {
  const { user } = useAuth();
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const { data: savedKeys, isLoading, error: vaultError } = useQuery({
    queryKey: ["vault-keys", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPreview = (preview: string) => {
    navigator.clipboard.writeText(`****${preview}`);
    toast.success("Key preview copied");
  };

  const validKeys = savedKeys?.filter((k) => k.status === "valid") || [];
  const unhealthy =
    savedKeys?.filter((k) => k.status !== "valid").length || 0;

  return (
    <DashboardLayout>
      <PageShell>
        <PageHeader
          title="Key Vault"
          description="Saved test results with key previews only — never the full secret."
        />

        <StatGrid cols={3}>
          <Stat icon={Key} label="Total saved" value={savedKeys?.length || 0} />
          <Stat icon={Shield} label="Valid" value={validKeys.length} tone="success" />
          <Stat icon={Key} label="Needs attention" value={unhealthy} tone={unhealthy > 0 ? "warning" : "default"} />
        </StatGrid>

        <Panel
          title="Stored keys"
          description="Last 20 saved results from your history"
          noPadding
        >
          <div className="p-5">
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-14" />
                <SkeletonBlock className="h-14" />
                <SkeletonBlock className="h-14" />
              </div>
            ) : vaultError ? (
              <EmptyState
                icon={Shield}
                title="Could not load vault"
                description={vaultError.message}
              />
            ) : !savedKeys?.length ? (
              <EmptyState
                icon={Key}
                title="Vault is empty"
                description="Save a test result from the tester to see it here."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
                {savedKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {key.nickname || key.provider}
                        </p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-500">
                          {revealedKeys.has(key.id)
                            ? `****${key.key_preview}`
                            : "••••••••"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          key.status === "valid"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : key.status === "limited"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        }`}
                      >
                        {key.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => toggleReveal(key.id)}
                        aria-label={revealedKeys.has(key.id) ? "Hide preview" : "Show preview"}
                      >
                        {revealedKeys.has(key.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => copyPreview(key.key_preview)}
                        aria-label="Copy preview"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </PageShell>
    </DashboardLayout>
  );
}
