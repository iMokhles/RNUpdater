import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Alert } from "../ui/alert";
import {
  PackageUpdaterService,
  type MajorVersionUpdateResult,
} from "../../lib/services/package-updater-service";
import { MigrationScriptGenerator } from "../../lib/services/migration-script-generator";
import {
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Code,
  Settings,
  Database,
} from "lucide-react";

interface MajorVersionUpdaterProps {
  projectPath: string;
  fromVersion: string;
  toVersion: string;
  onUpdateComplete?: (result: {
    success: boolean;
    appliedSteps: string[];
    errors: string[];
  }) => void;
}

export function MajorVersionUpdater({
  projectPath,
  fromVersion,
  toVersion,
  onUpdateComplete,
}: MajorVersionUpdaterProps) {
  const [updateResult, setUpdateResult] =
    useState<MajorVersionUpdateResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [migrationScript, setMigrationScript] = useState<string>("");
  const [showMigrationScript, setShowMigrationScript] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeUpdate();
  }, [projectPath, fromVersion, toVersion]);

  const analyzeUpdate = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await PackageUpdaterService.analyzeMajorVersionUpdate(
        projectPath,
        fromVersion,
        toVersion
      );

      setUpdateResult(result);

      // Generate migration script
      if (result.success) {
        const script = MigrationScriptGenerator.generateDetailedSteps({
          fromVersion,
          toVersion,
          complexChanges: result.complexChanges.map((change) => ({
            id: `${change.type}_${change.filePath.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}`,
            type: change.type as any,
            filePath: change.filePath,
            description: change.description,
            severity: change.severity as any,
            requiresMigration: true,
          })),
          packageUpdates: result.packageUpdates,
          migrationSteps: result.migrationSteps.map((step) => ({
            id: `step_${step.order}`,
            description: step.description,
            type: step.type as any,
            dependencies: [],
            order: step.order,
          })),
          estimatedRisk: result.estimatedRisk as any,
          requiresManualReview: result.requiresManualReview,
          breakingChangesCount: result.breakingChangesCount,
        });
        setMigrationScript(script);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze update");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyUpdate = async () => {
    if (!updateResult) return;

    setIsApplying(true);
    setError(null);

    try {
      const result = await PackageUpdaterService.applyMajorVersionUpdate(
        projectPath,
        fromVersion,
        toVersion
      );

      onUpdateComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply update");
    } finally {
      setIsApplying(false);
    }
  };

  const toggleStep = (stepId: string) => {
    const newSelected = new Set(selectedSteps);
    if (newSelected.has(stepId)) {
      newSelected.delete(stepId);
    } else {
      newSelected.add(stepId);
    }
    setSelectedSteps(newSelected);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "configuration":
        return <Settings className="w-4 h-4" />;
      case "source_code":
        return <Code className="w-4 h-4" />;
      case "native_code":
        return <Database className="w-4 h-4" />;
      case "gradle":
        return <Settings className="w-4 h-4" />;
      case "binary":
        return <Download className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="text-lg font-semibold">
              Analyzing Major Version Update
            </h3>
            <p className="text-gray-600">
              Analyzing changes from {fromVersion} to {toVersion}...
            </p>
          </div>
        </div>
        <Progress value={50} className="mt-4" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Analysis Failed</h3>
            <p>{error}</p>
            <Button onClick={analyzeUpdate} className="mt-2">
              Retry Analysis
            </Button>
          </div>
        </Alert>
      </Card>
    );
  }

  if (!updateResult) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Update Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Major Version Update</h2>
          <div className="flex items-center space-x-2">
            <Badge variant={getRiskColor(updateResult.estimatedRisk)}>
              {updateResult.estimatedRisk.toUpperCase()} RISK
            </Badge>
            {updateResult.requiresManualReview && (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                MANUAL REVIEW
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {updateResult.packageUpdates.length}
            </div>
            <div className="text-sm text-gray-600">Package Updates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {updateResult.complexChanges.length}
            </div>
            <div className="text-sm text-gray-600">Complex Changes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {updateResult.breakingChangesCount}
            </div>
            <div className="text-sm text-gray-600">Breaking Changes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {updateResult.migrationSteps.length}
            </div>
            <div className="text-sm text-gray-600">Migration Steps</div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={applyUpdate}
            disabled={isApplying}
            className="flex-1"
          >
            {isApplying ? "Applying Update..." : "Apply Update"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowMigrationScript(!showMigrationScript)}
          >
            <FileText className="w-4 h-4 mr-2" />
            {showMigrationScript ? "Hide" : "Show"} Migration Script
          </Button>
        </div>
      </Card>

      {/* Package Updates */}
      {updateResult.packageUpdates.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Package Updates</h3>
          <div className="space-y-2">
            {updateResult.packageUpdates.map((update, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{update.name}</div>
                  <div className="text-sm text-gray-600">{update.type}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {update.currentVersion}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {update.targetVersion}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Complex Changes */}
      {updateResult.complexChanges.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Complex Changes</h3>
          <div className="space-y-3">
            {updateResult.complexChanges.map((change, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  {getChangeIcon(change.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">
                      {change.filePath}
                    </span>
                    <Badge
                      variant={getSeverityColor(change.severity)}
                      size="sm"
                    >
                      {change.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{change.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Migration Steps */}
      {updateResult.migrationSteps.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Migration Steps</h3>
          <div className="space-y-3">
            {updateResult.migrationSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {step.order}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{step.description}</span>
                    <Badge variant="outline" size="sm">
                      {step.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Migration Script */}
      {showMigrationScript && migrationScript && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Migration Script</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">{migrationScript}</pre>
          </div>
        </Card>
      )}
    </div>
  );
}
