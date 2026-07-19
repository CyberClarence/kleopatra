const { contextBridge } = require("electron");

// Lets the web app detect it's running inside the desktop shell.
contextBridge.exposeInMainWorld("kleopatraDesktop", {
  isDesktop: true,
});
