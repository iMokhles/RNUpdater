import { BrowserWindow } from "electron";
import { settings } from "lib/electron-router-dom";
import { join } from "node:path";

export class MainWindow {
  private static instance: BrowserWindow | null = null;

  static create(): BrowserWindow {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: "hiddenInset",
      webPreferences: {
        preload: settings.isDev
          ? join(__dirname, "../../../node_modules/.dev/preload/index.js")
          : join(__dirname, "../../../preload/index.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load the app
    if (settings.isDev) {
      this.instance.loadURL(`http://localhost:${settings.port}`);
      this.instance.webContents.openDevTools();
    } else {
      this.instance.loadFile("./renderer/index.html");
    }

    // Show window when ready
    this.instance.once("ready-to-show", () => {
      this.instance?.show();
    });

    // Handle window closed
    this.instance.on("closed", () => {
      this.instance = null;
    });

    return this.instance;
  }

  static getInstance(): BrowserWindow | null {
    return this.instance;
  }
}
