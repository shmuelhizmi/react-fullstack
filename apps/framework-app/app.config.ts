import { defineConfig } from "@react-fullstack/framework";
import { ironSessionPlugin } from "@react-fullstack/cookie-session";

export default defineConfig({
  allowedRuntimes: ["ssr", "dom", "worker", "server", "server-session"],
  // this could be interpreted from the file name
  entry: "./app",
  outDir: "./dist",
  plugins: [ironSessionPlugin()],
});
