export interface GradleDependency {
  name: string;
  version: string;
  type:
    | "implementation"
    | "api"
    | "compileOnly"
    | "runtimeOnly"
    | "testImplementation"
    | "androidTestImplementation";
  group?: string;
}

export interface GradlePlugin {
  id: string;
  version?: string;
  apply: boolean;
}

export interface GradleConfiguration {
  compileSdkVersion?: number;
  targetSdkVersion?: number;
  minSdkVersion?: number;
  ndkVersion?: string;
  kotlinVersion?: string;
  buildToolsVersion?: string;
  dependencies: GradleDependency[];
  plugins: GradlePlugin[];
  repositories: string[];
  allprojects: {
    repositories: string[];
  };
}

export interface GradleUpdateResult {
  success: boolean;
  updatedFiles: string[];
  errors: string[];
  warnings: string[];
}

export class GradleUpdater {
  /**
   * Parse build.gradle file content
   */
  static parseBuildGradle(content: string): GradleConfiguration {
    const config: GradleConfiguration = {
      dependencies: [],
      plugins: [],
      repositories: [],
      allprojects: {
        repositories: [],
      },
    };

    const lines = content.split("\n");
    let inDependencies = false;
    let inPlugins = false;
    let inRepositories = false;
    let inAllprojects = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse ext block
      if (line.includes("ext {") || line.includes("ext {")) {
        i = this.parseExtBlock(lines, i, config);
        continue;
      }

      // Parse dependencies block
      if (line === "dependencies {" || line === "dependencies{") {
        inDependencies = true;
        continue;
      }

      if (inDependencies) {
        if (line === "}") {
          inDependencies = false;
          continue;
        }

        const dependency = this.parseDependencyLine(line);
        if (dependency) {
          config.dependencies.push(dependency);
        }
      }

      // Parse plugins block
      if (line === "plugins {" || line === "plugins{") {
        inPlugins = true;
        continue;
      }

      if (inPlugins) {
        if (line === "}") {
          inPlugins = false;
          continue;
        }

        const plugin = this.parsePluginLine(line);
        if (plugin) {
          config.plugins.push(plugin);
        }
      }

      // Parse repositories block
      if (line === "repositories {" || line === "repositories{") {
        inRepositories = true;
        continue;
      }

      if (inRepositories) {
        if (line === "}") {
          inRepositories = false;
          continue;
        }

        const repo = this.parseRepositoryLine(line);
        if (repo) {
          config.repositories.push(repo);
        }
      }

      // Parse allprojects block
      if (line === "allprojects {" || line === "allprojects{") {
        inAllprojects = true;
        continue;
      }

      if (inAllprojects) {
        if (line === "}") {
          inAllprojects = false;
          continue;
        }

        if (line.includes("repositories {")) {
          i = this.parseAllprojectsRepositories(lines, i, config);
        }
      }
    }

