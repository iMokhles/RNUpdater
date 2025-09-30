import { ipcMain, dialog, app } from "electron";
import { readFileSync } from "fs";
import { join } from "path";
import { IPC_CHANNELS } from "shared/constants";
import packageJSON from "../../../package.json";
import { GitService } from "../../renderer/lib/services/git-service";

export function registerAppHandlers() {
  // Get app version
  ipcMain.handle(IPC_CHANNELS.GET_VERSION, () => {
    return packageJSON.version || app.getVersion();
  });

  // Get platform
  ipcMain.handle(IPC_CHANNELS.GET_PLATFORM, () => {
    return process.platform;
  });

  // Select project folder
  ipcMain.handle(IPC_CHANNELS.SELECT_PROJECT_FOLDER, async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Select React Native Project Folder",
        message: "Please select the root folder of your React Native project",
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error("Error selecting project folder:", error);
      throw error;
    }
  });

  // Read package.json from project
  ipcMain.handle(
    IPC_CHANNELS.READ_PACKAGE_JSON,
    async (_, projectPath: string) => {
      try {
        const packageJsonPath = join(projectPath, "package.json");
        const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
        return JSON.parse(packageJsonContent);
      } catch (error) {
        console.error("Error reading package.json:", error);
        throw new Error("Failed to read package.json file");
      }
    }
  );

  // Fetch React Native releases
  ipcMain.handle(IPC_CHANNELS.FETCH_RN_RELEASES, async () => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/react-native-community/rn-diff-purge/master/RELEASES"
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`);
      }
      const releasesText = await response.text();
      return releasesText.trim().split(/\s+/);
    } catch (error) {
      console.error("Error fetching React Native releases:", error);
      throw new Error("Failed to fetch React Native releases");
    }
  });

  // Get git information for a project
  ipcMain.handle(IPC_CHANNELS.GET_GIT_INFO, async (_, projectPath: string) => {
    try {
      return await GitService.getGitInfo(projectPath);
    } catch (error) {
      console.error("Error getting git info:", error);
      throw new Error("Failed to get git information");
    }
  });

  // Get git status for a project
  ipcMain.handle(
    IPC_CHANNELS.GET_GIT_STATUS,
    async (_, projectPath: string) => {
      try {
        return await GitService.getGitStatus(projectPath);
      } catch (error) {
        console.error("Error getting git status:", error);
        throw new Error("Failed to get git status");
      }
    }
  );

  // Get recent commits for a project
  ipcMain.handle(
    IPC_CHANNELS.GET_RECENT_COMMITS,
    async (_, projectPath: string, count: number = 5) => {
      try {
        return await GitService.getRecentCommits(projectPath, count);
      } catch (error) {
        console.error("Error getting recent commits:", error);
        throw new Error("Failed to get recent commits");
      }
    }
  );

  // Add more IPC handlers as needed for your RNUpdater app
}
