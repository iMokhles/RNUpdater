import {
  DiffService,
  type DiffFile,
  type ReactNativeDiff,
} from "./diff-service";
import {
  PackageUpdaterService,
  type PackageUpdate,
} from "./package-updater-service";

export interface ComplexChange {
  id: string;
  type:
    | "configuration"
    | "source_code"
    | "native_code"
    | "gradle"
    | "binary"
    | "breaking";
  filePath: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  requiresMigration: boolean;
  migrationScript?: string;
  breakingChanges?: string[];
  dependencies?: string[];
}

export interface MajorVersionUpdatePlan {
  fromVersion: string;
  toVersion: string;
  complexChanges: ComplexChange[];
  packageUpdates: PackageUpdate[];
  migrationSteps: MigrationStep[];
  estimatedRisk: "low" | "medium" | "high";
  requiresManualReview: boolean;
  breakingChangesCount: number;
}

export interface MigrationStep {
  id: string;
  description: string;
  type: "automatic" | "semi_automatic" | "manual";
  filePath?: string;
  script?: string;
  dependencies: string[];
  order: number;
}

export class MajorVersionUpdater {
  /**
   * Analyze a major version update and create a comprehensive update plan
   */
  static async analyzeMajorVersionUpdate(
    projectPath: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MajorVersionUpdatePlan> {
    try {
      // Fetch the diff for the version update
      const diff = await DiffService.fetchDiff(fromVersion, toVersion);

      // Get the raw diff text for package analysis
      const rawDiffText = await this.getRawDiffText(fromVersion, toVersion);

      // If raw diff text is empty or too short, try to reconstruct from parsed diff
      let diffContent = rawDiffText;
      if (!diffContent || diffContent.length < 500) {
        console.log(
          "Raw diff text is too short, reconstructing from parsed diff..."
        );
        diffContent = this.reconstructDiffFromParsed(diff);
      }

      // Analyze package updates
      const packageUpdates = await PackageUpdaterService.analyzePackageUpdates(
        projectPath,
        toVersion,
        diffContent
      );

      // Analyze complex changes
      const complexChanges = this.analyzeComplexChanges(
        diff,
        fromVersion,
        toVersion
      );

      // Create migration steps
      const migrationSteps = this.createMigrationSteps(
        complexChanges,
        packageUpdates
      );

      // Calculate risk assessment
      const estimatedRisk = this.calculateRisk(complexChanges, packageUpdates);
      const breakingChangesCount = complexChanges.filter(
        (c) => c.type === "breaking"
      ).length;
      const requiresManualReview = complexChanges.some(
        (c) => c.severity === "critical" || c.requiresMigration
      );

      return {
        fromVersion,
        toVersion,
        complexChanges,
        packageUpdates,
        migrationSteps,
        estimatedRisk,
        requiresManualReview,
        breakingChangesCount,
      };
    } catch (error) {
      console.error("Error analyzing major version update:", error);
      throw new Error(
        `Failed to analyze major version update from ${fromVersion} to ${toVersion}`
      );
    }
  }

  /**
   * Analyze complex changes from diff files
   */
  private static analyzeComplexChanges(
    diff: ReactNativeDiff,
    fromVersion: string,
    toVersion: string
  ): ComplexChange[] {
    const changes: ComplexChange[] = [];

    for (const file of diff.files) {
      const change = this.analyzeFileChange(file, fromVersion, toVersion);
      if (change) {
        changes.push(change);
      }
    }

    return changes;
  }

  /**
   * Analyze individual file changes
   */
  private static analyzeFileChange(
    file: DiffFile,
    fromVersion: string,
    toVersion: string
  ): ComplexChange | null {
    const filePath = file.path;
    const fileName = filePath.split("/").pop() || "";

    // Configuration files
    if (this.isConfigurationFile(filePath)) {
      return this.analyzeConfigurationChange(file, fromVersion, toVersion);
    }

    // Source code files
    if (this.isSourceCodeFile(filePath)) {
      return this.analyzeSourceCodeChange(file, fromVersion, toVersion);
    }

    // Native code files
    if (this.isNativeCodeFile(filePath)) {
      return this.analyzeNativeCodeChange(file, fromVersion, toVersion);
    }

    // Gradle files
    if (this.isGradleFile(filePath)) {
      return this.analyzeGradleChange(file, fromVersion, toVersion);
    }

    // Binary files
    if (file.isBinary) {
      return this.analyzeBinaryChange(file, fromVersion, toVersion);
    }

    return null;
  }

  /**
   * Check if file is a configuration file
   */
  private static isConfigurationFile(filePath: string): boolean {
    const configExtensions = [
      ".json",
      ".js",
      ".ts",
      ".yaml",
      ".yml",
      ".toml",
      ".ini",
    ];
    const configFiles = [
      "tsconfig.json",
      ".prettierrc.js",
      "metro.config.js",
      "babel.config.js",
      "jest.config.js",
      "eslint.config.js",
      ".eslintrc.js",
      ".eslintrc.json",
      "react-native.config.js",
    ];

    const fileName = filePath.split("/").pop() || "";
    return (
      configFiles.includes(fileName) ||
      configExtensions.some((ext) => filePath.endsWith(ext))
    );
  }

  /**
   * Check if file is source code
   */
  private static isSourceCodeFile(filePath: string): boolean {
    const sourceExtensions = [".tsx", ".ts", ".jsx", ".js"];
    return (
      sourceExtensions.some((ext) => filePath.endsWith(ext)) &&
      !this.isConfigurationFile(filePath) &&
      !this.isNativeCodeFile(filePath)
    );
  }

  /**
   * Check if file is native code
   */
  private static isNativeCodeFile(filePath: string): boolean {
    const nativeExtensions = [
      ".kt",
      ".java",
      ".swift",
      ".m",
      ".mm",
      ".h",
      ".cpp",
      ".c",
    ];
    const nativePaths = [
      "android/",
      "ios/",
      "src/main/java/",
      "src/main/kotlin/",
    ];

    // Exclude gradle-wrapper.jar and other gradle files
    if (this.isGradleFile(filePath)) {
      return false;
    }

    return (
      nativeExtensions.some((ext) => filePath.endsWith(ext)) ||
      nativePaths.some((path) => filePath.includes(path))
    );
  }

  /**
   * Check if file is Gradle related
   */
  private static isGradleFile(filePath: string): boolean {
    const gradleFiles = [
      "build.gradle",
      "gradle.properties",
      "gradle-wrapper.properties",
      "gradle-wrapper.jar",
      "gradlew",
      "gradlew.bat",
      "settings.gradle",
    ];

    const fileName = filePath.split("/").pop() || "";
    return (
      gradleFiles.includes(fileName) ||
      filePath.includes("gradle/") ||
      filePath.endsWith(".gradle") ||
      filePath.endsWith(".jar")
    );
  }

  /**
   * Analyze configuration file changes
   */
  private static analyzeConfigurationChange(
    file: DiffFile,
    fromVersion: string,
    toVersion: string
  ): ComplexChange {
    const fileName = file.path.split("/").pop() || "";
    let description = `Configuration file ${fileName} updated`;
    let severity: "low" | "medium" | "high" | "critical" = "low";
    let requiresMigration = false;
    let breakingChanges: string[] = [];

    // Analyze specific configuration changes
    if (fileName === "tsconfig.json") {
      const content = file.content;
      if (content.includes('"extends": "@react-native/typescript-config"')) {
        description =
          "TypeScript configuration updated to use new config format";
        severity = "medium";
        requiresMigration = true;
      }
    }

    if (fileName === ".prettierrc.js") {
      const content = file.content;
      if (
        content.includes("bracketSameLine") ||
        content.includes("bracketSpacing")
      ) {
        description = "Prettier configuration updated with new/removed options";
        severity = "low";
        breakingChanges.push("Prettier formatting behavior may change");
      }
    }

    return {
      id: `config_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      type: "configuration",
      filePath: file.path,
      description,
      severity,
      requiresMigration,
      breakingChanges: breakingChanges.length > 0 ? breakingChanges : undefined,
    };
  }

  /**
   * Analyze source code changes
   */
  private static analyzeSourceCodeChange(
    file: DiffFile,
    fromVersion: string,
    toVersion: string
  ): ComplexChange {
    const fileName = file.path.split("/").pop() || "";
    let description = `Source file ${fileName} updated`;
    let severity: "low" | "medium" | "high" | "critical" = "medium";
    let requiresMigration = true;
    let breakingChanges: string[] = [];

    // Analyze App.tsx changes
    if (fileName === "App.tsx") {
      const content = file.content;
      if (content.includes("@react-native/new-app-screen")) {
        description =
          "App.tsx completely restructured to use new app screen template";
        severity = "high";
        breakingChanges.push("App.tsx structure completely changed");
        breakingChanges.push("Custom app content needs to be migrated");
      }
    }

    return {
      id: `source_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      type: "source_code",
      filePath: file.path,
      description,
      severity,
      requiresMigration,
      breakingChanges: breakingChanges.length > 0 ? breakingChanges : undefined,
    };
  }

  /**
   * Analyze native code changes
   */
  private static analyzeNativeCodeChange(
    file: DiffFile,
    fromVersion: string,
    toVersion: string
  ): ComplexChange {
    const fileName = file.path.split("/").pop() || "";
    let description = `Native code file ${fileName} updated`;
    let severity: "low" | "medium" | "high" | "critical" = "high";
    let requiresMigration = true;
    let breakingChanges: string[] = [];

    // Analyze MainApplication.kt changes
    if (fileName === "MainApplication.kt") {
      const content = file.content;
      if (content.includes("loadReactNative(this)")) {
        description =
          "MainApplication.kt updated with new React Native initialization";
        severity = "critical";
        breakingChanges.push("Native initialization code changed");
        breakingChanges.push("Custom native modules may need updates");
      }
    }

    return {
      id: `native_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      type: "native_code",
      filePath: file.path,
      description,
      severity,
      requiresMigration,
      breakingChanges: breakingChanges.length > 0 ? breakingChanges : undefined,
    };
  }

  /**
   * Analyze Gradle changes
   */
  private static analyzeGradleChange(
    file: DiffFile,
    fromVersion: string,
    toVersion: string
  ): ComplexChange {
    const fileName = file.path.split("/").pop() || "";
    let description = `Gradle file ${fileName} updated`;
    let severity: "low" | "medium" | "high" | "critical" = "medium";
    let requiresMigration = true;
    let breakingChanges: string[] = [];

    if (fileName === "build.gradle") {
      const content = file.content;
      if (content.includes("kotlinVersion")) {
        description = "Kotlin version updated in build.gradle";
        severity = "high";
        breakingChanges.push("Kotlin version compatibility may affect build");
      }
    }

    if (fileName === "gradle-wrapper.properties") {
      const content = file.content;
      if (content.includes("gradle-8.14.1")) {
        description = "Gradle wrapper version updated";
        severity = "medium";
        breakingChanges.push("Gradle version compatibility may affect build");
      }
    }

    return {
      id: `gradle_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      type: "gradle",
      filePath: file.path,
      description,
      severity,
      requiresMigration,
      breakingChanges: breakingChanges.length > 0 ? breakingChanges : undefined,
    };
  }

  /**
   * Analyze binary file changes
   */
  private static analyzeBinaryChange(
    file: DiffFile,
    fromVersion: string,
    toVersion: string
  ): ComplexChange {
    const fileName = file.path.split("/").pop() || "";
    let description = `Binary file ${fileName} updated`;
    let severity: "low" | "medium" | "high" | "critical" = "high";
    let requiresMigration = true;

    if (fileName === "gradle-wrapper.jar") {
      description = "Gradle wrapper JAR updated";
      severity = "medium";
    }

    return {
      id: `binary_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
      type: "binary",
      filePath: file.path,
      description,
      severity,
      requiresMigration,
    };
  }

  /**
   * Create migration steps based on changes
   */
  private static createMigrationSteps(
    complexChanges: ComplexChange[],
    packageUpdates: PackageUpdate[]
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];
    let order = 1;

    // Step 1: Package updates
    if (packageUpdates.length > 0) {
      steps.push({
        id: "package_updates",
        description: "Update package.json dependencies",
        type: "automatic",
        dependencies: packageUpdates.map((p) => p.name),
        order: order++,
      });
    }

    // Step 2: Configuration files
    const configChanges = complexChanges.filter(
      (c) => c.type === "configuration"
    );
    for (const change of configChanges) {
      steps.push({
        id: `config_${change.id}`,
        description: change.description,
        type: change.requiresMigration ? "semi_automatic" : "automatic",
        filePath: change.filePath,
        dependencies: change.dependencies || [],
        order: order++,
      });
    }

    // Step 3: Gradle files
    const gradleChanges = complexChanges.filter((c) => c.type === "gradle");
    for (const change of gradleChanges) {
      steps.push({
        id: `gradle_${change.id}`,
        description: change.description,
        type: "semi_automatic",
        filePath: change.filePath,
        dependencies: change.dependencies || [],
        order: order++,
      });
    }

    // Step 4: Native code
    const nativeChanges = complexChanges.filter(
      (c) => c.type === "native_code"
    );
    for (const change of nativeChanges) {
      steps.push({
        id: `native_${change.id}`,
        description: change.description,
        type: "manual",
        filePath: change.filePath,
        dependencies: change.dependencies || [],
        order: order++,
      });
    }

    // Step 5: Source code
    const sourceChanges = complexChanges.filter(
      (c) => c.type === "source_code"
    );
    for (const change of sourceChanges) {
      steps.push({
        id: `source_${change.id}`,
        description: change.description,
        type: "manual",
        filePath: change.filePath,
        dependencies: change.dependencies || [],
        order: order++,
      });
    }

    // Step 6: Binary files
    const binaryChanges = complexChanges.filter((c) => c.type === "binary");
    for (const change of binaryChanges) {
      steps.push({
        id: `binary_${change.id}`,
        description: change.description,
        type: "automatic",
        filePath: change.filePath,
        dependencies: change.dependencies || [],
        order: order++,
      });
    }

    return steps;
  }

  /**
   * Calculate risk assessment
   */
  private static calculateRisk(
    complexChanges: ComplexChange[],
    packageUpdates: PackageUpdate[]
  ): "low" | "medium" | "high" {
    const criticalChanges = complexChanges.filter(
      (c) => c.severity === "critical"
    ).length;
    const highChanges = complexChanges.filter(
      (c) => c.severity === "high"
    ).length;
    const breakingChanges = complexChanges.filter(
      (c) => c.type === "breaking"
    ).length;
    const nativeChanges = complexChanges.filter(
      (c) => c.type === "native_code"
    ).length;

    if (criticalChanges > 0 || breakingChanges > 2 || nativeChanges > 1) {
      return "high";
    }

    if (highChanges > 1 || breakingChanges > 0 || nativeChanges > 0) {
      return "medium";
    }

    return "low";
  }

  /**
   * Apply major version update with migration support
   */
  static async applyMajorVersionUpdate(
    projectPath: string,
    updatePlan: MajorVersionUpdatePlan
  ): Promise<{ success: boolean; appliedSteps: string[]; errors: string[] }> {
    const appliedSteps: string[] = [];
    const errors: string[] = [];

    try {
      // Apply package updates first
      if (updatePlan.packageUpdates.length > 0) {
        const packageResult = await PackageUpdaterService.applyPackageUpdates(
          projectPath,
          updatePlan.packageUpdates
        );

        if (packageResult.success) {
          appliedSteps.push("package_updates");
        } else {
          errors.push(`Package updates failed: ${packageResult.error}`);
        }
      }

      // Apply other changes based on migration steps
      for (const step of updatePlan.migrationSteps) {
        try {
          await this.applyMigrationStep(projectPath, step);
          appliedSteps.push(step.id);
        } catch (error) {
          const errorMsg = `Failed to apply step ${step.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          errors.push(errorMsg);

          // For critical steps, stop execution
          if (step.type === "manual" && step.description.includes("critical")) {
            break;
          }
        }
      }

      return {
        success: errors.length === 0,
        appliedSteps,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        appliedSteps,
        errors: [
          ...errors,
          error instanceof Error ? error.message : "Unknown error",
        ],
      };
    }
  }

