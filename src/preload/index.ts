import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "shared/constants";

console.log("Preload script loaded successfully");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("App", {
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.GET_VERSION),
  getPlatform: () => ipcRenderer.invoke(IPC_CHANNELS.GET_PLATFORM),
  selectProjectFolder: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SELECT_PROJECT_FOLDER),
  readPackageJson: (projectPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.READ_PACKAGE_JSON, projectPath),
  fetchRNReleases: () => ipcRenderer.invoke(IPC_CHANNELS.FETCH_RN_RELEASES),
  // Add more app-specific APIs here as needed
});
