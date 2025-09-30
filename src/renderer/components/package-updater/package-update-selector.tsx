import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  PackageUpdaterService,
  PackageUpdate,
} from "../../lib/services/package-updater-service";
import { Package, CheckCircle, AlertCircle, Download } from "lucide-react";

interface PackageUpdateSelectorProps {
  projectPath: string;
  targetRNVersion: string;
  diffContent?: string;
  onApplyUpdates: (updates: PackageUpdate[]) => void;
  onCancel: () => void;
}

export function PackageUpdateSelector({
  projectPath,
  targetRNVersion,
  diffContent,
  onApplyUpdates,
  onCancel,
}: PackageUpdateSelectorProps) {
  const [updates, setUpdates] = useState<PackageUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackageUpdates();
  }, [projectPath, targetRNVersion, diffContent]);

  const loadPackageUpdates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if diff content is available
      if (!diffContent) {
        setError(
          "No diff content available. Please view the changes first by clicking 'View Changes' button."
        );
        return;
      }

      const packageUpdates = await PackageUpdaterService.analyzePackageUpdates(
        projectPath,
        targetRNVersion,
        diffContent
      );
      setUpdates(packageUpdates);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load package updates"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUpdate = (index: number) => {
    const newUpdates = [...updates];
    newUpdates[index].selected = !newUpdates[index].selected;
    setUpdates(newUpdates);
  };

  const handleSelectAll = () => {
    const newUpdates = updates.map((update) => ({ ...update, selected: true }));
    setUpdates(newUpdates);
  };

  const handleDeselectAll = () => {
    const newUpdates = updates.map((update) => ({
      ...update,
      selected: false,
    }));
    setUpdates(newUpdates);
  };

  const handleApplyUpdates = () => {
    const selectedUpdates = updates.filter((update) => update.selected);
    onApplyUpdates(selectedUpdates);
  };

  const selectedCount = updates.filter((update) => update.selected).length;
  const totalCount = updates.length;

  if (loading) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Analyzing package updates...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            {error?.includes("No diff content available") ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To update packages, you need to view the changes first.
                </p>
                <Button onClick={onCancel} variant="outline">
                  Close
                </Button>
              </div>
            ) : (
              <Button onClick={loadPackageUpdates} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card className="w-full border-0 shadow-none">
        <CardHeader className="bg-muted/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              All packages are up to date for React Native {targetRNVersion}
            </p>
            <Button onClick={onCancel} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Package Updates for React Native {targetRNVersion}
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select the packages you want to update
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              disabled={selectedCount === totalCount}
            >
              Select All
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
              disabled={selectedCount === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 py-2">
          {updates.map((update, index) => (
            <div
              key={`${update.name}-${update.type}`}
              className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors bg-card"
            >
              <Checkbox
                id={`update-${index}`}
                checked={update.selected}
                onCheckedChange={() => handleToggleUpdate(index)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {update.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {update.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{update.currentVersion}</span>
                  <span>→</span>
                  <span className="font-medium text-foreground">
                    {update.targetVersion}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t bg-muted/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {totalCount} packages selected
          </div>
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleApplyUpdates}
              disabled={selectedCount === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Apply Updates ({selectedCount})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
