// Note: execAsync is not used in this service anymore since we're parsing diff content

export interface PackageUpdate {
  name: string;
  currentVersion: string;
  targetVersion: string;
  type: "dependencies" | "devDependencies" | "peerDependencies";
  selected: boolean;
}

export interface PackageUpdateResult {
  success: boolean;
  updatedPackages: PackageUpdate[];
  error?: string;
}

export class PackageUpdaterService {
  /**
   * Analyze package.json and compare with target React Native version using diff
   */
  static async analyzePackageUpdates(
    projectPath: string,
    targetRNVersion: string,
    diffContent?: string | any
  ): Promise<PackageUpdate[]> {
    try {
      // Read current package.json
      const packageJsonPath = `${projectPath}/package.json`;
      const packageJsonContent = await window.App.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageJsonContent);

      const updates: PackageUpdate[] = [];

      if (!diffContent) {
        // If no diff provided, return empty array
        return updates;
      }

      // Handle diff object format (from version selector)
      let actualDiffContent: string;
      if (
        typeof diffContent === "object" &&
        diffContent.files &&
        diffContent.files.length > 0
      ) {
        // Extract the actual diff content from the files array
        actualDiffContent =
          diffContent.files[0].content || diffContent.files[0].diff || "";
      } else if (typeof diffContent === "string") {
        actualDiffContent = diffContent;
      } else {
        console.warn("Invalid diff content format:", diffContent);
        return updates;
      }

      // Parse diff content to extract package changes
      const packageChanges = this.parseDiffForPackageChanges(actualDiffContent);

      // Check dependencies
      if (packageJson.dependencies) {
        for (const change of packageChanges) {
          if (packageJson.dependencies[change.packageName]) {
            const currentVersion = packageJson.dependencies[
              change.packageName
            ].replace(/[\^~]/, "");
            if (currentVersion !== change.targetVersion) {
              updates.push({
                name: change.packageName,
                currentVersion,
                targetVersion: change.targetVersion,
                type: "dependencies",
                selected: true, // Auto-select by default
              });
            }
          }
        }
      }

      // Check devDependencies
      if (packageJson.devDependencies) {
        for (const change of packageChanges) {
          if (packageJson.devDependencies[change.packageName]) {
            const currentVersion = packageJson.devDependencies[
              change.packageName
            ].replace(/[\^~]/, "");
            if (currentVersion !== change.targetVersion) {
              updates.push({
                name: change.packageName,
                currentVersion,
                targetVersion: change.targetVersion,
                type: "devDependencies",
                selected: true, // Auto-select by default
              });
            }
          }
        }
      }

      return updates;
    } catch (error) {
      console.error("Error analyzing package updates:", error);
      throw new Error("Failed to analyze package updates");
    }
  }

  /**
   * Apply selected package updates to package.json
   */
  static async applyPackageUpdates(
    projectPath: string,
    updates: PackageUpdate[]
  ): Promise<PackageUpdateResult> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;

      // Create backup
      await this.createBackup(projectPath);

      // Read current package.json
      // Check if we're in renderer process (window available) or main process
      let packageJsonContent: string;
      if (typeof window !== "undefined" && window.App) {
        // Renderer process
        packageJsonContent = await window.App.readFile(packageJsonPath);
      } else {
        // Main process - use Node.js fs directly
        const { readFile } = await import("fs/promises");
        packageJsonContent = await readFile(packageJsonPath, "utf-8");
      }
      const packageJson = JSON.parse(packageJsonContent);

      const updatedPackages: PackageUpdate[] = [];

      // Apply updates
      for (const update of updates) {
        if (!update.selected) continue;

        const versionPrefix = this.getVersionPrefix(
          packageJson[update.type]?.[update.name]
        );
        const newVersion = `${versionPrefix}${update.targetVersion}`;

        if (!packageJson[update.type]) {
          packageJson[update.type] = {};
        }

        packageJson[update.type][update.name] = newVersion;
        updatedPackages.push(update);
      }

      // Write updated package.json
      const updatedContent = JSON.stringify(packageJson, null, 2);
      if (typeof window !== "undefined" && window.App) {
        // Renderer process
        await window.App.writeFile(packageJsonPath, updatedContent);
      } else {
        // Main process - use Node.js fs directly
        const { writeFile } = await import("fs/promises");
        await writeFile(packageJsonPath, updatedContent, "utf-8");
      }

      return {
        success: true,
        updatedPackages,
      };
    } catch (error) {
      console.error("Error applying package updates:", error);
      return {
        success: false,
        updatedPackages: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse diff content to extract package changes
   */
  private static parseDiffForPackageChanges(diffContent: string): Array<{
    packageName: string;
    targetVersion: string;
  }> {
    const packageChanges: Array<{
      packageName: string;
      targetVersion: string;
    }> = [];

    // Check if diffContent is a valid string
    if (!diffContent || typeof diffContent !== "string") {
      console.warn("Invalid diff content provided:", diffContent);
      return packageChanges;
    }

    // Split diff into lines
    const lines = diffContent.split("\n");

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;

      // Look for lines that start with + or - (diff markers)
      if (!line.startsWith("+") && !line.startsWith("-")) continue;

      // Look for lines that show package version changes
      // Format: +    "package-name": "x.x.x",
      // Format: -    "package-name": "x.x.x",
      // Handle both indented and non-indented lines, with optional trailing comma
      const addMatch = line.match(/^\+\s+"([^"]+)":\s*"([^"]+)"(?:,)?\s*$/);
      const removeMatch = line.match(/^-\s+"([^"]+)":\s*"([^"]+)"(?:,)?\s*$/);

      if (addMatch) {
        const [, packageName, version] = addMatch;
        const cleanVersion = version.replace(/[\^~]/, "");

        // Check if this is a React Native ecosystem package
        if (this.isReactNativeEcosystemPackage(packageName)) {
          packageChanges.push({
            packageName,
            targetVersion: cleanVersion,
          });
        }
      }
    }

    return packageChanges;
  }

  /**
   * Check if a package is part of the React Native ecosystem
   */
  private static isReactNativeEcosystemPackage(packageName: string): boolean {
    const rnEcosystemPatterns = [
      /^react-native$/,
      /^@react-native/,
      /^metro/,
      /^hermes/,
      /^@react-native-community/,
      /^react$/,
      /^@babel/,
      /^@types\/react/,
      /^@types\/react-native/,
    ];

    return rnEcosystemPatterns.some((pattern) => pattern.test(packageName));
  }

  /**
   * Create backup of package.json
   */
  private static async createBackup(projectPath: string): Promise<void> {
    const packageJsonPath = `${projectPath}/package.json`;
    const backupPath = `${projectPath}/package.json.backup.${Date.now()}`;

    let content: string;
    if (typeof window !== "undefined" && window.App) {
      // Renderer process
      content = await window.App.readFile(packageJsonPath);
      await window.App.writeFile(backupPath, content);
    } else {
      // Main process - use Node.js fs directly
      const { readFile, writeFile } = await import("fs/promises");
      content = await readFile(packageJsonPath, "utf-8");
      await writeFile(backupPath, content, "utf-8");
    }
  }

  /**
   * Get version prefix (^, ~, or none)
   */
  private static getVersionPrefix(versionString?: string): string {
    if (!versionString) return "^";
    if (versionString.startsWith("^")) return "^";
    if (versionString.startsWith("~")) return "~";
    return "^";
  }
}
