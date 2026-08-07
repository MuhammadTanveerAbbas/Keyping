import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ApiKeyTester from "@/components/ApiKeyTester";
import { PageHeader, PageShell } from "@/components/dashboard/ui";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSave = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <DashboardLayout>
      <PageShell>
        <PageHeader
          title="API Key Tester"
          description={<><span className="hidden sm:inline">Paste a key, pick a provider, and get a live validation result in seconds.</span><span className="sm:hidden">Validate keys in seconds.</span></>}
        />
        <ApiKeyTester onSave={handleSave} />
      </PageShell>
    </DashboardLayout>
  );
}
