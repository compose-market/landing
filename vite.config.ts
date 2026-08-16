import { fileURLToPath } from "node:url";
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
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("index.html", import.meta.url)),
        manowar: fileURLToPath(new URL("manowar/index.html", import.meta.url)),
        terms: fileURLToPath(new URL("terms/index.html", import.meta.url)),
        privacy: fileURLToPath(new URL("privacy/index.html", import.meta.url))
      }
    }
  }
});
