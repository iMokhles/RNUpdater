import { Download, List, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { VersionList } from "./version-list";
import { VersionListLoadMore } from "./version-list-load-more";
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

type ViewMode = "pagination" | "load-more";

export function VersionSelector({
  releases,
  currentVersion,
  onVersionSelect,
  onUpgrade,
}: VersionSelectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("pagination");
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Available Updates
            </CardTitle>
            <CardDescription>
              Current version:{" "}
              <span className="font-mono font-semibold">{currentVersion}</span>
            </CardDescription>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex view-mode-toggle">
              <Button
                variant={viewMode === "pagination" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("pagination")}
                className="rounded-r-none"
              >
                <List className="h-4 w-4 mr-1" />
                Pages
              </Button>
              <Button
                variant={viewMode === "load-more" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("load-more")}
                className="rounded-l-none"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Load More
              </Button>
            </div>
          </div>
        </div>
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
        {viewMode === "pagination" ? (
          <VersionList
            releases={releases}
            selectedVersion={viewModel.selectedVersion}
            onVersionSelect={viewModel.selectVersion}
          />
        ) : (
          <VersionListLoadMore
            releases={releases}
            selectedVersion={viewModel.selectedVersion}
            onVersionSelect={viewModel.selectVersion}
          />
        )}

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
