import { DownloadManager } from "./download-manager";
import { DiffService } from "./diff-service";

export interface BinaryFileInfo {
  path: string;
  name: string;
  size: number;
  type:
    | "jar"
    | "so"
    | "dylib"
    | "dll"
    | "a"
    | "lib"
    | "o"
    | "obj"
    | "class"
    | "pyc"
    | "pyo";
  platform: "android" | "ios" | "windows" | "linux" | "macos" | "universal";
  downloadUrl?: string;
  checksum?: string;
}

export interface BinaryUpdateResult {
  success: boolean;
  updatedFiles: string[];
  downloadedFiles: string[];
  errors: string[];
  warnings: string[];
}

export class BinaryFileUpdater {
  /**
   * Analyze binary file changes from diff
   */
  static analyzeBinaryChanges(
    diffContent: string,
    version?: string
  ): BinaryFileInfo[] {
    const binaryFiles: BinaryFileInfo[] = [];
    const lines = diffContent.split("\n");
    let currentFile: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // File header
      if (line.startsWith("diff --git")) {
        const match = line.match(/diff --git a\/(.+?) b\/(.+?)$/);
        if (match) {
          currentFile = match[2];
        }
        continue;
      }

      // Skip if not a binary file
      if (currentFile && !this.isBinaryFile(currentFile)) {
        continue;
      }

      // Check for binary patch indicator
      if (line.includes("GIT binary patch") || line.includes("Binary files")) {
        if (currentFile) {
          const binaryInfo = this.parseBinaryFileInfo(currentFile, version);
          if (binaryInfo) {
            binaryFiles.push(binaryInfo);
          }
        }
      }
    }

