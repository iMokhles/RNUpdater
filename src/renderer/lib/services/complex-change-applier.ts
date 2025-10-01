import {
  NativeCodeUpdater,
  type NativeUpdateResult,
} from "./native-code-updater";
import {
  BinaryFileUpdater,
  type BinaryUpdateResult,
} from "./binary-file-updater";
import { GradleUpdater, type GradleUpdateResult } from "./gradle-updater";
import { DiffService } from "./diff-service";

export interface ComplexChange {
  type: string;
  filePath: string;
  description: string;
  severity: string;
}

export interface ComplexChangeApplicationResult {
  success: boolean;
  appliedChanges: Array<{
    type: string;
    filePath: string;
    success: boolean;
    error?: string;
  }>;
  errors: string[];
  warnings: string[];
}

export class ComplexChangeApplier {
  /**
   * Apply selected complex changes to the project
   */
  static async applySelectedChanges(
    projectPath: string,
    selectedChanges: ComplexChange[],
    diffContent: string,
    targetVersion?: string
  ): Promise<ComplexChangeApplicationResult> {
    const result: ComplexChangeApplicationResult = {
      success: true,
      appliedChanges: [],
      errors: [],
      warnings: [],
    };

    console.log(
      `Applying ${selectedChanges.length} selected complex changes...`
    );

    for (const change of selectedChanges) {
      try {
        console.log(`Applying change: ${change.type} - ${change.filePath}`);

        const changeResult = await this.applySingleChange(
          projectPath,
          change,
          diffContent,
          targetVersion
        );

        result.appliedChanges.push({
          type: change.type,
          filePath: change.filePath,
          success: changeResult.success,
          error: changeResult.error,
        });

        if (!changeResult.success) {
          result.success = false;
          result.errors.push(
            `Failed to apply ${change.type} change to ${change.filePath}: ${changeResult.error}`
          );
        } else {
          console.log(
            `Successfully applied ${change.type} change to ${change.filePath}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        result.success = false;
        result.errors.push(
          `Error applying ${change.type} change to ${change.filePath}: ${errorMessage}`
        );

        result.appliedChanges.push({
          type: change.type,
          filePath: change.filePath,
          success: false,
          error: errorMessage,
        });
      }
    }

    return result;
  }

  /**
   * Apply a single complex change based on its type
   */
  private static async applySingleChange(
    projectPath: string,
    change: ComplexChange,
    diffContent: string,
    targetVersion?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (change.type) {
        case "native_code":
          return await this.applyNativeCodeChange(
            projectPath,
            change,
            diffContent
          );

        case "binary":
          return await this.applyBinaryFileChange(
            projectPath,
            change,
            diffContent,
            targetVersion
          );

        case "gradle":
          return await this.applyGradleChange(
            projectPath,
            change,
            diffContent,
            targetVersion
          );

        case "configuration":
          return await this.applyConfigurationChange(
            projectPath,
            change,
            diffContent
          );

        case "source_code":
          return await this.applySourceCodeChange(
            projectPath,
            change,
            diffContent
          );

        default:
          return {
            success: false,
            error: `Unknown change type: ${change.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply native code changes (iOS/Android)
   */
  private static async applyNativeCodeChange(
    projectPath: string,
    change: ComplexChange,
    diffContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Applying native code change to ${change.filePath}`);

      // Analyze native changes from diff
      const nativeChanges = NativeCodeUpdater.analyzeNativeChanges(diffContent);

      // Find the specific change for this file
      const fileChange = nativeChanges.find(
        (nc) => nc.filePath === change.filePath
      );

      if (!fileChange) {
        return {
          success: false,
          error: `No native code changes found for ${change.filePath}`,
        };
      }

      // Apply the native code update
      const updateResult = await NativeCodeUpdater.applyNativeUpdate(
        projectPath,
        fileChange
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.errors.join(", "),
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply binary file changes (gradle-wrapper.jar, etc.)
   */
  private static async applyBinaryFileChange(
    projectPath: string,
    change: ComplexChange,
    diffContent: string,
    targetVersion?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Applying binary file change to ${change.filePath}`);

      // Analyze binary changes from diff
      const binaryChanges = BinaryFileUpdater.analyzeBinaryChanges(
        diffContent,
        targetVersion
      );

      // Find the specific change for this file
      const fileChange = binaryChanges.find(
        (bc) => bc.path === change.filePath
      );

      if (!fileChange) {
        return {
          success: false,
          error: `No binary file changes found for ${change.filePath}`,
        };
      }

      // Apply the binary file update
      const updateResult = await BinaryFileUpdater.applyBinaryUpdate(
        projectPath,
        fileChange
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.errors.join(", "),
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply Gradle configuration changes
   */
  private static async applyGradleChange(
    projectPath: string,
    change: ComplexChange,
    diffContent: string,
    targetVersion?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Applying Gradle change to ${change.filePath}`);

      // For gradle-wrapper.jar, handle it as a binary file download
      if (change.filePath.includes("gradle-wrapper.jar")) {
        return await this.applyGradleWrapperJar(
          projectPath,
          change,
          diffContent,
          targetVersion
        );
      }

      // Analyze Gradle changes from diff
      const gradleChanges = GradleUpdater.analyzeGradleChanges(diffContent);

      // Find the specific change for this file
      const fileChange = gradleChanges.find(
        (gc) => gc.filePath === change.filePath
      );

      if (!fileChange) {
        return {
          success: false,
          error: `No Gradle changes found for ${change.filePath}`,
        };
      }

      // Apply the Gradle update
      const updateResult = await GradleUpdater.applyGradleUpdate(
        projectPath,
        fileChange
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.errors.join(", "),
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply gradle-wrapper.jar update (download and replace)
   */
  private static async applyGradleWrapperJar(
    projectPath: string,
    change: ComplexChange,
    diffContent: string,
    targetVersion?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Applying gradle-wrapper.jar update to ${change.filePath}`);

      // Extract the actual file path (remove RnDiffApp prefix if present)
      let actualFilePath = change.filePath;
      if (actualFilePath.startsWith("RnDiffApp/")) {
        actualFilePath = actualFilePath.substring("RnDiffApp/".length);
      }

      const fullPath = `${projectPath}/${actualFilePath}`;
      console.log(`Full path for gradle-wrapper.jar: ${fullPath}`);

      // Use DiffService to generate the correct download URL
      const versionToUse = targetVersion || "0.80.0"; // Fallback to default version
      const gradleWrapperUrl = DiffService.generateDownloadUrl(
        change.filePath,
        versionToUse
      );

      console.log(`Downloading gradle-wrapper.jar from: ${gradleWrapperUrl}`);

      try {
        const response = await fetch(gradleWrapperUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to download gradle-wrapper.jar: ${response.status}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Write the new gradle-wrapper.jar file
        await window.App.writeFile(fullPath, buffer);

        console.log(`Successfully updated gradle-wrapper.jar at ${fullPath}`);
        return { success: true };
      } catch (downloadError) {
        console.error("Failed to download gradle-wrapper.jar:", downloadError);
        return {
          success: false,
          error: `Failed to download gradle-wrapper.jar: ${
            downloadError instanceof Error
              ? downloadError.message
              : "Unknown error"
          }`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply configuration file changes
   */
  private static async applyConfigurationChange(
    projectPath: string,
    change: ComplexChange,
    diffContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Applying configuration change to ${change.filePath}`);

      // For configuration files, we'll extract the changes from the diff
      // and apply them directly to the file
      const fileChanges = this.extractFileChangesFromDiff(
        diffContent,
        change.filePath
      );

      if (!fileChanges) {
        return {
          success: false,
          error: `No changes found for ${change.filePath}`,
        };
      }

      // Apply the configuration changes
      await this.applyFileChanges(projectPath, change.filePath, fileChanges);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply source code changes
   */
  private static async applySourceCodeChange(
    projectPath: string,
    change: ComplexChange,
    diffContent: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Applying source code change to ${change.filePath}`);

      // For source code files, we'll extract the changes from the diff
      // and apply them directly to the file
      const fileChanges = this.extractFileChangesFromDiff(
        diffContent,
        change.filePath
      );

      if (!fileChanges) {
        return {
          success: false,
          error: `No changes found for ${change.filePath}`,
        };
      }

      // Apply the source code changes
      await this.applyFileChanges(projectPath, change.filePath, fileChanges);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Extract file changes from diff content
   */
  private static extractFileChangesFromDiff(
    diffContent: string,
    filePath: string
  ): { oldContent: string; newContent: string } | null {
    const lines = diffContent.split("\n");
    let inFile = false;
    let oldContent: string[] = [];
    let newContent: string[] = [];
    let inHunk = false;

    for (const line of lines) {
      // Check if we're entering the file we want
      if (line.startsWith("diff --git") && line.includes(filePath)) {
        inFile = true;
        continue;
      }

      // If we're in the file and hit another file, stop
      if (inFile && line.startsWith("diff --git") && !line.includes(filePath)) {
        break;
      }

      if (inFile) {
        // Start of hunk
        if (line.startsWith("@@")) {
          inHunk = true;
          continue;
        }

        // End of hunk
        if (line.startsWith("diff --git") || line.startsWith("Binary file")) {
          inHunk = false;
          continue;
        }

        if (inHunk) {
          if (line.startsWith("-")) {
            oldContent.push(line.substring(1));
          } else if (line.startsWith("+")) {
            newContent.push(line.substring(1));
          } else if (line.startsWith(" ")) {
            const content = line.substring(1);
            oldContent.push(content);
            newContent.push(content);
          }
        }
      }
    }

    if (oldContent.length === 0 && newContent.length === 0) {
      return null;
    }

    return {
      oldContent: oldContent.join("\n"),
      newContent: newContent.join("\n"),
    };
  }

  /**
   * Apply file changes to the actual file
   */
  private static async applyFileChanges(
    projectPath: string,
    filePath: string,
    changes: { oldContent: string; newContent: string }
  ): Promise<void> {
    // Extract the actual file path (remove RnDiffApp prefix if present)
    let actualFilePath = filePath;
    if (actualFilePath.startsWith("RnDiffApp/")) {
      actualFilePath = actualFilePath.substring("RnDiffApp/".length);
    }

    const fullPath = `${projectPath}/${actualFilePath}`;
    console.log(`Applying file changes to: ${fullPath}`);

    try {
      // Read current file content
      const currentContent = await window.App.readFile(fullPath);

      // Apply the changes (replace old content with new content)
      const updatedContent = currentContent.replace(
        changes.oldContent,
        changes.newContent
      );

      // Write updated content back to file
      await window.App.writeFile(fullPath, updatedContent);

      console.log(`Successfully updated ${actualFilePath}`);
    } catch (error) {
      console.error(`Error updating ${actualFilePath}:`, error);
      throw error;
    }
  }

  /**
   * Get automation status for a change type
   */
  static getAutomationStatus(changeType: string): {
    automated: boolean;
    description: string;
  } {
    switch (changeType) {
      case "native_code":
        return {
          automated: true,
          description:
            "Native code files (iOS/Android) will be automatically updated",
        };

      case "binary":
        return {
          automated: true,
          description:
            "Binary files (gradle-wrapper.jar, etc.) will be automatically downloaded and replaced",
        };

      case "gradle":
        return {
          automated: true,
          description:
            "Gradle configuration files will be automatically updated",
        };

      case "configuration":
        return {
          automated: true,
          description:
            "Configuration files (.prettierrc.js, tsconfig.json, etc.) will be automatically updated",
        };

      case "source_code":
        return {
          automated: true,
          description: "Source code files will be automatically updated",
        };

      default:
        return {
          automated: false,
          description: "Manual intervention may be required",
        };
    }
  }
}
