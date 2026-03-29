import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/piston": {
        target: "http://localhost:2000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/piston/, ""),
      },
      // Matches /groq, /api, /room, /terminal, and /yjs in one block
      "^/(groq|api|room|terminal|yjs)": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/(groq|api)/, ""), // Only rewrite prefixes that need it
      },
      '/container': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Do NOT use rewrite if your FastAPI route is @app.post("/container/...")
      },
    },
    host: "0.0.0.0",
    port: 5173,
  },
});
