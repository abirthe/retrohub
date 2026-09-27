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
        const distDir = path.resolve(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        // 1. Copy index.html to 200.html (Cloudflare Pages/Workers) and 404.html (GitHub Pages)
        const indexPath = path.resolve(distDir, 'index.html');
        const fallback200 = path.resolve(distDir, '200.html');
        const fallback404 = path.resolve(distDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallback200);
          fs.copyFileSync(indexPath, fallback404);
        }
        // 2. Guarantee that NO _redirects file exists anywhere in dist or public
        const redirectsPath = path.resolve(distDir, '_redirects');
        if (fs.existsSync(redirectsPath)) {
          fs.unlinkSync(redirectsPath);
        }
        // 3. Write .assetsignore to dist so Cloudflare Wrangler never uploads _redirects
        const assetsIgnorePath = path.resolve(distDir, '.assetsignore');
        fs.writeFileSync(assetsIgnorePath, '_redirects\n_headers\n');
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
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-carousel": ["embla-carousel-react"],
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge"],
          "vendor-video": ["hls.js"]
        },
      },
    },
  },
});
