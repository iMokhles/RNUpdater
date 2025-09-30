import { CheckCircle, AlertCircle, Code } from "lucide-react";
import { Badge } from "../ui/badge";
import type { RNRelease } from "shared/types";
import { useThemeStore } from "renderer/lib/stores/theme-store";

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
        <Badge variant="default" className="theme-success-bg theme-success">
          Stable
        </Badge>
      );
    }
    if (release.isReleaseCandidate) {
      return (
        <Badge variant="secondary" className="theme-primary-bg theme-text">
          RC
        </Badge>
      );
    }
    if (release.isPrerelease) {
      return (
        <Badge variant="outline" className="theme-warning-bg theme-warning">
          Pre
        </Badge>
      );
    }
    return null;
  };

  const getVersionIcon = (release: RNRelease) => {
    if (release.isStable) {
      return <CheckCircle className="h-4 w-4 theme-success" />;
    }
    if (release.isReleaseCandidate) {
      return <AlertCircle className="h-4 w-4 theme-primary" />;
    }
    return <Code className="h-4 w-4 theme-text-muted" />;
  };

  return (
    <span
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected ? "theme-bg-muted theme-border" : "hover:theme-bg-muted"
      }`}
      onClick={() => onSelect(release.version)}
    >
      <div className="flex items-center gap-3">
        {getVersionIcon(release)}
        <span className="font-mono font-semibold">{release.version}</span>
        {getVersionBadge(release)}
      </div>
      <div className="flex items-center gap-2">
        {isSelected && <CheckCircle className="h-4 w-4 theme-primary" />}
      </div>
    </span>
  );
}
