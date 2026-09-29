export const pageMeta: Record<string, { title: string; description?: string }> = {
  "/dashboard": {
    title: "Command center",
    description: "Run validations, review provider health, and monitor saved results.",
  },
  "/dashboard/bulk": {
    title: "Bulk test",
    description: "Run multiple key checks and export a report.",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    description: "Explore validation trends, uptime, latency, and provider health.",
  },
  "/dashboard/history": {
    title: "History and vault",
    description: "Review saved results with provider, status, and time filters.",
  },
  "/dashboard/alerts": {
    title: "Expiry alerts",
    description: "Track credential expiry dates and reminder windows.",
  },
  "/dashboard/team": {
    title: "Team workspace",
    description: "Manage members and secure workspace invitations.",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Manage your profile, preferences, security, and data.",
  },
};
