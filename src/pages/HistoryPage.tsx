import DashboardLayout from "@/components/DashboardLayout";
import KeyHistory from "@/components/KeyHistory";
import { PageHeader, PageShell } from "@/components/dashboard/ui";

const HistoryPage = () => (
 <DashboardLayout>
  <PageShell width="md">
   <PageHeader
    title="Test History"
    description="Filter and expand saved results. Full keys are never stored."
   />
   <KeyHistory />
  </PageShell>
 </DashboardLayout>
);

export default HistoryPage;
