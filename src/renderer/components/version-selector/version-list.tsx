import { VersionItem } from "./version-item";
import type { RNRelease } from "shared/types";

interface VersionListProps {
  releases: RNRelease[];
  selectedVersion: string | null;
  onVersionSelect: (version: string) => void;
  maxItems?: number;
}

export function VersionList({
  releases,
  selectedVersion,
  onVersionSelect,
  maxItems = 20,
}: VersionListProps) {
  const displayReleases = releases.slice(0, maxItems);
  const hasMore = releases.length > maxItems;

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {displayReleases.map((release) => (
        <VersionItem
          key={release.version}
          release={release}
          isSelected={selectedVersion === release.version}
          onSelect={onVersionSelect}
        />
      ))}

      {hasMore && (
        <p className="text-sm theme-text-muted text-center py-2">
          Showing first {maxItems} versions. Total: {releases.length} available
        </p>
      )}
    </div>
  );
}
