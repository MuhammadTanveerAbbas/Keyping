import DashboardLayout from "@/components/DashboardLayout";
import KeyHistory from "@/components/KeyHistory";

const HistoryPage = () => (
  <DashboardLayout>
    <div className="max-w-4xl mx-auto">
      <KeyHistory />
    </div>
  </DashboardLayout>
);

export default HistoryPage;
