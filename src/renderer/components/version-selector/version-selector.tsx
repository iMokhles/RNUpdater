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
import { PackageUpdateSelector } from "../package-updater/package-update-selector";
import { useVersionSelectorViewModel } from "./version-selector.viewmodel";
import { useAppStore } from "../../lib/stores/app-store";
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
  const [showPackageUpdater, setShowPackageUpdater] = useState(false);
  const { currentProject } = useAppStore();
  const viewModel = useVersionSelectorViewModel(
    currentVersion,
    onVersionSelect
  );

  const handleUpgrade = () => {
    if (viewModel.selectedVersion) {
      onUpgrade?.(viewModel.selectedVersion);
    }
  };

  const handlePackageUpdate = () => {
    // Check if diff content is available
    if (!viewModel.selectedDiff) {
      // You could show a toast or alert here
      console.warn("No diff content available. Please view changes first.");
      return;
    }
    setShowPackageUpdater(true);
  };

  const handleApplyPackageUpdates = async (updates: any[]) => {
    try {
      if (!currentProject?.path || !viewModel.selectedVersion) return;

      const result = await window.App.applyPackageUpdates(
        currentProject.path,
        updates
      );
      if (result.success) {
        // Show success message or refresh project info
        console.log(
          "Package updates applied successfully:",
          result.updatedPackages
        );
        setShowPackageUpdater(false);
        // You might want to refresh the project analysis here
      } else {
        console.error("Failed to apply package updates:", result.error);
      }
    } catch (error) {
      console.error("Error applying package updates:", error);
    }
  };

  const handleCancelPackageUpdate = () => {
    setShowPackageUpdater(false);
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
            hasDiffContent={!!viewModel.selectedDiff}
            onShowDiff={viewModel.showVersionDiff}
            onUpgrade={handleUpgrade}
            onPackageUpdate={handlePackageUpdate}
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

        {/* Package Update Selector Modal */}
        {showPackageUpdater && currentProject && viewModel.selectedVersion && (
          <div className="fixed inset-0 bg-background backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="bg-background rounded-lg shadow-2xl border">
                <PackageUpdateSelector
                  projectPath={currentProject.path}
                  targetRNVersion={viewModel.selectedVersion}
                  diffContent={viewModel.selectedDiff}
                  onApplyUpdates={handleApplyPackageUpdates}
                  onCancel={handleCancelPackageUpdate}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