    return binaryFiles;
  }

  /**
   * Check if file is binary
   */
  private static isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      ".jar",
      ".war",
      ".ear",
      ".zip",
      ".tar",
      ".gz",
      ".bz2",
      ".7z",
      ".exe",
      ".dll",
      ".so",
      ".dylib",
      ".a",
      ".lib",
      ".o",
      ".obj",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".bmp",
      ".ico",
      ".svg",
      ".webp",
      ".mp3",
      ".mp4",
      ".avi",
      ".mov",
      ".wav",
      ".flac",
      ".aac",
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".db",
      ".sqlite",
      ".sqlite3",
      ".mdb",
      ".accdb",
      ".bin",
      ".dat",
      ".img",
      ".iso",
      ".dmg",
      ".pkg",
      ".deb",
      ".rpm",
      ".apk",
      ".ipa",
      ".aab",
      ".app",
      ".keystore",
      ".jks",
      ".p12",
      ".pfx",
      ".crt",
      ".cer",
      ".pem",
      ".ttf",
      ".otf",
      ".woff",
      ".woff2",
      ".eot",
      ".class",
      ".pyc",
      ".pyo",
    ];

    const extension = filePath
      .toLowerCase()
      .substring(filePath.lastIndexOf("."));
    return binaryExtensions.includes(extension);
  }

  /**
   * Parse binary file information
   */
  private static parseBinaryFileInfo(
    filePath: string,
    version?: string
  ): BinaryFileInfo | null {
    if (!filePath) return null;

    const fileName = filePath.split("/").pop() || "";
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));

    let type: BinaryFileInfo["type"];
    let platform: BinaryFileInfo["platform"] = "universal";

    // Determine file type
    switch (extension) {
      case ".jar":
        type = "jar";
        platform = "android";
        break;
      case ".so":
        type = "so";
        platform = "android";
        break;
      case ".dylib":
        type = "dylib";
        platform = "ios";
        break;
      case ".dll":
        type = "dll";
        platform = "windows";
        break;
      case ".a":
      case ".lib":
        type = "a";
        platform = "universal";
        break;
      case ".o":
      case ".obj":
        type = "o";
        platform = "universal";
        break;
      case ".class":
        type = "class";
        platform = "android";
        break;
      case ".pyc":
      case ".pyo":
        type = "pyc";
        platform = "universal";
        break;
      default:
        return null;
    }

    // Determine platform based on path
    if (filePath.includes("android/")) {
      platform = "android";
    } else if (filePath.includes("ios/")) {
      platform = "ios";
    } else if (filePath.includes("windows/")) {
      platform = "windows";
    } else if (filePath.includes("linux/")) {
      platform = "linux";
    } else if (filePath.includes("macos/")) {
      platform = "macos";
    }

    return {
      path: filePath,
      name: fileName,
      size: 0, // Will be updated when downloaded
      type,
      platform,
      downloadUrl: this.generateDownloadUrl(filePath, version || "0.80.0"),
    };
  }

  /**
   * Generate download URL for binary file
   */
  private static generateDownloadUrl(
    filePath: string,
    version: string
  ): string {
    // Use DiffService to generate the correct download URL
    return DiffService.generateDownloadUrl(filePath, version);
  }

  /**
   * Download and update binary files
   */
  static async updateBinaryFiles(
    projectPath: string,
    binaryFiles: BinaryFileInfo[]
  ): Promise<BinaryUpdateResult> {
    const result: BinaryUpdateResult = {
      success: true,
      updatedFiles: [],
      downloadedFiles: [],
      errors: [],
      warnings: [],
    };

    for (const binaryFile of binaryFiles) {
      try {
        if (!binaryFile.downloadUrl) {
          result.warnings.push(
            `No download URL available for ${binaryFile.name}`
          );
          continue;
        }

        // Download the binary file
        const downloadResult = await this.downloadBinaryFile(binaryFile);
        if (downloadResult.success && downloadResult.filePath) {
          // Copy to project location
          await this.copyBinaryToProject(
            projectPath,
            binaryFile,
            downloadResult.filePath
          );
          result.updatedFiles.push(binaryFile.path);
          result.downloadedFiles.push(binaryFile.name);
        } else {
          result.errors.push(
            `Failed to download ${binaryFile.name}: ${downloadResult.error}`
          );
        }
      } catch (error) {
        result.errors.push(
          `Error updating ${binaryFile.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Download binary file
   */
  private static async downloadBinaryFile(binaryFile: BinaryFileInfo): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      const fileName = binaryFile.name;
      const filePath = `temp/${fileName}`;

      // Use DownloadManager to download the file
      const downloadId = await DownloadManager.startDownload(
        binaryFile.downloadUrl || "",
        fileName,
        filePath
      );

      // Wait for download to complete
      return new Promise((resolve) => {
        const unsubscribe = DownloadManager.subscribe((downloads) => {
          const download = downloads.find((d) => d.id === downloadId);
          if (download) {
            if (download.status === "completed") {
              unsubscribe();
              resolve({
                success: true,
                filePath: download.savedPath || filePath,
              });
            } else if (download.status === "error") {
              unsubscribe();
              resolve({
                success: false,
                error: download.error || "Download failed",
              });
            }
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Copy binary file to project location
   */
  private static async copyBinaryToProject(
    projectPath: string,
    binaryFile: BinaryFileInfo,
    tempFilePath: string
  ): Promise<void> {
    const targetPath = `${projectPath}/${binaryFile.path}`;

    // Create directory if it doesn't exist
    const dirPath = targetPath.substring(0, targetPath.lastIndexOf("/"));
    await this.ensureDirectoryExists(dirPath);

    // Copy file
    if (typeof window !== "undefined" && window.App) {
      // In renderer process, we'd need to implement file copying
      // This is a placeholder - actual implementation would depend on available APIs
      console.log(`Would copy ${tempFilePath} to ${targetPath}`);
    } else {
      // In main process, use Node.js fs
      const { copyFile } = await import("fs/promises");
      await copyFile(tempFilePath, targetPath);
    }
  }

  /**
   * Ensure directory exists
   */
  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (typeof window !== "undefined" && window.App) {
      // In renderer process, we'd need to implement directory creation
      console.log(`Would create directory: ${dirPath}`);
    } else {
      // In main process, use Node.js fs
      const { mkdir } = await import("fs/promises");
      try {
        await mkdir(dirPath, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  /**
   * Validate binary file integrity
   */
  static async validateBinaryFile(
    filePath: string,
    expectedChecksum?: string
  ): Promise<{
    isValid: boolean;
    actualChecksum?: string;
    error?: string;
  }> {
    try {
      // Read file content
      let content: string;
      if (typeof window !== "undefined" && window.App) {
        content = await window.App.readFile(filePath);
      } else {
        const { readFile } = await import("fs/promises");
        content = await readFile(filePath, "utf-8");
      }

      // Calculate checksum (simplified - in real implementation, use crypto)
      const actualChecksum = this.calculateChecksum(content);

      if (expectedChecksum && actualChecksum !== expectedChecksum) {
        return {
          isValid: false,
          actualChecksum,
          error: "Checksum mismatch",
        };
      }

      return {
        isValid: true,
        actualChecksum,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Calculate simple checksum (in real implementation, use crypto.createHash)
   */
  private static calculateChecksum(content: string): string {
    // This is a simplified checksum - in production, use proper hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get binary file information
   */
  static async getBinaryFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    type: string;
    lastModified: Date;
  }> {
    try {
      if (typeof window !== "undefined" && window.App) {
        // In renderer process, we'd need to implement file stats
        return {
          exists: true,
          size: 0,
          type: "unknown",
          lastModified: new Date(),
        };
      } else {
        // In main process, use Node.js fs
        const { stat } = await import("fs/promises");
        const stats = await stat(filePath);

        return {
          exists: true,
          size: stats.size,
          type: this.getFileType(filePath),
          lastModified: stats.mtime,
        };
      }
    } catch (error) {
      return {
        exists: false,
        size: 0,
        type: "unknown",
        lastModified: new Date(),
      };
    }
  }

  /**
   * Get file type from extension
   */
  private static getFileType(filePath: string): string {
    const extension = filePath
      .toLowerCase()
      .substring(filePath.lastIndexOf("."));
    return extension || "unknown";
  }

  /**
   * Create backup of binary file
   */
  static async createBinaryBackup(
    projectPath: string,
    filePath: string
  ): Promise<string> {
    const fullPath = `${projectPath}/${filePath}`;
    const backupPath = `${fullPath}.backup.${Date.now()}`;

    if (typeof window !== "undefined" && window.App) {
      // In renderer process, we'd need to implement file copying
      console.log(`Would backup ${fullPath} to ${backupPath}`);
      return backupPath;
    } else {
      // In main process, use Node.js fs
      const { copyFile } = await import("fs/promises");
      await copyFile(fullPath, backupPath);
      return backupPath;
    }
  }

  /**
   * Restore binary file from backup
   */
  static async restoreBinaryFromBackup(
    projectPath: string,
    filePath: string,
    backupPath: string
  ): Promise<void> {
    const fullPath = `${projectPath}/${filePath}`;

    if (typeof window !== "undefined" && window.App) {
      // In renderer process, we'd need to implement file copying
      console.log(`Would restore ${backupPath} to ${fullPath}`);
    } else {
      // In main process, use Node.js fs
      const { copyFile } = await import("fs/promises");
      await copyFile(backupPath, fullPath);
    }
  }
}
