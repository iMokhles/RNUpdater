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
            className="bg-blue-600 hover:bg-blue-700"
            onClick={onUpgrade}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
