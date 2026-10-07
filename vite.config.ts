/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app version, shown in the footer.
const { version } = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};

// Run the app with `vercel dev`, which also serves /api.
export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: { include: ["{api,src}/**/*.test.ts"] },
});
