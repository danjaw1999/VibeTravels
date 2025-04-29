// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),
      E2E_USERNAME: envField.string({ context: "server", access: "secret" }),
      E2E_PASSWORD: envField.string({ context: "server", access: "secret" }),
      E2E_USERNAME_ID: envField.string({ context: "server", access: "secret" }),
      OPENAI_API_KEY: envField.string({ context: "server", access: "secret" }),
      PEXELS_API_KEY: envField.string({ context: "server", access: "secret" }),
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
      },
    },
  },
});
