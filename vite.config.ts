import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        // Only packages that are actually imported appear here. The list was
        // carrying entries for a popover, a toast, and the query client that
        // no source file imported, so the chunk boundaries described a
        // dependency set that did not exist.
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-switch",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
          ],
          charts: ["recharts"],
          motion: ["framer-motion"],
          // jspdf is only reached by the PDF export, which is why it is its
          // own chunk rather than part of the main bundle.
          pdf: ["jspdf"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
