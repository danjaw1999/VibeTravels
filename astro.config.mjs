import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
  server: { port: 3000 },
  experimental: {
    session: true,
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/compile",
    },
  },
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      PUBLIC_SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      PUBLIC_SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
        "@components": "/src/components",
        "@layouts": "/src/layouts",
        "@lib": "/src/lib",
        "@assets": "/src/assets",
        "@db": "/src/db",
        ...(import.meta.env.PROD ? { "react-dom/server": "react-dom/server.edge" } : {}),
      },
    },
  },
});
