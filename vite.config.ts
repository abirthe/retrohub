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
      ignored: ["**/Products/**", "**/scripts/**"],
    },
  },
  plugins: [
    react(),
    {
      name: "cloudflare-spa-fallback",
      closeBundle() {
        const distDir = path.resolve(__dirname, "dist");
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        // 1. Copy index.html to 200.html (Cloudflare Pages/Workers) and 404.html (GitHub Pages)
        const indexPath = path.resolve(distDir, "index.html");
        const fallback200 = path.resolve(distDir, "200.html");
        const fallback404 = path.resolve(distDir, "404.html");
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallback200);
          fs.copyFileSync(indexPath, fallback404);
        }
        // 2. Guarantee that NO _redirects file exists anywhere in dist or public
        const redirectsPath = path.resolve(distDir, "_redirects");
        if (fs.existsSync(redirectsPath)) {
          fs.unlinkSync(redirectsPath);
        }
        // 3. Write .assetsignore to dist so Cloudflare Wrangler never uploads _redirects
        const assetsIgnorePath = path.resolve(distDir, ".assetsignore");
        fs.writeFileSync(assetsIgnorePath, "_redirects\n_headers\n");
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
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (id.includes("@radix-ui") || id.includes("lucide-react")) {
              return "vendor-ui";
            }
            if (id.includes("@supabase")) {
              return "vendor-supabase";
            }
            if (id.includes("@tanstack")) {
              return "vendor-tanstack";
            }
            if (id.includes("hls.js")) {
              return "vendor-video";
            }
          }
        },
      },
    },
  },
});
