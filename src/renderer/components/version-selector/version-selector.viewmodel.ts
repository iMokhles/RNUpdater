import { useState } from "react";
import { useAppStore } from "../../lib/stores/app-store";
import { DiffService } from "../../lib/services/diff-service";
import type { RNRelease } from "shared/types";

export interface VersionSelectorViewModel {
  // State
  selectedVersion: string | null;
  showDiff: boolean;
  error: string | null;
  selectedDiff: any;
  isDiffLoading: boolean;

  // Actions
  selectVersion: (version: string) => void;
  showVersionDiff: () => Promise<void>;
  clearSelection: () => void;
  clearError: () => void;
}

export function useVersionSelectorViewModel(
  currentVersion: string,
  onVersionSelect?: (version: string) => void
): VersionSelectorViewModel {
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

  const selectVersion = (version: string) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
    setShowDiff(false);
    setSelectedDiff(null);
  };

  const showVersionDiff = async () => {
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

  const clearSelection = () => {
    setSelectedVersion(null);
    setShowDiff(false);
    setSelectedDiff(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // State
    selectedVersion,
    showDiff,
    error,
    selectedDiff,
    isDiffLoading,

    // Actions
    selectVersion,
    showVersionDiff,
    clearSelection,
    clearError,
  };
}
