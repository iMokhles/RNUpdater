import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Check,
  Download,
  File,
} from "lucide-react";
import { ReactNativeDiff, DiffFile } from "../lib/services/diff-service";
import { DownloadManager } from "../lib/services/download-manager";

interface DiffViewerProps {
  diff: ReactNativeDiff;
  isLoading?: boolean;
}

export function DiffViewer({ diff, isLoading }: DiffViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const toggleFile = (filePath: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filePath)) {
      newExpanded.delete(filePath);
    } else {
      newExpanded.add(filePath);
    }
    setExpandedFiles(newExpanded);
  };

  const copyToClipboard = async (content: string, filePath: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(filePath);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleDownload = async (file: DiffFile) => {
    if (!file.downloadUrl) return;

    try {
      await DownloadManager.startDownload(
        file.downloadUrl,
        file.fileName || file.path.split("/").pop() || "download",
        file.path,
        {
          onProgress: (progress) => {
            console.log(
              `Download progress for ${file.path}: ${progress.progress}%`
            );
          },
          onComplete: (progress) => {
            console.log(`Download completed for ${file.path}`);
          },
          onError: (progress) => {
            console.error(`Download failed for ${file.path}:`, progress.error);
          },
        }
      );
    } catch (error) {
      console.error("Failed to start download:", error);
    }
  };

  const getFileIcon = (status: DiffFile["status"]) => {
    switch (status) {
      case "added":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "modified":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "binary":
        return <File className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: DiffFile["status"]) => {
    const variants = {
      added: "bg-green-500/10 text-green-600 dark:text-green-400",
      deleted: "bg-red-500/10 text-red-600 dark:text-red-400",
      modified: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      binary: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const renderDiffContent = (file: DiffFile) => {
    // Handle binary files differently
    if (file.isBinary) {
      return (
        <div className="bg-muted rounded-md overflow-hidden">
          <div className="p-3 bg-muted/50 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-muted-foreground">
                {file.path}
              </span>
              <div className="flex gap-2">
                {file.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    className="h-6 px-2 text-purple-600 hover:text-purple-700"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(file.downloadUrl || "", file.path)
                  }
                  className="h-6 px-2"
                >
                  {copiedFile === file.path ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 text-center">
            <File className="h-12 w-12 mx-auto mb-3 text-purple-500 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">
              Binary file detected
            </p>
            <p className="text-xs text-muted-foreground">
              This file contains binary data and cannot be displayed as text.
              {file.downloadUrl && " Click Download to get the file."}
            </p>
            {file.downloadUrl && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Binary File
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Handle text files normally
    const lines = file.content.split("\n");
    return (
      <div className="bg-muted rounded-md overflow-hidden">
        <div className="p-3 bg-muted/50 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-muted-foreground">
              {file.path}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(file.content, file.path)}
              className="h-6 px-2"
            >
              {copiedFile === file.path ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <pre className="text-xs font-mono p-3 leading-relaxed">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              let className = "block";

              if (line.startsWith("+")) {
                className +=
                  " text-green-600 dark:text-green-400 bg-green-500/5";
              } else if (line.startsWith("-")) {
                className += " text-red-600 dark:text-red-400 bg-red-500/5";
              } else if (line.startsWith("@@")) {
                className +=
                  " text-blue-600 dark:text-blue-400 bg-blue-500/5 font-semibold";
              } else if (
                line.startsWith("diff --git") ||
                line.startsWith("index ") ||
                line.startsWith("---") ||
                line.startsWith("+++")
              ) {
                className += " text-muted-foreground bg-muted/50";
              }

              return (
                <div key={index} className={className}>
                  <span className="inline-block w-12 text-right text-muted-foreground mr-4 select-none">
                    {lineNumber}
                  </span>
                  <span className="whitespace-pre-wrap">{line}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading diff...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          React Native Diff
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            From:{" "}
            <span className="font-mono font-semibold">{diff.fromVersion}</span>
          </span>
          <span>→</span>
          <span>
            To:{" "}
            <span className="font-mono font-semibold">{diff.toVersion}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="secondary"
            className="bg-green-500/10 text-green-600 dark:text-green-400"
          >
            +{diff.summary.added} added
          </Badge>
          <Badge
            variant="secondary"
            className="bg-red-500/10 text-red-600 dark:text-red-400"
          >
            -{diff.summary.deleted} deleted
          </Badge>
          <Badge
            variant="secondary"
            className="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          >
            ~{diff.summary.modified} modified
          </Badge>
          {diff.summary.binary > 0 && (
            <Badge
              variant="secondary"
              className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
            >
              📦{diff.summary.binary} binary
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {diff.files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No changes found between these versions.</p>
          </div>
        ) : (
          diff.files.map((file) => (
            <div
              key={file.path}
              className="border border-border rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleFile(file.path)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {expandedFiles.has(file.path) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  {getFileIcon(file.status)}
                  <span className="font-mono text-sm truncate">
                    {file.path}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(file.status)}
                </div>
              </div>
              {expandedFiles.has(file.path) && (
                <div className="border-t border-border">
                  {renderDiffContent(file)}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
