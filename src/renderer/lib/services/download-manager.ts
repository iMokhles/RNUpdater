export interface DownloadProgress {
  id: string;
  fileName: string;
  filePath: string;
  url: string;
  status: "pending" | "downloading" | "completed" | "error" | "cancelled";
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  startTime: number;
  error?: string;
  savedPath?: string; // Path where file was saved
  fileSize?: number; // Final file size
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (progress: DownloadProgress) => void;
  onError?: (progress: DownloadProgress) => void;
}

export class DownloadManager {
  private static downloads = new Map<string, DownloadProgress>();
  private static listeners = new Set<(downloads: DownloadProgress[]) => void>();
  private static downloadPath = "Downloads"; // Default download folder

  /**
   * Subscribe to download updates
   */
  static subscribe(
    listener: (downloads: DownloadProgress[]) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all downloads
   */
  static getDownloads(): DownloadProgress[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Get download by ID
   */
  static getDownload(id: string): DownloadProgress | undefined {
    return this.downloads.get(id);
  }

  /**
   * Notify all listeners
   */
  private static notifyListeners() {
    const downloads = this.getDownloads();
    this.listeners.forEach((listener) => listener(downloads));
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Format speed to human readable string
   */
  static formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + "/s";
  }

  /**
   * Format time remaining to human readable string
   */
  static formatTimeRemaining(seconds: number): string {
    if (seconds === Infinity || isNaN(seconds)) return "Unknown";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  /**
   * Set download directory
   */
  static setDownloadPath(path: string): void {
    this.downloadPath = path;
  }

  /**
   * Get download directory
   */
  static getDownloadPath(): string {
    return this.downloadPath;
  }

  /**
   * Start a download
   */
  static async startDownload(
    url: string,
    fileName: string,
    filePath: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    const id = `download_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const download: DownloadProgress = {
      id,
      fileName,
      filePath,
      url,
      status: "pending",
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0,
      timeRemaining: 0,
      startTime: Date.now(),
    };

    this.downloads.set(id, download);
    this.notifyListeners();

    try {
      // Start the actual download
      await this.performDownload(download, options);
    } catch (error) {
      download.status = "error";
      download.error = error instanceof Error ? error.message : "Unknown error";
      this.downloads.set(id, download);
      this.notifyListeners();
      options.onError?.(download);
      throw error;
    }

    return id;
  }

  /**
   * Perform the actual download with progress tracking
   */
  private static async performDownload(
    download: DownloadProgress,
    options: DownloadOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastTime = Date.now();
      let lastBytes = 0;

      xhr.open("GET", download.url, true);
      xhr.responseType = "blob";

      xhr.onloadstart = () => {
        download.status = "downloading";
        this.downloads.set(download.id, download);
        this.notifyListeners();
      };

      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000; // seconds
          const bytesDiff = event.loaded - lastBytes;

          download.downloadedBytes = event.loaded;
          download.totalBytes = event.total;
          download.progress = (event.loaded / event.total) * 100;

          if (timeDiff > 0) {
            download.speed = bytesDiff / timeDiff;
            if (download.speed > 0) {
              const remainingBytes = event.total - event.loaded;
              download.timeRemaining = remainingBytes / download.speed;
            }
          }

          lastTime = now;
          lastBytes = event.loaded;

          this.downloads.set(download.id, download);
          this.notifyListeners();
          options.onProgress?.(download);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            // Save the file to disk
            const blob = xhr.response;
            const savedPath = await this.saveFileToDisk(
              blob,
              download.fileName
            );

            download.status = "completed";
            download.progress = 100;
            download.speed = 0;
            download.timeRemaining = 0;
            download.savedPath = savedPath;
            download.fileSize = blob.size;

            this.downloads.set(download.id, download);
            this.notifyListeners();
            options.onComplete?.(download);
            resolve();
          } catch (saveError) {
            download.status = "error";
            download.error = `Failed to save file: ${
              saveError instanceof Error ? saveError.message : "Unknown error"
            }`;
            this.downloads.set(download.id, download);
            this.notifyListeners();
            options.onError?.(download);
            reject(saveError);
          }
        } else {
          reject(new Error(`Download failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during download"));
      };

      xhr.onabort = () => {
        download.status = "cancelled";
        this.downloads.set(download.id, download);
        this.notifyListeners();
        reject(new Error("Download cancelled"));
      };

      xhr.send();
    });
  }

  /**
   * Cancel a download
   */
  static cancelDownload(id: string): boolean {
    const download = this.downloads.get(id);
    if (download && download.status === "downloading") {
      download.status = "cancelled";
      this.downloads.set(id, download);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Remove a download from the list
   */
  static removeDownload(id: string): boolean {
    return this.downloads.delete(id);
  }

  /**
   * Clear all completed downloads
   */
  static clearCompleted(): void {
    for (const [id, download] of this.downloads.entries()) {
      if (download.status === "completed" || download.status === "error") {
        this.downloads.delete(id);
      }
    }
    this.notifyListeners();
  }

  /**
   * Save file to disk using the File System Access API or fallback
   */
  private static async saveFileToDisk(
    blob: Blob,
    fileName: string
  ): Promise<string> {
    try {
      // Try to use the File System Access API (modern browsers)
      if ("showSaveFilePicker" in window) {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "All files",
              accept: { "*/*": [] },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return fileName; // Return the suggested name
      } else {
        // Fallback: Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return `Downloads/${fileName}`; // Return assumed path
      }
    } catch (error) {
      // If user cancels the save dialog, throw a specific error
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Download cancelled by user");
      }
      throw error;
    }
  }

  /**
   * Open download folder
   */
  static async openDownloadFolder(): Promise<void> {
    try {
      // Try to open the download folder
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        // Directory picker opened successfully
      } else {
        // Fallback: Open a new tab with the download folder
        window.open("file://" + this.downloadPath, "_blank");
      }
    } catch (error) {
      console.error("Failed to open download folder:", error);
    }
  }

  /**
   * Open downloaded file
   */
  static async openFile(download: DownloadProgress): Promise<void> {
    if (!download.savedPath) {
      throw new Error("File not saved yet");
    }

    try {
      // Try to open the file
      if ("showOpenFilePicker" in window) {
        // This is a bit tricky with File System Access API
        // For now, we'll just show a message
        alert(`File saved to: ${download.savedPath}`);
      } else {
        // Fallback: Try to open the file
        window.open("file://" + download.savedPath, "_blank");
      }
    } catch (error) {
      console.error("Failed to open file:", error);
      alert(`File saved to: ${download.savedPath}`);
    }
  }

  /**
   * Get download statistics
   */
  static getStats(): {
    total: number;
    completed: number;
    downloading: number;
    error: number;
    pending: number;
  } {
    const downloads = this.getDownloads();
    return {
      total: downloads.length,
      completed: downloads.filter((d) => d.status === "completed").length,
      downloading: downloads.filter((d) => d.status === "downloading").length,
      error: downloads.filter((d) => d.status === "error").length,
      pending: downloads.filter((d) => d.status === "pending").length,
    };
  }
}
