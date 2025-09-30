import type { RNProject, PackageJsonInfo } from "shared/types";

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
      const packageJson = await window.App.readPackageJson(projectPath);
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

      const project: RNProject = {
        id: `${packageJson.name}-${Date.now()}`,
        name: packageJson.name,
        path: projectPath,
        lastModified: new Date(),
        reactNativeVersion,
        reactVersion,
        platform,
        packageJson,
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

