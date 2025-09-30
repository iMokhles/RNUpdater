import { useState, useEffect, useCallback } from "react";
import { VersionItem } from "./version-item";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import type { RNRelease } from "shared/types";

interface VersionListLoadMoreProps {
  releases: RNRelease[];
  selectedVersion: string | null;
  onVersionSelect: (version: string) => void;
  initialItemsToShow?: number;
  itemsToLoadMore?: number;
}

export function VersionListLoadMore({
  releases,
  selectedVersion,
  onVersionSelect,
  initialItemsToShow = 10,
  itemsToLoadMore = 10,
}: VersionListLoadMoreProps) {
  const [visibleCount, setVisibleCount] = useState(initialItemsToShow);
  const [isLoading, setIsLoading] = useState(false);

  const displayReleases = releases.slice(0, visibleCount);
  const hasMore = visibleCount < releases.length;
  const remainingCount = releases.length - visibleCount;

  const handleLoadMore = useCallback(async () => {
    setIsLoading(true);

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setVisibleCount((prev) =>
      Math.min(prev + itemsToLoadMore, releases.length)
    );
    setIsLoading(false);
  }, [itemsToLoadMore, releases.length]);

  // Reset visible count when releases change
  useEffect(() => {
    setVisibleCount(initialItemsToShow);
  }, [releases, initialItemsToShow]);

  // Auto-scroll to show new items when loading more
  useEffect(() => {
    if (visibleCount > initialItemsToShow) {
      const listElement = document.querySelector(
        ".version-list-load-more-container"
      );
      if (listElement) {
        // Scroll to show the newly loaded items
        const scrollPosition =
          listElement.scrollHeight - listElement.clientHeight;
        listElement.scrollTop = scrollPosition;
      }
    }
  }, [visibleCount, initialItemsToShow]);

  return (
    <div className="space-y-4">
      {/* Version List */}
      <div className="space-y-2 max-h-96 overflow-y-auto version-list-load-more-container">
        {displayReleases.map((release) => (
          <VersionItem
            key={release.version}
            release={release}
            isSelected={selectedVersion === release.version}
            onSelect={onVersionSelect}
          />
        ))}
      </div>

      {/* Load More Controls */}
      {hasMore && (
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="w-full sm:w-auto load-more-button"
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            {isLoading
              ? "Loading..."
              : `Load ${Math.min(
                  itemsToLoadMore,
                  remainingCount
                )} more versions`}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            Showing {visibleCount} of {releases.length} versions
            {remainingCount > 0 && (
              <span className="block text-xs">
                {remainingCount} more available
              </span>
            )}
          </div>
        </div>
      )}

      {/* Show all loaded message */}
      {!hasMore && releases.length > initialItemsToShow && (
        <div className="text-sm text-muted-foreground text-center py-2">
          All {releases.length} versions loaded
        </div>
      )}
    </div>
  );
}
