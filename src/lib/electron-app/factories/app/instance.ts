import { app } from "electron";

export function makeAppWithSingleInstanceLock(
  callback: () => Promise<void>,
  MainWindowClass?: any
) {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      // Someone tried to run a second instance, we should focus our window instead.
      // You can also call app.focus() on Windows
      if (MainWindowClass) {
        const mainWindow = MainWindowClass.getInstance();
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    });

    callback();
  }
}
