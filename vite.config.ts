import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // مسارات نسبية (./) فقط لبناء تطبيق الموبايل (Capacitor يفتح الملفات عبر file://)
  // مسارات مطلقة (/) لبناء الويب (Netlify/Vercel) حتى يعمل التوجيه للمسارات المتداخلة مثل /dashboard/customer
  base: mode === "capacitor" ? "./" : "/",
  plugins: [react()], 
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    include: ["@capacitor/core", "@capacitor/cli"],
  },
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "@tanstack/react-query"],
        },
      },
    },
  },
}));
