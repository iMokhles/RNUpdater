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

export interface MajorVersionUpdateResult {
  success: boolean;
  packageUpdates: PackageUpdate[];
  complexChanges: Array<{
    type: string;
    filePath: string;
    description: string;
    severity: string;
  }>;
  migrationSteps: Array<{
    description: string;
    type: string;
    order: number;
  }>;
  estimatedRisk: string;
  requiresManualReview: boolean;
  breakingChangesCount: number;
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

    console.log("Parsing diff content for package changes...");
    console.log("Diff content length:", diffContent.length);
    console.log("First 500 characters:", diffContent.substring(0, 500));

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

        console.log(`Found package change: ${packageName} -> ${cleanVersion}`);

        // Check if this is a React Native ecosystem package
        if (this.isReactNativeEcosystemPackage(packageName)) {
          console.log(`Adding React Native ecosystem package: ${packageName}`);
          packageChanges.push({
            packageName,
            targetVersion: cleanVersion,
          });
        } else {
          console.log(`Skipping non-RN ecosystem package: ${packageName}`);
        }
      }
    }

    console.log(`Total package changes found: ${packageChanges.length}`);
    console.log("Package changes:", packageChanges);

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

  /**
   * Analyze major version update with complex change detection
   */
  static async analyzeMajorVersionUpdate(
    projectPath: string,
    fromVersion: string,
    toVersion: string,
    diffContent?: string
  ): Promise<MajorVersionUpdateResult> {
    try {
      // Import the major version updater
      const { MajorVersionUpdater } = await import("./major-version-updater");

      // Analyze the major version update
      const updatePlan = await MajorVersionUpdater.analyzeMajorVersionUpdate(
        projectPath,
        fromVersion,
        toVersion
      );

      return {
        success: true,
        packageUpdates: updatePlan.packageUpdates,
        complexChanges: updatePlan.complexChanges.map((change) => ({
          type: change.type,
          filePath: change.filePath,
          description: change.description,
          severity: change.severity,
        })),
        migrationSteps: updatePlan.migrationSteps.map((step) => ({
          description: step.description,
          type: step.type,
          order: step.order,
        })),
        estimatedRisk: updatePlan.estimatedRisk,
        requiresManualReview: updatePlan.requiresManualReview,
        breakingChangesCount: updatePlan.breakingChangesCount,
      };
    } catch (error) {
      console.error("Error analyzing major version update:", error);
      return {
        success: false,
        packageUpdates: [],
        complexChanges: [],
        migrationSteps: [],
        estimatedRisk: "high",
        requiresManualReview: true,
        breakingChangesCount: 0,
      };
    }
  }

  /**
   * Apply major version update with migration support
   */
  static async applyMajorVersionUpdate(
    projectPath: string,
    fromVersion: string,
    toVersion: string
  ): Promise<{ success: boolean; appliedSteps: string[]; errors: string[] }> {
    try {
      // Import the major version updater
      const { MajorVersionUpdater } = await import("./major-version-updater");

      // Analyze the update plan
      const updatePlan = await MajorVersionUpdater.analyzeMajorVersionUpdate(
        projectPath,
        fromVersion,
        toVersion
      );

      // Apply the major version update
      const result = await MajorVersionUpdater.applyMajorVersionUpdate(
        projectPath,
        updatePlan
      );

      return result;
    } catch (error) {
      console.error("Error applying major version update:", error);
      return {
        success: false,
        appliedSteps: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }
}
