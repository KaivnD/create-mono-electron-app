const { ipcRenderer, remote } = require("electron");

if (remote) {
  window.ipcRenderer = ipcRenderer;
  window.platform = process.platform;
}
