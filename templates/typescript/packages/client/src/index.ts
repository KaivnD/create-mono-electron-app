import { app, BrowserWindow, ipcMain, IpcMainEvent } from "electron";
import * as path from "path";
import * as url from "url";

// Is our app packaged in a binary or still in Electron?
const appIsPackaged = app.isPackaged;

/**
 * Get the path to the `static` folder.
 * This is a temporary hack, waiting for the 2 issues to be fixed.
 *
 * @see https://github.com/electron-userland/electron-webpack/issues/52
 * @see https://github.com/electron-userland/electron-webpack/issues/157
 */
export const staticPath = appIsPackaged
  ? __dirname.replace(/app\.asar$/, "static")
  : path.join(process.cwd(), "static");

const CRA_DEV_URL = "http://localhost:3000";

const isProd = process.env.NODE_ENV === "production";

let mainWindow: BrowserWindow | null;

const createMainWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(staticPath, "preload.js")
    }
  });

  // By default opens file:///path/to/crale-react/build/index.html, unless
  // there's a ENV variable set, which we will use for development.
  mainWindow.loadURL(
    isProd
      ? url.format({
          pathname: path.join(__dirname, "index.html"),
          protocol: "file:",
          slashes: true
        })
      : CRA_DEV_URL
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    if (!isProd) mainWindow?.webContents.openDevTools();
  });
};

// Quit application when all windows are closed
app.on("window-all-closed", () => {
  // On macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it is common to re-create a window even after all windows have been closed
  if (!mainWindow) {
    createMainWindow();
  }
});

// Create main BrowserWindow when electron is ready
app.on("ready", () => {
  createMainWindow();
});

ipcMain.on("close-app", () => {
  app.quit();
});
