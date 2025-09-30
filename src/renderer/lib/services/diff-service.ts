export interface DiffFile {
  path: string;
  status: "added" | "deleted" | "modified" | "binary";
  content: string;
  oldContent?: string;
  isBinary?: boolean;
  downloadUrl?: string;
}

export interface ReactNativeDiff {
  fromVersion: string;
  toVersion: string;
  files: DiffFile[];
  summary: {
    added: number;
    deleted: number;
    modified: number;
    binary: number;
  };
}

export class DiffService {
  private static readonly BASE_URL =
    "https://raw.githubusercontent.com/react-native-community/rn-diff-purge/diffs/diffs";
  private static readonly RELEASE_BASE_URL =
    "https://raw.githubusercontent.com/react-native-community/rn-diff-purge/release";

  /**
   * Fetch diff between two React Native versions
   */
  static async fetchDiff(
    fromVersion: string,
    toVersion: string
  ): Promise<ReactNativeDiff> {
    try {
      const diffUrl = `${this.BASE_URL}/${fromVersion}..${toVersion}.diff`;
      console.log("Fetching diff from:", diffUrl);

      const response = await fetch(diffUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch diff: ${response.status} ${response.statusText}`
        );
      }

      const diffText = await response.text();
      return this.parseDiff(diffText, fromVersion, toVersion);
    } catch (error) {
      console.error("Error fetching diff:", error);
      throw new Error(
        `Failed to fetch diff between ${fromVersion} and ${toVersion}`
      );
    }
  }

  /**
   * Check if a file is binary based on its extension
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
      ".ipa",
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
      ".o",
      ".obj",
      ".so",
      ".dylib",
      ".dll",
    ];

    const extension = filePath
      .toLowerCase()
      .substring(filePath.lastIndexOf("."));
    return binaryExtensions.includes(extension);
  }

  /**
   * Generate download URL for binary files
   */
  private static generateDownloadUrl(
    filePath: string,
    toVersion: string
  ): string {
    return `${this.RELEASE_BASE_URL}/${toVersion}/${filePath}`;
  }

  /**
   * Parse diff text into structured data
   */
  private static parseDiff(
    diffText: string,
    fromVersion: string,
    toVersion: string
  ): ReactNativeDiff {
    const files: DiffFile[] = [];
    const lines = diffText.split("\n");
    let currentFile: DiffFile | null = null;
    let currentContent: string[] = [];
    let inHunk = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // File header
      if (line.startsWith("diff --git")) {
        // Save previous file
        if (currentFile) {
          currentFile.content = currentContent.join("\n");
          files.push(currentFile);
        }

        // Start new file
        const match = line.match(/diff --git a\/(.+?) b\/(.+?)$/);
        if (match) {
          const oldPath = match[1];
          const newPath = match[2];
          const filePath = newPath === "/dev/null" ? oldPath : newPath;
          const isBinary = this.isBinaryFile(filePath);

          currentFile = {
            path: filePath,
            status: isBinary
              ? "binary"
              : newPath === "/dev/null"
              ? "deleted"
              : oldPath === "/dev/null"
              ? "added"
              : "modified",
            content: "",
            isBinary,
            downloadUrl: isBinary
              ? this.generateDownloadUrl(filePath, toVersion)
              : undefined,
          };
          currentContent = [];
          inHunk = false;
        }
      }
      // File mode change
      else if (
        line.startsWith("deleted file mode") ||
        line.startsWith("new file mode")
      ) {
        // File mode info, continue
      }
      // Index line
      else if (line.startsWith("index ")) {
        // Index info, continue
      }
      // File paths
      else if (line.startsWith("--- a/") || line.startsWith("+++ b/")) {
        // File path info, continue
      }
      // Hunk header
      else if (line.startsWith("@@")) {
        inHunk = true;
        currentContent.push(line);
      }
      // Content lines
      else if (inHunk && currentFile) {
        currentContent.push(line);
      }
    }

    // Save last file
    if (currentFile) {
      currentFile.content = currentContent.join("\n");
      files.push(currentFile);
    }

    // Calculate summary
    const summary = {
      added: files.filter((f) => f.status === "added").length,
      deleted: files.filter((f) => f.status === "deleted").length,
      modified: files.filter((f) => f.status === "modified").length,
      binary: files.filter((f) => f.status === "binary").length,
    };

    return {
      fromVersion,
      toVersion,
      files,
      summary,
    };
  }

  /**
   * Get available diff versions
   */
  static async getAvailableVersions(): Promise<string[]> {
    try {
      // This would need to be implemented based on available API
      // For now, return common React Native versions
      return [
        "0.70.0",
        "0.70.1",
        "0.70.2",
        "0.70.3",
        "0.70.4",
        "0.70.5",
        "0.70.6",
        "0.71.0",
        "0.71.1",
        "0.71.2",
        "0.71.3",
        "0.71.4",
        "0.71.5",
        "0.71.6",
        "0.71.7",
        "0.71.8",
        "0.72.0",
        "0.72.1",
        "0.72.2",
        "0.72.3",
        "0.72.4",
        "0.72.5",
        "0.72.6",
        "0.72.7",
        "0.73.0",
        "0.73.1",
        "0.73.2",
        "0.73.3",
        "0.73.4",
        "0.73.5",
        "0.73.6",
        "0.74.0",
        "0.74.1",
        "0.74.2",
        "0.74.3",
        "0.74.4",
        "0.74.5",
        "0.75.0",
        "0.75.1",
        "0.75.2",
        "0.75.3",
        "0.75.4",
        "0.76.0",
        "0.76.1",
        "0.76.2",
        "0.76.3",
        "0.77.0",
        "0.77.1",
        "0.77.2",
        "0.78.0",
        "0.78.1",
        "0.78.2",
        "0.79.0",
        "0.79.1",
        "0.79.2",
        "0.80.0",
        "0.80.1",
        "0.80.2",
        "0.81.0",
        "0.81.1",
        "0.81.2",
        "0.82.0",
        "0.82.1",
        "0.82.2",
        "0.83.0",
        "0.83.1",
        "0.83.2",
        "0.84.0",
        "0.84.1",
        "0.84.2",
        "0.85.0",
        "0.85.1",
        "0.85.2",
      ];
    } catch (error) {
      console.error("Error fetching available versions:", error);
      return [];
    }
  }

  /**
   * Check if diff exists between two versions
   */
  static async diffExists(
    fromVersion: string,
    toVersion: string
  ): Promise<boolean> {
    try {
      const diffUrl = `${this.BASE_URL}/${fromVersion}..${toVersion}.diff`;
      const response = await fetch(diffUrl, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
