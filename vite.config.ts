import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: ['**/Products/**', '**/scripts/**'],
    },
  },
  plugins: [
    react(),
    {
      name: 'cloudflare-spa-fallback',
      closeBundle() {
        // 1. Copy index.html to 200.html (Cloudflare Pages/Workers standard SPA fallback)
        const indexPath = path.resolve(__dirname, 'dist/index.html');
        const fallbackPath = path.resolve(__dirname, 'dist/200.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
        }
        // 2. Guarantee that NO _redirects file exists anywhere in dist
        const redirectsPath = path.resolve(__dirname, 'dist/_redirects');
        if (fs.existsSync(redirectsPath)) {
          fs.unlinkSync(redirectsPath);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "lucide-react",
          ],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-tanstack": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
});
