import type { RNProject, PackageJsonInfo, GitInfo } from "shared/types";
import { BackupService } from "./backup-service";

export class ProjectService {
  static async selectProjectFolder(): Promise<string | null> {
    try {
      const result = await window.App.selectProjectFolder();
      return result;
    } catch (error) {
      console.error("Error selecting project folder:", error);
      throw new Error("Failed to select project folder");
    }
  }

  static async readPackageJson(projectPath: string): Promise<PackageJsonInfo> {
    try {
      // Always prefer backup if it exists
      const packageJson = await BackupService.readPackageJsonWithBackup(
        projectPath
      );
      return packageJson;
    } catch (error) {
      console.error("Error reading package.json:", error);
      throw new Error("Failed to read package.json");
    }
  }

  static async analyzeProject(projectPath: string): Promise<RNProject> {
    try {
      const packageJson = await this.readPackageJson(projectPath);

      // Extract React Native and React versions
      const reactNativeVersion =
        packageJson.dependencies["react-native"] ||
        packageJson.devDependencies["react-native"] ||
        "unknown";
      const reactVersion =
        packageJson.dependencies["react"] ||
        packageJson.devDependencies["react"] ||
        "unknown";

      // Determine platform support
      const hasIOS =
        packageJson.dependencies["react-native-ios"] !== undefined ||
        packageJson.devDependencies["react-native-ios"] !== undefined;
      const hasAndroid =
        packageJson.dependencies["react-native-android"] !== undefined ||
        packageJson.devDependencies["react-native-android"] !== undefined;

      let platform: "ios" | "android" | "both" = "both";
      if (hasIOS && !hasAndroid) platform = "ios";
      if (hasAndroid && !hasIOS) platform = "android";

      // Get git information
      let gitInfo: GitInfo | undefined;
      try {
        gitInfo = await window.App.getGitInfo(projectPath);
      } catch (error) {
        console.warn("Failed to get git information:", error);
        // Continue without git info
      }

      const project: RNProject = {
        id: `${packageJson.name}-${Date.now()}`,
        name: packageJson.name,
        path: projectPath,
        lastModified: new Date(),
        reactNativeVersion,
        reactVersion,
        platform,
        packageJson,
        gitInfo,
      };

      return project;
    } catch (error) {
      console.error("Error analyzing project:", error);
      throw new Error("Failed to analyze React Native project");
    }
  }

  static isValidReactNativeProject(packageJson: PackageJsonInfo): boolean {
    return !!(
      packageJson.dependencies["react-native"] ||
      packageJson.devDependencies["react-native"]
    );
  }
}
