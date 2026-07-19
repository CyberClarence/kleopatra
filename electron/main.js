const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

/**
 * Kleopatra desktop app.
 *
 * Dev:  `bun run electron:dev` — loads the Next.js dev server (localhost:3000).
 * Prod: the packaged app ships the Next.js standalone build in
 *       Resources/app-server and runs it on a random localhost port using
 *       Electron's own binary in Node mode (no system Node required).
 */

const isDev = !app.isPackaged;
let serverProcess = null;
let mainWindow = null;

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

const waitForServer = (url, timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      fetch(url)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - started > timeoutMs) {
            reject(new Error(`Server did not start within ${timeoutMs}ms`));
          } else {
            setTimeout(tick, 250);
          }
        });
    };
    tick();
  });

async function startProductionServer() {
  const serverDir = path.join(process.resourcesPath, "app-server");
  const port = await getFreePort();

  serverProcess = spawn(process.execPath, [path.join(serverDir, "server.js")], {
    cwd: serverDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      SYNC_DATA_DIR: app.getPath("userData"),
    },
    stdio: "ignore",
  });
  serverProcess.on("exit", (code) => {
    if (code !== null && code !== 0 && !app.isQuitting) {
      console.error(`Next.js server exited with code ${code}`);
    }
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(url);
  return url;
}

async function createWindow() {
  const url = isDev
    ? process.env.ELECTRON_START_URL || "http://localhost:3000"
    : await startProductionServer();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: "Kleopatra",
    backgroundColor: "#1c2128",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links (GitHub, Discord…) in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, target) => {
    if (!target.startsWith("http://localhost") && !target.startsWith("http://127.0.0.1")) {
      event.preventDefault();
      shell.openExternal(target);
    }
  });

  await mainWindow.loadURL(url);
  console.log("[electron] loaded", url);
}

app.whenReady().then(() => {
  createWindow().catch((err) => {
    console.error("[electron] failed to start:", err);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (serverProcess) serverProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
