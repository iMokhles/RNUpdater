import { FileDiff, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface VersionActionsProps {
  selectedVersion: string;
  currentVersion: string;
  isDiffLoading: boolean;
  onShowDiff: () => void;
  onUpgrade: () => void;
}

export function VersionActions({
  selectedVersion,
  currentVersion,
  isDiffLoading,
  onShowDiff,
  onUpgrade,
}: VersionActionsProps) {
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
        <div className="flex gap-2">
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
            className="theme-primary-bg hover:opacity-90 text-white"
            onClick={onUpgrade}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
