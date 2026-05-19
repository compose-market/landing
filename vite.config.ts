import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: false
  },
  preview: {
    host: "127.0.0.1",
    port: 4178,
    strictPort: false
  }
});
