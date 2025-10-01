import type { PackageJsonInfo } from "shared/types";

export interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: number;
  version: string;
}

export interface FileBackupInfo {
  originalPath: string;
  backupPath: string;
  fileType:
    | "package.json"
    | "gradle"
    | "native"
    | "binary"
    | "config"
    | "source";
  timestamp: number;
  size?: number;
}

export interface ComprehensiveBackupInfo {
  projectPath: string;
  version: string;
  timestamp: number;
  files: FileBackupInfo[];
  totalFiles: number;
}

export class BackupService {
  private static readonly BACKUP_SUFFIX = ".backup";

  /**
   * Create a backup of package.json before making changes
   */
  static async createPackageJsonBackup(
    projectPath: string
  ): Promise<BackupInfo | null> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const backupPath = `${packageJsonPath}${this.BACKUP_SUFFIX}`;

      // Check if package.json exists
      try {
        await window.App.readFile(packageJsonPath);
      } catch (error) {
        console.warn("package.json not found, skipping backup creation");
        return null;
      }

      // Read current package.json content
      const packageJsonContent = await window.App.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageJsonContent);

      // Extract version for backup info
      const version =
        packageJson.dependencies?.["react-native"] ||
        packageJson.devDependencies?.["react-native"] ||
        "unknown";

      // Create backup file
      await window.App.writeFile(backupPath, packageJsonContent);

      const backupInfo: BackupInfo = {
        originalPath: packageJsonPath,
        backupPath: backupPath,
        timestamp: Date.now(),
        version: version,
      };

      console.log(`Created package.json backup: ${backupPath}`);
      return backupInfo;
    } catch (error) {
      console.error("Error creating package.json backup:", error);
      return null;
    }
  }

  /**
   * Read package.json, preferring backup if it exists
   */
  static async readPackageJsonWithBackup(
    projectPath: string
  ): Promise<PackageJsonInfo> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const backupPath = `${packageJsonPath}${this.BACKUP_SUFFIX}`;

      // Check if backup exists
      let fileToRead = packageJsonPath;
      try {
        await window.App.readFile(backupPath);
        fileToRead = backupPath;
        console.log(`Reading package.json from backup: ${backupPath}`);
      } catch (error) {
        console.log(
          `No backup found, reading original package.json: ${packageJsonPath}`
        );
      }

      // Read the file (original or backup)
      const packageJsonContent = await window.App.readFile(fileToRead);
      const packageJson = JSON.parse(packageJsonContent);

      return packageJson;
    } catch (error) {
      console.error("Error reading package.json with backup:", error);
      throw new Error("Failed to read package.json");
    }
  }

  /**
   * Check if a backup exists for package.json
   */
  static async hasPackageJsonBackup(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const backupPath = `${packageJsonPath}${this.BACKUP_SUFFIX}`;

      await window.App.readFile(backupPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get backup info if it exists
   */
  static async getPackageJsonBackupInfo(
    projectPath: string
  ): Promise<BackupInfo | null> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const backupPath = `${packageJsonPath}${this.BACKUP_SUFFIX}`;

      // Check if backup exists
      const backupContent = await window.App.readFile(backupPath);
      const packageJson = JSON.parse(backupContent);

      const version =
        packageJson.dependencies?.["react-native"] ||
        packageJson.devDependencies?.["react-native"] ||
        "unknown";

      // Get file stats (if available)
      const timestamp = Date.now(); // Fallback timestamp

      return {
        originalPath: packageJsonPath,
        backupPath: backupPath,
        timestamp: timestamp,
        version: version,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Restore package.json from backup
   */
  static async restorePackageJsonFromBackup(
    projectPath: string
  ): Promise<boolean> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const backupPath = `${packageJsonPath}${this.BACKUP_SUFFIX}`;

      // Check if backup exists
      const backupContent = await window.App.readFile(backupPath);

      // Restore original package.json
      await window.App.writeFile(packageJsonPath, backupContent);

      console.log(`Restored package.json from backup: ${backupPath}`);
      return true;
    } catch (error) {
      console.error("Error restoring package.json from backup:", error);
      return false;
    }
  }

  /**
   * Remove backup file
   */
  static async removePackageJsonBackup(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = `${projectPath}/package.json`;
      const backupPath = `${packageJsonPath}${this.BACKUP_SUFFIX}`;

      // Check if backup exists
      try {
        await window.App.readFile(backupPath);
      } catch (error) {
        console.log("No backup to remove");
        return true;
      }

      // Remove backup file (using writeFile with empty content as deleteFile doesn't exist)
      await window.App.writeFile(backupPath, "");

      console.log(`Removed package.json backup: ${backupPath}`);
      return true;
    } catch (error) {
      console.error("Error removing package.json backup:", error);
      return false;
    }
  }

  /**
   * Create backup before package updates
   */
  static async createBackupBeforeUpdate(
    projectPath: string
  ): Promise<BackupInfo | null> {
    console.log("Creating backup before package update...");
    return await this.createPackageJsonBackup(projectPath);
  }

  /**
   * Clean up backup after successful commit
   */
  static async cleanupBackupAfterCommit(projectPath: string): Promise<boolean> {
    console.log("Cleaning up backup after successful commit...");
    return await this.removePackageJsonBackup(projectPath);
  }

  /**
   * Create comprehensive backup for all files that will be modified
   */
  static async createComprehensiveBackup(
    projectPath: string,
    filesToBackup: string[],
    version: string
  ): Promise<ComprehensiveBackupInfo | null> {
    try {
      console.log(
        `Creating comprehensive backup for ${filesToBackup.length} files...`
      );

      const backupInfo: ComprehensiveBackupInfo = {
        projectPath,
        version,
        timestamp: Date.now(),
        files: [],
        totalFiles: 0,
      };

      for (const filePath of filesToBackup) {
        const fileBackup = await this.createFileBackup(projectPath, filePath);
        if (fileBackup) {
          backupInfo.files.push(fileBackup);
        }
      }

      backupInfo.totalFiles = backupInfo.files.length;
      console.log(
        `Created comprehensive backup with ${backupInfo.totalFiles} files`
      );

      return backupInfo;
    } catch (error) {
      console.error("Error creating comprehensive backup:", error);
      return null;
    }
  }

  /**
   * Create backup for a single file
   */
  private static async createFileBackup(
    projectPath: string,
    filePath: string
  ): Promise<FileBackupInfo | null> {
    try {
      const fullPath = `${projectPath}/${filePath}`;
      const backupPath = `${fullPath}${this.BACKUP_SUFFIX}`;

      // Check if file exists
      try {
        await window.App.readFile(fullPath);
      } catch (error) {
        console.warn(`File not found, skipping backup: ${fullPath}`);
        return null;
      }

      // Read file content
      const content = await window.App.readFile(fullPath);

      // Create backup
      await window.App.writeFile(backupPath, content);

      // Determine file type
      const fileType = this.determineFileType(filePath);

      const fileBackup: FileBackupInfo = {
        originalPath: fullPath,
        backupPath: backupPath,
        fileType,
        timestamp: Date.now(),
        size: content.length,
      };

      console.log(`Created backup for ${fileType} file: ${filePath}`);
      return fileBackup;
    } catch (error) {
      console.error(`Error creating backup for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Determine file type based on path and extension
   */
  private static determineFileType(
    filePath: string
  ): FileBackupInfo["fileType"] {
    const fileName = filePath.split("/").pop() || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    // Package.json
    if (fileName === "package.json") {
      return "package.json";
    }

    // Gradle files
    if (
      fileName.includes("gradle") ||
      extension === "gradle" ||
      extension === "jar"
    ) {
      return "gradle";
    }

    // Native code files
    if (filePath.includes("ios/") || filePath.includes("android/")) {
      if (["m", "mm", "swift", "java", "kt"].includes(extension)) {
        return "native";
      }
    }

    // Binary files
    if (
      ["jar", "so", "dylib", "dll", "a", "lib", "o", "obj"].includes(extension)
    ) {
      return "binary";
    }

    // Configuration files
    if (
      ["json", "yaml", "yml", "toml", "ini", "conf", "properties"].includes(
        extension
      )
    ) {
      return "config";
    }

    // Source code files
    if (
      ["js", "ts", "jsx", "tsx", "py", "rb", "go", "rs"].includes(extension)
    ) {
      return "source";
    }

    // Default to config for unknown types
    return "config";
  }

  /**
   * Restore all files from comprehensive backup
   */
  static async restoreFromComprehensiveBackup(
    backupInfo: ComprehensiveBackupInfo
  ): Promise<{ success: boolean; restoredFiles: string[]; errors: string[] }> {
    try {
      console.log(
        `Restoring ${backupInfo.totalFiles} files from comprehensive backup...`
      );

      const restoredFiles: string[] = [];
      const errors: string[] = [];

      for (const fileBackup of backupInfo.files) {
        try {
          // Read backup content
          const backupContent = await window.App.readFile(
            fileBackup.backupPath
          );

          // Restore original file
          await window.App.writeFile(fileBackup.originalPath, backupContent);

          restoredFiles.push(fileBackup.originalPath);
          console.log(`Restored: ${fileBackup.originalPath}`);
        } catch (error) {
          const errorMsg = `Failed to restore ${fileBackup.originalPath}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: errors.length === 0,
        restoredFiles,
        errors,
      };
    } catch (error) {
      console.error("Error restoring from comprehensive backup:", error);
      return {
        success: false,
        restoredFiles: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Clean up comprehensive backup
   */
  static async cleanupComprehensiveBackup(
    backupInfo: ComprehensiveBackupInfo
  ): Promise<{ success: boolean; cleanedFiles: string[]; errors: string[] }> {
    try {
      console.log(
        `Cleaning up comprehensive backup with ${backupInfo.totalFiles} files...`
      );

      const cleanedFiles: string[] = [];
      const errors: string[] = [];

      for (const fileBackup of backupInfo.files) {
        try {
          // Remove backup file
          await window.App.writeFile(fileBackup.backupPath, "");
          cleanedFiles.push(fileBackup.backupPath);
          console.log(`Cleaned up: ${fileBackup.backupPath}`);
        } catch (error) {
          const errorMsg = `Failed to clean up ${fileBackup.backupPath}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: errors.length === 0,
        cleanedFiles,
        errors,
      };
    } catch (error) {
      console.error("Error cleaning up comprehensive backup:", error);
      return {
        success: false,
        cleanedFiles: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Get list of files that will be modified from complex changes
   */
  static extractFilesFromComplexChanges(complexChanges: any[]): string[] {
    const files: string[] = [];

    for (const change of complexChanges) {
      if (change.filePath) {
        // Remove RnDiffApp prefix if present
        let filePath = change.filePath;
        if (filePath.startsWith("RnDiffApp/")) {
          filePath = filePath.substring("RnDiffApp/".length);
        }
        files.push(filePath);
      }
    }

    return [...new Set(files)]; // Remove duplicates
  }
}
