import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Download,
  CheckCircle,
  AlertCircle,
  Code,
  FileDiff,
  Loader2,
} from "lucide-react";
import { useAppStore } from "../lib/stores/app-store";
import { DiffService } from "../lib/services/diff-service";
import { DiffViewer } from "./diff-viewer";
import type { RNRelease } from "shared/types";

interface VersionSelectorProps {
  releases: RNRelease[];
  currentVersion: string;
  onVersionSelect?: (version: string) => void;
}

export function VersionSelector({
  releases,
  currentVersion,
  onVersionSelect,
}: VersionSelectorProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const {
    error,
    selectedDiff,
    isDiffLoading,
    setSelectedDiff,
    setDiffLoading,
    setError,
  } = useAppStore();

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
  };

  const handleShowDiff = async () => {
    if (!selectedVersion) return;

    try {
      setDiffLoading(true);
      setError(null);

      const diff = await DiffService.fetchDiff(currentVersion, selectedVersion);
      setSelectedDiff(diff);
      setShowDiff(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load diff";
      setError(errorMessage);
    } finally {
      setDiffLoading(false);
    }
  };

  const getVersionBadge = (release: RNRelease) => {
    if (release.isStable) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          Stable
        </Badge>
      );
    }
    if (release.isReleaseCandidate) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          RC
        </Badge>
      );
    }
    if (release.isPrerelease) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          Pre
        </Badge>
      );
    }
    return null;
  };

  const getVersionIcon = (release: RNRelease) => {
    if (release.isStable) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (release.isReleaseCandidate) {
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
    return <Code className="h-4 w-4 text-gray-600" />;
  };

  if (releases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Updates</CardTitle>
          <CardDescription>
            React Native versions available for upgrade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No newer versions available. Your project is up to date!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Available Updates
        </CardTitle>
        <CardDescription>
          Current version:{" "}
          <span className="font-mono font-semibold">{currentVersion}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {releases.slice(0, 20).map((release) => (
            <div
              key={release.version}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedVersion === release.version
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => handleVersionSelect(release.version)}
            >
              <div className="flex items-center gap-3">
                {getVersionIcon(release)}
                <span className="font-mono font-semibold">
                  {release.version}
                </span>
                {getVersionBadge(release)}
              </div>
              <div className="flex items-center gap-2">
                {selectedVersion === release.version && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedVersion && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Selected: {selectedVersion}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ready to upgrade from {currentVersion}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShowDiff}
                  disabled={isDiffLoading}
                  className="flex items-center gap-2"
                >
                  {isDiffLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDiff className="h-4 w-4" />
                  )}
                  {isDiffLoading ? "Loading..." : "View Changes"}
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDiff && selectedDiff && (
          <div className="mt-4">
            <DiffViewer diff={selectedDiff} isLoading={isDiffLoading} />
          </div>
        )}

        {releases.length > 20 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Showing first 20 versions. Total: {releases.length} available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
