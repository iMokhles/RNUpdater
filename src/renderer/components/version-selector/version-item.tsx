import { CheckCircle, AlertCircle, Code } from "lucide-react";
import { Badge } from "../ui/badge";
import type { RNRelease } from "shared/types";

interface VersionItemProps {
  release: RNRelease;
  isSelected: boolean;
  onSelect: (version: string) => void;
}

export function VersionItem({
  release,
  isSelected,
  onSelect,
}: VersionItemProps) {
  const getVersionBadge = (release: RNRelease) => {
    if (release.isStable) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          Stable
        </Badge>
      );
    }
    if (release.isReleaseCandidate) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          RC
        </Badge>
      );
    }
    if (release.isPrerelease) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          Pre
        </Badge>
      );
    }
    return null;
  };

  const getVersionIcon = (release: RNRelease) => {
    if (release.isStable) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (release.isReleaseCandidate) {
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
    return <Code className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
      onClick={() => onSelect(release.version)}
    >
      <div className="flex items-center gap-3">
        {getVersionIcon(release)}
        <span className="font-mono font-semibold">{release.version}</span>
        {getVersionBadge(release)}
      </div>
      <div className="flex items-center gap-2">
        {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
      </div>
    </div>
  );
}
