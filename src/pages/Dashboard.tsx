import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ApiKeyTester from "@/components/ApiKeyTester";
import DashboardWidgets from "@/components/DashboardWidgets";

const Dashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSave = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <ApiKeyTester onSave={handleSave} />
        <DashboardWidgets refreshKey={refreshKey} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
