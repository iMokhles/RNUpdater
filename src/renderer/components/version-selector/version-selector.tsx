import { Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { VersionList } from "./version-list";
import { VersionActions } from "./version-actions";
import { VersionEmpty } from "./version-empty";
import { VersionError } from "./version-error";
import { DiffViewer } from "../diff-viewer";
import { useVersionSelectorViewModel } from "./version-selector.viewmodel";
import type { RNRelease } from "shared/types";

interface VersionSelectorProps {
  releases: RNRelease[];
  currentVersion: string;
  onVersionSelect?: (version: string) => void;
  onUpgrade?: (version: string) => void;
}

export function VersionSelector({
  releases,
  currentVersion,
  onVersionSelect,
  onUpgrade,
}: VersionSelectorProps) {
  const viewModel = useVersionSelectorViewModel(
    currentVersion,
    onVersionSelect
  );

  const handleUpgrade = () => {
    if (viewModel.selectedVersion) {
      onUpgrade?.(viewModel.selectedVersion);
    }
  };

  // Show empty state if no releases
  if (releases.length === 0) {
    return <VersionEmpty />;
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
        {/* Error Display */}
        {viewModel.error && (
          <VersionError
            error={viewModel.error}
            onDismiss={viewModel.clearError}
          />
        )}

        {/* Version List */}
        <VersionList
          releases={releases}
          selectedVersion={viewModel.selectedVersion}
          onVersionSelect={viewModel.selectVersion}
        />

        {/* Selected Version Actions */}
        {viewModel.selectedVersion && (
          <VersionActions
            selectedVersion={viewModel.selectedVersion}
            currentVersion={currentVersion}
            isDiffLoading={viewModel.isDiffLoading}
            onShowDiff={viewModel.showVersionDiff}
            onUpgrade={handleUpgrade}
          />
        )}

        {/* Diff Viewer */}
        {viewModel.showDiff && viewModel.selectedDiff && (
          <div className="mt-4">
            <DiffViewer
              diff={viewModel.selectedDiff}
              isLoading={viewModel.isDiffLoading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
