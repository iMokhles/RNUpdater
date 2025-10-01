export interface NativeCodeChange {
  filePath: string;
  type: "ios" | "android";
  language: "swift" | "objective-c" | "kotlin" | "java";
  changes: Array<{
    type:
      | "import"
      | "class"
      | "method"
      | "property"
      | "initialization"
      | "configuration";
    description: string;
    oldCode?: string;
    newCode: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
}

export interface NativeUpdateResult {
  success: boolean;
  updatedFiles: string[];
  errors: string[];
  warnings: string[];
  migrationNotes: string[];
}

export class NativeCodeUpdater {
  /**
   * Analyze native code changes from diff
   */
  static analyzeNativeChanges(diffContent: string): NativeCodeChange[] {
    const changes: NativeCodeChange[] = [];
    const lines = diffContent.split("\n");
    let currentFile: string | null = null;
    let fileChanges: Array<{
      type:
        | "import"
        | "class"
        | "method"
        | "property"
        | "initialization"
        | "configuration";
      description: string;
      oldCode?: string;
      newCode: string;
      severity: "low" | "medium" | "high" | "critical";
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // File header
      if (line.startsWith("diff --git")) {
        if (currentFile && fileChanges.length > 0) {
          const change = this.createNativeCodeChange(currentFile, fileChanges);
          if (change) {
            changes.push(change);
          }
        }

        const match = line.match(/diff --git a\/(.+?) b\/(.+?)$/);
        if (match) {
          currentFile = match[2];
          fileChanges = [];
        }
        continue;
      }

      // Skip if not a native file
      if (currentFile && !this.isNativeFile(currentFile)) {
        continue;
      }

      // Parse diff lines
      if (line.startsWith("+") || line.startsWith("-")) {
        const change = this.parseNativeDiffLine(line, currentFile);
        if (change) {
          fileChanges.push(change);
        }
      }
    }

    // Add last file changes
    if (currentFile && fileChanges.length > 0) {
      const change = this.createNativeCodeChange(currentFile, fileChanges);
      if (change) {
        changes.push(change);
      }
    }

    return changes;
  }

  /**
   * Check if file is native code
   */
  private static isNativeFile(filePath: string): boolean {
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

    return (
      nativeExtensions.some((ext) => filePath.endsWith(ext)) ||
      nativePaths.some((path) => filePath.includes(path))
    );
  }

  /**
   * Create native code change object
   */
  private static createNativeCodeChange(
    filePath: string,
    changes: Array<{
      type:
        | "import"
        | "class"
        | "method"
        | "property"
        | "initialization"
        | "configuration";
      description: string;
      oldCode?: string;
      newCode: string;
      severity: "low" | "medium" | "high" | "critical";
    }>
  ): NativeCodeChange | null {
    if (changes.length === 0) return null;

    const type = this.determineNativeType(filePath);
    const language = this.determineLanguage(filePath);

    return {
      filePath,
      type,
      language,
      changes,
    };
  }

  /**
   * Determine native platform type
   */
  private static determineNativeType(filePath: string): "ios" | "android" {
    if (
      filePath.includes("android/") ||
      filePath.includes("src/main/java/") ||
      filePath.includes("src/main/kotlin/")
    ) {
      return "android";
    }
    return "ios";
  }

  /**
   * Determine programming language
   */
  private static determineLanguage(
    filePath: string
  ): "swift" | "objective-c" | "kotlin" | "java" {
    if (filePath.endsWith(".swift")) return "swift";
    if (filePath.endsWith(".m") || filePath.endsWith(".mm"))
      return "objective-c";
    if (filePath.endsWith(".kt")) return "kotlin";
    return "java";
  }

  /**
   * Parse native diff line
   */
  private static parseNativeDiffLine(
    line: string,
    filePath: string | null
  ): {
    type:
      | "import"
      | "class"
      | "method"
      | "property"
      | "initialization"
      | "configuration";
    description: string;
    oldCode?: string;
    newCode: string;
    severity: "low" | "medium" | "high" | "critical";
  } | null {
    const isAddition = line.startsWith("+");
    const content = line.substring(1).trim();

    // Import changes
    if (content.startsWith("import ") || content.startsWith("#import ")) {
      return {
        type: "import",
        description: `Import statement ${isAddition ? "added" : "removed"}`,
        newCode: content,
        severity: "low",
      };
    }

    // Class changes
    if (content.includes("class ") || content.includes("@interface ")) {
      return {
        type: "class",
        description: `Class definition ${isAddition ? "added" : "modified"}`,
        newCode: content,
        severity: "medium",
      };
    }

    // Method changes
    if (
      content.includes("fun ") ||
      content.includes("public ") ||
      content.includes("private ") ||
      content.includes("- (")
    ) {
      return {
        type: "method",
        description: `Method ${isAddition ? "added" : "modified"}`,
        newCode: content,
        severity: "medium",
      };
    }

    // Property changes
    if (
      content.includes("val ") ||
      content.includes("var ") ||
      content.includes("@property ")
    ) {
      return {
        type: "property",
        description: `Property ${isAddition ? "added" : "modified"}`,
        newCode: content,
        severity: "low",
      };
    }

    // Initialization changes (MainApplication.kt specific)
    if (
      filePath?.includes("MainApplication") &&
      (content.includes("onCreate") || content.includes("loadReactNative"))
    ) {
      return {
        type: "initialization",
        description: "React Native initialization code changed",
        newCode: content,
        severity: "critical",
      };
    }

    // Configuration changes
    if (
      content.includes("buildConfigField") ||
      content.includes("resValue") ||
      content.includes("manifestPlaceholders")
    ) {
      return {
        type: "configuration",
        description: "Build configuration changed",
        newCode: content,
        severity: "medium",
      };
    }

    return null;
  }

  /**
   * Apply native code updates
   */
  static async applyNativeUpdates(
    projectPath: string,
    changes: NativeCodeChange[]
  ): Promise<NativeUpdateResult> {
    const result: NativeUpdateResult = {
      success: true,
      updatedFiles: [],
      errors: [],
      warnings: [],
      migrationNotes: [],
    };

    for (const change of changes) {
      try {
        await this.applyNativeChange(projectPath, change);
        result.updatedFiles.push(change.filePath);

        // Add migration notes for critical changes
        if (change.changes.some((c) => c.severity === "critical")) {
          result.migrationNotes.push(
            `Critical changes in ${change.filePath}: ${change.changes
              .filter((c) => c.severity === "critical")
              .map((c) => c.description)
              .join(", ")}`
          );
        }
      } catch (error) {
        result.errors.push(
          `Failed to update ${change.filePath}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Apply individual native change
   */
  private static async applyNativeChange(
    projectPath: string,
    change: NativeCodeChange
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

    // Apply changes based on type
    let updatedContent = content;
    for (const changeItem of change.changes) {
      updatedContent = this.applyNativeChangeToContent(
        updatedContent,
        changeItem,
        change.language
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
   * Apply native change to content
   */
  private static applyNativeChangeToContent(
    content: string,
    change: {
      type:
        | "import"
        | "class"
        | "method"
        | "property"
        | "initialization"
        | "configuration";
      description: string;
      oldCode?: string;
      newCode: string;
      severity: "low" | "medium" | "high" | "critical";
    },
    language: "swift" | "objective-c" | "kotlin" | "java"
  ): string {
    const lines = content.split("\n");
    const updatedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle different change types
      switch (change.type) {
        case "import":
          if (
            change.newCode.includes("import") &&
            !line.includes(change.newCode)
          ) {
            // Add import if not present
            if (
              line.trim().startsWith("import") ||
              line.trim().startsWith("#import")
            ) {
              updatedLines.push(line);
              updatedLines.push(change.newCode);
            } else {
              updatedLines.push(line);
            }
          } else {
            updatedLines.push(line);
          }
          break;

        case "initialization":
          if (change.description.includes("React Native initialization")) {
            // Replace onCreate method in MainApplication.kt
            if (line.includes("override fun onCreate()")) {
              updatedLines.push(line);
              updatedLines.push("    super.onCreate()");
              updatedLines.push("    loadReactNative(this)");
            } else if (
              line.includes("SoLoader.init") ||
              line.includes("load()")
            ) {
              // Remove old initialization code
              continue;
            } else {
              updatedLines.push(line);
            }
          } else {
            updatedLines.push(line);
          }
          break;

        default:
          updatedLines.push(line);
          break;
      }
    }

    return updatedLines.join("\n");
  }

  /**
   * Generate migration script for native changes
   */
  static generateMigrationScript(changes: NativeCodeChange[]): string {
    let script = "# Native Code Migration Script\n\n";

    for (const change of changes) {
      script += `## ${change.filePath}\n`;
      script += `**Platform:** ${change.type}\n`;
      script += `**Language:** ${change.language}\n\n`;

      for (const changeItem of change.changes) {
        script += `### ${changeItem.description}\n`;
        script += `**Severity:** ${changeItem.severity}\n\n`;

        if (changeItem.oldCode) {
          script += "**Old Code:**\n```\n";
          script += changeItem.oldCode;
          script += "\n```\n\n";
        }

        script += "**New Code:**\n```\n";
        script += changeItem.newCode;
        script += "\n```\n\n";
      }

      script += "---\n\n";
    }

    return script;
  }

  /**
   * Validate native code changes
   */
  static validateNativeChanges(changes: NativeCodeChange[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const change of changes) {
      // Check for critical changes that need manual review
      const criticalChanges = change.changes.filter(
        (c) => c.severity === "critical"
      );
      if (criticalChanges.length > 0) {
        warnings.push(
          `Critical changes in ${change.filePath} require manual review`
        );
      }

      // Check for missing imports
      const importChanges = change.changes.filter((c) => c.type === "import");
      if (importChanges.length > 0) {
        warnings.push(
          `Import changes in ${change.filePath} may affect compilation`
        );
      }

      // Check for initialization changes
      const initChanges = change.changes.filter(
        (c) => c.type === "initialization"
      );
      if (initChanges.length > 0) {
        warnings.push(
          `Initialization changes in ${change.filePath} may affect app startup`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
