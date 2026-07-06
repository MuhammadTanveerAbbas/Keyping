import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ApiKeyTester from "@/components/ApiKeyTester";
import DashboardWidgets from "@/components/DashboardWidgets";
import { PageHeader, PageShell } from "@/components/dashboard/ui";

const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSave = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <DashboardLayout>
      <PageShell>
        <PageHeader
          title="API Key Tester"
          description="Paste a key, pick a provider, and get a live validation result in seconds."
        />
        <ApiKeyTester onSave={handleSave} />
        <DashboardWidgets refreshKey={refreshKey} />
      </PageShell>
    </DashboardLayout>
  );
};

export default Dashboard;