    return config;
  }

  /**
   * Parse ext block for version information
   */
  private static parseExtBlock(
    lines: string[],
    startIndex: number,
    config: GradleConfiguration
  ): number {
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "}") {
        return i;
      }

      if (line.includes("compileSdkVersion")) {
        const match = line.match(/compileSdkVersion\s*=\s*(\d+)/);
        if (match) {
          config.compileSdkVersion = parseInt(match[1]);
        }
      }

      if (line.includes("targetSdkVersion")) {
        const match = line.match(/targetSdkVersion\s*=\s*(\d+)/);
        if (match) {
          config.targetSdkVersion = parseInt(match[1]);
        }
      }

      if (line.includes("minSdkVersion")) {
        const match = line.match(/minSdkVersion\s*=\s*(\d+)/);
        if (match) {
          config.minSdkVersion = parseInt(match[1]);
        }
      }

      if (line.includes("ndkVersion")) {
        const match = line.match(/ndkVersion\s*=\s*"([^"]+)"/);
        if (match) {
          config.ndkVersion = match[1];
        }
      }

      if (line.includes("kotlinVersion")) {
        const match = line.match(/kotlinVersion\s*=\s*"([^"]+)"/);
        if (match) {
          config.kotlinVersion = match[1];
        }
      }

      if (line.includes("buildToolsVersion")) {
        const match = line.match(/buildToolsVersion\s*=\s*"([^"]+)"/);
        if (match) {
          config.buildToolsVersion = match[1];
        }
      }
    }

    return startIndex;
  }

  /**
   * Parse dependency line
   */
  private static parseDependencyLine(line: string): GradleDependency | null {
    // Match patterns like: implementation 'group:name:version'
    const match = line.match(/(\w+)\s+['"]([^'"]+)['"]/);
    if (!match) return null;

    const [, type, dependency] = match;
    const parts = dependency.split(":");

    if (parts.length < 2) return null;

    return {
      type: type as GradleDependency["type"],
      group: parts.length > 2 ? parts[0] : undefined,
      name: parts.length > 2 ? parts[1] : parts[0],
      version: parts.length > 2 ? parts[2] : parts[1],
    };
  }

  /**
   * Parse plugin line
   */
  private static parsePluginLine(line: string): GradlePlugin | null {
    // Match patterns like: id 'plugin-id' version 'version'
    const idMatch = line.match(/id\s+['"]([^'"]+)['"]/);
    if (!idMatch) return null;

    const versionMatch = line.match(/version\s+['"]([^'"]+)['"]/);

    return {
      id: idMatch[1],
      version: versionMatch ? versionMatch[1] : undefined,
      apply: !line.includes("apply false"),
    };
  }

  /**
   * Parse repository line
   */
  private static parseRepositoryLine(line: string): string | null {
    const match = line.match(
      /(google|mavenCentral|jcenter|gradlePluginPortal)\(\)/
    );
    return match ? match[1] : null;
  }

  /**
   * Parse allprojects repositories
   */
  private static parseAllprojectsRepositories(
    lines: string[],
    startIndex: number,
    config: GradleConfiguration
  ): number {
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "}") {
        return i;
      }

      const repo = this.parseRepositoryLine(line);
      if (repo) {
        config.allprojects.repositories.push(repo);
      }
    }

    return startIndex;
  }

  /**
   * Update Gradle configuration based on diff
   */
  static async updateGradleConfiguration(
    projectPath: string,
    diffContent: string,
    targetVersion: string
  ): Promise<GradleUpdateResult> {
    const result: GradleUpdateResult = {
      success: true,
      updatedFiles: [],
      errors: [],
      warnings: [],
    };

    try {
      // Parse diff to find Gradle changes
      const gradleChanges = this.parseGradleDiff(diffContent);

      for (const change of gradleChanges) {
        try {
          await this.applyGradleChange(projectPath, change, targetVersion);
          result.updatedFiles.push(change.filePath);
        } catch (error) {
          result.errors.push(
            `Failed to update ${change.filePath}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return result;
  }

  /**
   * Parse Gradle changes from diff
   */
  private static parseGradleDiff(diffContent: string): Array<{
    filePath: string;
    changes: Array<{
      type: "version" | "dependency" | "plugin" | "repository";
      key: string;
      oldValue?: string;
      newValue: string;
    }>;
  }> {
    const changes: Array<{
      filePath: string;
      changes: Array<{
        type: "version" | "dependency" | "plugin" | "repository";
        key: string;
        oldValue?: string;
        newValue: string;
      }>;
    }> = [];

    const lines = diffContent.split("\n");
    let currentFile: string | null = null;
    let fileChanges: Array<{
      type: "version" | "dependency" | "plugin" | "repository";
      key: string;
      oldValue?: string;
      newValue: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // File header
      if (line.startsWith("diff --git")) {
        if (currentFile && fileChanges.length > 0) {
          changes.push({
            filePath: currentFile,
            changes: fileChanges,
          });
        }

        const match = line.match(/diff --git a\/(.+?) b\/(.+?)$/);
        if (match) {
          currentFile = match[2];
          fileChanges = [];
        }
        continue;
      }

      // Skip if not a Gradle file
      if (currentFile && !this.isGradleFile(currentFile)) {
        continue;
      }

      // Parse diff lines
      if (line.startsWith("+") || line.startsWith("-")) {
        const change = this.parseGradleDiffLine(line);
        if (change) {
          fileChanges.push(change);
        }
      }
    }

    // Add last file changes
    if (currentFile && fileChanges.length > 0) {
      changes.push({
        filePath: currentFile,
        changes: fileChanges,
      });
    }

    return changes;
  }

  /**
   * Parse individual Gradle diff line
   */
  private static parseGradleDiffLine(line: string): {
    type: "version" | "dependency" | "plugin" | "repository";
    key: string;
    oldValue?: string;
    newValue: string;
  } | null {
    const isAddition = line.startsWith("+");
    const content = line.substring(1).trim();

    // Version changes
    if (content.includes("Version")) {
      const match = content.match(/(\w+Version)\s*=\s*"([^"]+)"/);
      if (match) {
        return {
          type: "version",
          key: match[1],
          newValue: match[2],
        };
      }
    }

    // Dependency changes
    if (
      content.includes("implementation") ||
      content.includes("api") ||
      content.includes("compileOnly")
    ) {
      const match = content.match(/(\w+)\s+['"]([^'"]+)['"]/);
      if (match) {
        return {
          type: "dependency",
          key: match[2],
          newValue: match[2],
        };
      }
    }

    // Plugin changes
    if (content.includes("id") && content.includes("version")) {
      const idMatch = content.match(/id\s+['"]([^'"]+)['"]/);
      const versionMatch = content.match(/version\s+['"]([^'"]+)['"]/);
      if (idMatch && versionMatch) {
        return {
          type: "plugin",
          key: idMatch[1],
          newValue: versionMatch[1],
        };
      }
    }

    // Repository changes
    if (content.includes("google()") || content.includes("mavenCentral()")) {
      const match = content.match(/(\w+)\(\)/);
      if (match) {
        return {
          type: "repository",
          key: match[1],
          newValue: match[1],
        };
      }
    }

    return null;
  }

  /**
   * Check if file is Gradle related
   */
  private static isGradleFile(filePath: string): boolean {
    const gradleFiles = [
      "build.gradle",
      "gradle.properties",
      "gradle-wrapper.properties",
      "settings.gradle",
    ];

    const fileName = filePath.split("/").pop() || "";
    return (
      gradleFiles.includes(fileName) ||
      filePath.includes("gradle/") ||
      filePath.endsWith(".gradle")
    );
  }

  /**
   * Apply Gradle change to file
   */
  private static async applyGradleChange(
    projectPath: string,
    change: {
      filePath: string;
      changes: Array<{
        type: "version" | "dependency" | "plugin" | "repository";
        key: string;
        oldValue?: string;
        newValue: string;
      }>;
    },
    targetVersion: string
  ): Promise<void> {
    const filePath = `${projectPath}/${change.filePath}`;

    // Read current file content
    let content: string;
    if (typeof window !== "undefined" && window.App) {
      content = await window.App.readFile(filePath);
    } else {
      const { readFile } = await import("fs/promises");
      content = await readFile(filePath, "utf-8");
    }

    // Apply changes
    let updatedContent = content;
    for (const changeItem of change.changes) {
      updatedContent = this.applyGradleChangeToContent(
        updatedContent,
        changeItem
      );
    }

    // Write updated content
    if (typeof window !== "undefined" && window.App) {
      await window.App.writeFile(filePath, updatedContent);
    } else {
      const { writeFile } = await import("fs/promises");
      await writeFile(filePath, updatedContent, "utf-8");
    }
  }

  /**
   * Apply individual Gradle change to content
   */
  private static applyGradleChangeToContent(
    content: string,
    change: {
      type: "version" | "dependency" | "plugin" | "repository";
      key: string;
      oldValue?: string;
      newValue: string;
    }
  ): string {
    const lines = content.split("\n");
    const updatedLines = lines.map((line) => {
      // Version changes
      if (change.type === "version" && line.includes(change.key)) {
        return line.replace(
          new RegExp(`${change.key}\\s*=\\s*"[^"]*"`),
          `${change.key} = "${change.newValue}"`
        );
      }

      // Dependency changes
      if (change.type === "dependency" && line.includes(change.key)) {
        // This would need more sophisticated parsing for dependencies
        return line;
      }

      // Plugin changes
      if (change.type === "plugin" && line.includes(`id '${change.key}'`)) {
        return line.replace(
          /version\s+['"][^'"]*['"]/,
          `version '${change.newValue}'`
        );
      }

      return line;
    });

    return updatedLines.join("\n");
  }

  /**
   * Generate Gradle configuration from template
   */
  static generateGradleConfiguration(
    targetVersion: string,
    platform: "android" | "ios" | "both" = "both"
  ): GradleConfiguration {
    const config: GradleConfiguration = {
      compileSdkVersion: 35,
      targetSdkVersion: 35,
      minSdkVersion: 21,
      ndkVersion: "27.1.12297006",
      kotlinVersion: "2.1.20",
      buildToolsVersion: "35.0.0",
      dependencies: [
        {
          type: "implementation",
          name: "com.facebook.react",
          group: "com.facebook.react",
          version: "react-native",
        },
      ],
      plugins: [
        {
          id: "com.android.application",
          apply: true,
        },
        {
          id: "org.jetbrains.kotlin.android",
          version: "2.1.20",
          apply: true,
        },
      ],
      repositories: ["google", "mavenCentral"],
      allprojects: {
        repositories: ["google", "mavenCentral"],
      },
    };

    return config;
  }
}
