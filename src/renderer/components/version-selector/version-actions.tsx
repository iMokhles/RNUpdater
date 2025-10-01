import { FileDiff, Loader2, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface VersionActionsProps {
  selectedVersion: string;
  currentVersion: string;
  isDiffLoading: boolean;
  hasDiffContent: boolean;
  onShowDiff: () => void;
  onUpgrade: () => void;
  onPackageUpdate: () => void;
  onMajorVersionUpdate?: () => void;
}

export function VersionActions({
  selectedVersion,
  currentVersion,
  isDiffLoading,
  hasDiffContent,
  onShowDiff,
  onUpgrade,
  onPackageUpdate,
  onMajorVersionUpdate,
}: VersionActionsProps) {
  const isMajorUpdate = () => {
    const current = parseVersion(currentVersion);
    const selected = parseVersion(selectedVersion);

    // For React Native, major updates are when the minor version changes significantly
    // e.g., 0.79.x -> 0.80.x is considered a major update
    if (current.major === selected.major && current.major === 0) {
      return selected.minor > current.minor;
    }

    // Traditional major version updates (1.x -> 2.x, etc.)
    return selected.major > current.major;
  };

  const parseVersion = (version: string) => {
    const parts = version.split(".").map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  };
  return (
    <div className="mt-4 p-4 theme-bg-muted rounded-lg border theme-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold theme-text">
            Selected: {selectedVersion}
          </p>
          <p className="text-sm theme-text-muted">
            Ready to upgrade from {currentVersion}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={onShowDiff}
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
          <Button
            size="sm"
            variant="outline"
            onClick={onPackageUpdate}
            disabled={!hasDiffContent}
            className="flex items-center gap-2"
          >
            <FileDiff className="h-4 w-4" />
            Update Packages
          </Button>
          {isMajorUpdate() && onMajorVersionUpdate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMajorVersionUpdate}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Major Update
              <Badge variant="destructive" className="ml-1 text-xs">
                Complex
              </Badge>
            </Button>
          )}
          <Button
            size="sm"
            className="theme-primary-bg hover:opacity-90 text-white"
            onClick={onUpgrade}
          >
            Upgrade Now
            {isMajorUpdate() && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Major
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
