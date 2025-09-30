import { app } from "electron";

import { makeAppWithSingleInstanceLock } from "lib/electron-app/factories/app/instance";
import { makeAppSetup } from "lib/electron-app/factories/app/setup";
import { registerAppHandlers } from "./ipc/app-handlers";
import { MainWindow } from "./windows/main";

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();

  // Register IPC handlers
  registerAppHandlers();

  await makeAppSetup(MainWindow);
}, MainWindow);
