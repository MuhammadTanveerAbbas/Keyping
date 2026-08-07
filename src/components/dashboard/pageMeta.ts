export const pageMeta: Record<string, { title: string; description?: string }> = {
  "/dashboard": {
    title: "API Key Tester",
    description: "Validate a key against its provider and inspect health, latency, and scopes.",
  },
  "/dashboard/bulk": {
    title: "Bulk Test",
    description: "Run up to 10 keys in parallel and export a PDF report.",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    description: "Comprehensive breakdowns of your API key validation history.",
  },
  "/dashboard/history": {
    title: "History & Vault",
    description: "Every saved result, filterable by provider and status.",
  },
  "/dashboard/team": {
    title: "Team Workspace",
    description: "Create teams and share invite links with collaborators.",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Profile, appearance, notifications, and data controls.",
  },
};
