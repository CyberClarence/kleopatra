#!/usr/bin/env node
/**
 * Dev launcher: reuses a running Next.js dev server on :3000, or starts one,
 * then opens the Electron shell against it.
 */
import { spawn } from "child_process";

const DEV_URL = process.env.ELECTRON_START_URL || "http://localhost:3000";

const isUp = () =>
  fetch(DEV_URL, { method: "HEAD" }).then(
    () => true,
    () => false
  );

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let devServer = null;

if (await isUp()) {
  console.log(`[electron:dev] reusing dev server at ${DEV_URL}`);
} else {
  console.log("[electron:dev] starting next dev…");
  devServer = spawn("bun", ["run", "dev"], { stdio: "inherit" });
  for (let i = 0; i < 120 && !(await isUp()); i++) await wait(500);
  if (!(await isUp())) {
    console.error("[electron:dev] dev server never came up");
    devServer.kill();
    process.exit(1);
  }
}

const electron = spawn("bunx", ["electron", "electron/main.js"], {
  stdio: "inherit",
  env: { ...process.env, ELECTRON_START_URL: DEV_URL },
});

electron.on("exit", (code) => {
  if (devServer) devServer.kill();
  process.exit(code ?? 0);
});
