import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  File,
  Trash2,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import {
  DownloadManager,
  DownloadProgress,
} from "../lib/services/download-manager";

interface DownloadProgressProps {
  className?: string;
}

export function DownloadProgressComponent({
  className,
}: DownloadProgressProps) {
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);

  useEffect(() => {
    const unsubscribe = DownloadManager.subscribe(setDownloads);
    return unsubscribe;
  }, []);

  const handleCancel = (id: string) => {
    DownloadManager.cancelDownload(id);
  };

  const handleRemove = (id: string) => {
    DownloadManager.removeDownload(id);
  };

  const handleClearCompleted = () => {
    DownloadManager.clearCompleted();
  };

  const handleOpenFolder = async () => {
    try {
      await DownloadManager.openDownloadFolder();
    } catch (error) {
      console.error("Failed to open download folder:", error);
    }
  };

  const handleOpenFile = async (download: DownloadProgress) => {
    try {
      await DownloadManager.openFile(download);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const getStatusIcon = (status: DownloadProgress["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "downloading":
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: DownloadProgress["status"]) => {
    const variants = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      downloading: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      completed: "bg-green-500/10 text-green-600 dark:text-green-400",
      error: "bg-red-500/10 text-red-600 dark:text-red-400",
      cancelled: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (downloads.length === 0) {
    return null;
  }

  const stats = DownloadManager.getStats();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Downloads
            {stats.downloading > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                {stats.downloading} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFolder}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Open Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCompleted}
              disabled={stats.completed === 0 && stats.error === 0}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Completed
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {stats.total}</span>
          <span>Completed: {stats.completed}</span>
          <span>Downloading: {stats.downloading}</span>
          <span>Errors: {stats.error}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {downloads.map((download) => (
          <div
            key={download.id}
            className="border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(download.status)}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {download.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {download.savedPath || download.filePath}
                  </p>
                  {download.fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {DownloadManager.formatBytes(download.fileSize)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(download.status)}
                {download.status === "downloading" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(download.id)}
                    className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {download.status === "completed" && download.savedPath && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenFile(download)}
                    className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    title="Open file"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                {(download.status === "completed" ||
                  download.status === "error" ||
                  download.status === "cancelled") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(download.id)}
                    className="h-6 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Remove from list"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {download.status === "downloading" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {DownloadManager.formatBytes(download.downloadedBytes)} /{" "}
                    {DownloadManager.formatBytes(download.totalBytes)}
                  </span>
                  <span>{Math.round(download.progress)}%</span>
                </div>
                <Progress value={download.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{DownloadManager.formatSpeed(download.speed)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {DownloadManager.formatTimeRemaining(
                          download.timeRemaining
                        )}
                      </span>
                    </div>
                  </div>
                  <span>
                    {DownloadManager.formatBytes(
                      download.totalBytes - download.downloadedBytes
                    )}{" "}
                    remaining
                  </span>
                </div>
              </div>
            )}

            {download.status === "error" && download.error && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                Error: {download.error}
              </div>
            )}

            {download.status === "completed" && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <div className="flex items-center justify-between">
                  <span>Download completed successfully</span>
                  {download.savedPath && (
                    <span className="text-green-700 dark:text-green-300 font-mono">
                      Saved to: {download.savedPath}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