  /**
   * Get raw diff text for package analysis
   */
  private static async getRawDiffText(
    fromVersion: string,
    toVersion: string
  ): Promise<string> {
    try {
      // Use the same URL format as DiffService
      const diffUrl = `https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs/${fromVersion}..${toVersion}.diff`;
      console.log(`Fetching raw diff text from: ${diffUrl}`);

      const response = await fetch(diffUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch diff: ${response.status} ${response.statusText}`
        );
      }

      const content = await response.text();
      console.log(
        `Successfully fetched raw diff text. Length: ${content.length}`
      );

      return content;
    } catch (error) {
      console.error("Error fetching raw diff text:", error);
      return "";
    }
  }

  /**
   * Reconstruct diff text from parsed diff for package analysis
   */
  private static reconstructDiffFromParsed(diff: any): string {
    try {
      console.log("Reconstructing diff from parsed data...");

      if (!diff.files || diff.files.length === 0) {
        console.log("No files in parsed diff");
        return "";
      }

      // Look for package.json file in the diff
      const packageJsonFile = diff.files.find(
        (file: any) =>
          file.path === "package.json" || file.path.endsWith("/package.json")
      );

      if (packageJsonFile && packageJsonFile.content) {
        console.log("Found package.json in parsed diff, using its content");
        return packageJsonFile.content;
      }

      // If no package.json found, concatenate all file contents
      const allContent = diff.files
        .map((file: any) => file.content || "")
        .filter((content: string) => content.length > 0)
        .join("\n");

      console.log(
        `Reconstructed diff from ${diff.files.length} files, total length: ${allContent.length}`
      );
      return allContent;
    } catch (error) {
      console.error("Error reconstructing diff from parsed data:", error);
      return "";
    }
  }

  /**
   * Apply individual migration step
   */
  private static async applyMigrationStep(
    projectPath: string,
    step: MigrationStep
  ): Promise<void> {
    // This would be implemented based on the specific step type
    // For now, we'll just log the step
    console.log(`Applying migration step: ${step.description}`);

    // TODO: Implement actual file modifications based on step type
    // This would involve:
    // - Reading current file content
    // - Applying transformations
    // - Writing updated content
    // - Creating backups
  }
}
