export const pageMeta: Record<string, { title: string; description?: string }> = {
  "/dashboard": {
    title: "API Key Tester",
    description: "Validate a key against its provider and inspect health, latency, and scopes.",
  },
  "/dashboard/bulk": {
    title: "Bulk Test",
    description: "Run up to 10 keys in parallel and export a PDF report.",
  },
  "/dashboard/vault": {
    title: "Key Vault",
    description: "Browse saved test results. Only the last four characters of each key are stored.",
  },
  "/dashboard/team": {
    title: "Team Workspace",
    description: "Create teams and share invite links with collaborators.",
  },
  "/dashboard/stats": {
    title: "Stats",
    description: "Charts and aggregates from your validation history.",
  },
  "/dashboard/history": {
    title: "Test History",
    description: "Every saved result, filterable by provider and status.",
  },
  "/dashboard/alerts": {
    title: "Expiry Alerts",
    description: "Track key expiry dates and see reminders on this page.",
  },
  "/dashboard/docs": {
    title: "Documentation",
    description: "Quick start, supported providers, and keyboard shortcuts.",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Profile, appearance, notifications, and data controls.",
  },
};
