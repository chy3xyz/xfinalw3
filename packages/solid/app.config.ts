import { defineConfig } from "@solidjs/start/config"

export default defineConfig({
  ssr: false,
  server: {
    preset: "static"
  },
  vite: {
    server: {
      port: 5173,
      proxy: {
        // Admin REST + GraphQL → bponder (mmm pattern: /api → indexer)
        "/api": {
          target: process.env.VITE_PONDER_PROXY || "http://127.0.0.1:42069",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, "") || "/"
        },
        // Public JSON-RPC proxy (gated on indexer /rpc)
        "/rpc": {
          target: process.env.VITE_PONDER_PROXY || "http://127.0.0.1:42069",
          changeOrigin: true
        },
        "/ponder": {
          target: process.env.VITE_PONDER_PROXY || "http://127.0.0.1:42069",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/ponder/, "") || "/"
        }
      }
    },
    build: {
      target: "es2022"
    },
    resolve: {
      alias: {
        "scaffold.config": "/scaffold.config.ts"
      }
    }
  }
})
