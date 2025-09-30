import { useState, useEffect } from "react";
import { VersionItem } from "./version-item";
import { PaginationControls } from "./pagination-controls";
import type { RNRelease } from "shared/types";

interface VersionListProps {
  releases: RNRelease[];
  selectedVersion: string | null;
  onVersionSelect: (version: string) => void;
  itemsPerPage?: number;
  showPagination?: boolean;
}

export function VersionList({
  releases,
  selectedVersion,
  onVersionSelect,
  itemsPerPage: initialItemsPerPage = 20,
  showPagination = true,
}: VersionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Reset to first page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Calculate pagination
  const totalPages = Math.ceil(releases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayReleases = releases.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of list when page changes
    const listElement = document.querySelector(".version-list-container");
    if (listElement) {
      listElement.scrollTop = 0;
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  return (
    <div className="space-y-4">
      {/* Version List */}
      <div className="space-y-2 max-h-96 overflow-y-auto version-list-container">
        {displayReleases.map((release) => (
          <VersionItem
            key={release.version}
            release={release}
            isSelected={selectedVersion === release.version}
            onSelect={onVersionSelect}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {showPagination && releases.length > 0 && (
        <div className="pagination-controls">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={releases.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}
