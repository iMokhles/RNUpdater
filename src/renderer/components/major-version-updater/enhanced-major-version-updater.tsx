import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Alert } from "../ui/alert";
import { Checkbox } from "../ui/checkbox";
import {
  PackageUpdaterService,
  type MajorVersionUpdateResult,
} from "../../lib/services/package-updater-service";
import { MigrationScriptGenerator } from "../../lib/services/migration-script-generator";
import { ComplexChangeApplier } from "../../lib/services/complex-change-applier";
import { BackupService } from "../../lib/services/backup-service";
import { ModalCloseButton } from "../ui/modal-close-button";
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
  Package,
  Wrench,
  FileCode,
  Play,
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

type TabType = "overview" | "packages" | "complex" | "migration";

export function EnhancedMajorVersionUpdater({
  projectPath,
  fromVersion,
  toVersion,
  onUpdateComplete,
}: MajorVersionUpdaterProps) {
  const [updateResult, setUpdateResult] =
    useState<MajorVersionUpdateResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplyingPackages, setIsApplyingPackages] = useState(false);
  const [isApplyingComplex, setIsApplyingComplex] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<Set<number>>(
    new Set()
  );
  const [selectedComplexChanges, setSelectedComplexChanges] = useState<
    Set<number>
  >(new Set());
  const [migrationScript, setMigrationScript] = useState<string>("");
  const [showMigrationScript, setShowMigrationScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [diffContent, setDiffContent] = useState<string>("");
  const [backupInfo, setBackupInfo] = useState<any>(null);
  const [comprehensiveBackup, setComprehensiveBackup] = useState<any>(null);

  useEffect(() => {
    analyzeUpdate();
  }, [projectPath, fromVersion, toVersion]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showMigrationScript) {
          setShowMigrationScript(false);
        }
      }
    };

    if (showMigrationScript) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showMigrationScript]);

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

      // Check for backup information
      try {
        const backup = await BackupService.getPackageJsonBackupInfo(
          projectPath
        );
        setBackupInfo(backup);
      } catch (backupError) {
        console.warn("Could not check backup info:", backupError);
        setBackupInfo(null);
      }

      // Check for comprehensive backup information
      try {
        const filesToCheck = BackupService.extractFilesFromComplexChanges(
          result.complexChanges
        );
        if (filesToCheck.length > 0) {
          // Check if any of these files have backups
          const hasBackups = await Promise.all(
            filesToCheck.map(async (filePath) => {
              try {
                const fullPath = `${projectPath}/${filePath}`;
                await window.App.readFile(`${fullPath}.backup`);
                return { filePath, hasBackup: true };
              } catch {
                return { filePath, hasBackup: false };
              }
            })
          );

          const backedUpFiles = hasBackups.filter((f) => f.hasBackup);
          if (backedUpFiles.length > 0) {
            setComprehensiveBackup({
              totalFiles: filesToCheck.length,
              backedUpFiles: backedUpFiles.length,
              files: backedUpFiles,
            });
          }
        }
      } catch (comprehensiveBackupError) {
        console.warn(
          "Could not check comprehensive backup info:",
          comprehensiveBackupError
        );
        setComprehensiveBackup(null);
      }

      // Get the raw diff content for complex change application
      try {
        const { MajorVersionUpdater } = await import(
          "../../lib/services/major-version-updater"
        );
        const rawDiffText = await (MajorVersionUpdater as any).getRawDiffText(
          fromVersion,
          toVersion
        );
        setDiffContent(rawDiffText);
      } catch (diffError) {
        console.warn("Could not fetch diff content:", diffError);
        setDiffContent("");
      }

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

  const applyPackageUpdates = async () => {
    if (!updateResult) return;

    setIsApplyingPackages(true);
    setError(null);

    try {
      // Apply only selected package updates
      const selectedPackageUpdates = updateResult.packageUpdates.filter(
        (_, index) => selectedPackages.has(index)
      );

      // For now, we'll apply all package updates
      // TODO: Implement selective package update application
      const result = await PackageUpdaterService.applyMajorVersionUpdate(
        projectPath,
        fromVersion,
        toVersion
      );

      onUpdateComplete?.(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to apply package updates"
      );
    } finally {
      setIsApplyingPackages(false);
    }
  };

  const applyComplexChanges = async () => {
    if (!updateResult) return;

    setIsApplyingComplex(true);
    setError(null);

    try {
      // Apply only selected complex changes
      const selectedChanges = updateResult.complexChanges.filter((_, index) =>
        selectedComplexChanges.has(index)
      );

      console.log(
        `Applying ${selectedChanges.length} selected complex changes...`
      );

      // Use the ComplexChangeApplier to apply selected changes
      const result = await ComplexChangeApplier.applySelectedChanges(
        projectPath,
        selectedChanges,
        diffContent,
        toVersion
      );

      if (result.success) {
        console.log(
          "Complex changes applied successfully:",
          result.appliedChanges
        );

        // Call the completion callback with success
        onUpdateComplete?.({
          success: true,
          appliedSteps: result.appliedChanges.map(
            (change) => `${change.type}: ${change.filePath}`
          ),
          errors: result.errors,
        });
      } else {
        console.error("Failed to apply complex changes:", result.errors);
        setError(result.errors.join(", "));

        // Call the completion callback with failure
        onUpdateComplete?.({
          success: false,
          appliedSteps: result.appliedChanges
            .filter((change) => change.success)
            .map((change) => `${change.type}: ${change.filePath}`),
          errors: result.errors,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply complex changes";
      setError(errorMessage);

      onUpdateComplete?.({
        success: false,
        appliedSteps: [],
        errors: [errorMessage],
      });
    } finally {
      setIsApplyingComplex(false);
    }
  };

  const togglePackage = (index: number) => {
    const newSelected = new Set(selectedPackages);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPackages(newSelected);
  };

  const toggleComplexChange = (index: number) => {
    const newSelected = new Set(selectedComplexChanges);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedComplexChanges(newSelected);
  };

  const selectAllPackages = () => {
    if (!updateResult) return;
    const allIndices = updateResult.packageUpdates.map((_, index) => index);
    setSelectedPackages(new Set(allIndices));
  };

  const selectAllComplexChanges = () => {
    if (!updateResult) return;
    const allIndices = updateResult.complexChanges.map((_, index) => index);
    setSelectedComplexChanges(new Set(allIndices));
  };

  const cleanupBackup = async () => {
    try {
      const success = await BackupService.cleanupBackupAfterCommit(projectPath);
      if (success) {
        setBackupInfo(null);
        console.log("Backup cleaned up successfully");
      } else {
        console.error("Failed to cleanup backup");
      }
    } catch (error) {
      console.error("Error cleaning up backup:", error);
    }
  };

  const cleanupComprehensiveBackup = async () => {
    try {
      if (comprehensiveBackup) {
        const result = await BackupService.cleanupComprehensiveBackup(
          comprehensiveBackup
        );
        if (result.success) {
          setComprehensiveBackup(null);
          console.log(
            `Comprehensive backup cleaned up: ${result.cleanedFiles.length} files`
          );
        } else {
          console.error(
            "Failed to cleanup comprehensive backup:",
            result.errors
          );
        }
      }
    } catch (error) {
      console.error("Error cleaning up comprehensive backup:", error);
    }
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

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: FileText },
    { id: "packages" as TabType, label: "Packages", icon: Package },
    { id: "complex" as TabType, label: "Complex Changes", icon: Wrench },
    { id: "migration" as TabType, label: "Migration", icon: FileCode },
  ];

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
      {/* Tab Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 pr-12">
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-white">
                  {updateResult.packageUpdates.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-white">
                  Package Updates
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-white">
                  {updateResult.complexChanges.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-white">
                  Complex Changes
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-white">
                  {updateResult.breakingChangesCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-white">
                  Breaking Changes
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-white">
                  {updateResult.migrationSteps.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-white">
                  Migration Steps
                </div>
              </div>
            </div>

            {/* Backup Information */}
            {backupInfo && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-white mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-white">
                        Package.json Backup Detected
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-white mt-1">
                        A backup of package.json exists from a previous update.
                        The app is reading from the backup to show the original
                        state.
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-white mt-2">
                        Backup version: {backupInfo.version} | Created:{" "}
                        {new Date(backupInfo.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cleanupBackup}
                    className="text-yellow-700 dark:text-white border-yellow-300 dark:border-white hover:bg-yellow-100 dark:hover:bg-yellow-800"
                  >
                    Clean Up Backup
                  </Button>
                </div>
              </div>
            )}

            {/* Comprehensive Backup Information */}
            {comprehensiveBackup && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-white mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-800 dark:text-white">
                        Comprehensive Backup Detected
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-white mt-1">
                        Backups exist for {comprehensiveBackup.backedUpFiles}{" "}
                        out of {comprehensiveBackup.totalFiles} files that will
                        be modified. This includes JAR files, native code,
                        Gradle files, and configuration files.
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-blue-600 dark:text-white">
                          Backed up files:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {comprehensiveBackup.files
                            .slice(0, 5)
                            .map((file: any, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-white px-2 py-1 rounded"
                              >
                                {file.filePath.split("/").pop()}
                              </span>
                            ))}
                          {comprehensiveBackup.files.length > 5 && (
                            <span className="text-xs text-blue-600 dark:text-white">
                              +{comprehensiveBackup.files.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cleanupComprehensiveBackup}
                    className="text-blue-700 dark:text-white border-blue-300 dark:border-white hover:bg-blue-100 dark:hover:bg-blue-800"
                  >
                    Clean Up All Backups
                  </Button>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowMigrationScript(!showMigrationScript)}
              >
                <FileText className="w-4 h-4 mr-2" />
                {showMigrationScript ? "Hide" : "Show"} Migration Script
              </Button>
            </div>
          </div>
        )}

        {activeTab === "packages" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Package Updates</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllPackages}>
                  Select All
                </Button>
                <Button
                  onClick={applyPackageUpdates}
                  disabled={isApplyingPackages || selectedPackages.size === 0}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isApplyingPackages
                    ? "Applying..."
                    : `Apply Selected (${selectedPackages.size})`}
                </Button>
              </div>
            </div>

            {updateResult.packageUpdates.length > 0 ? (
              <div className="space-y-2">
                {updateResult.packageUpdates.map((update, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <Checkbox
                      checked={selectedPackages.has(index)}
                      onCheckedChange={() => togglePackage(index)}
                    />
                    <div className="flex-1">
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No package updates required</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "complex" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Complex Changes</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllComplexChanges}
                >
                  Select All
                </Button>
                <Button
                  onClick={applyComplexChanges}
                  disabled={
                    isApplyingComplex || selectedComplexChanges.size === 0
                  }
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isApplyingComplex
                    ? "Applying..."
                    : `Apply Selected (${selectedComplexChanges.size})`}
                </Button>
              </div>
            </div>

            {updateResult.complexChanges.length > 0 ? (
              <div className="space-y-3">
                {updateResult.complexChanges.map((change, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 border rounded-lg"
                  >
                    <Checkbox
                      checked={selectedComplexChanges.has(index)}
                      onCheckedChange={() => toggleComplexChange(index)}
                    />
                    <div className="flex-shrink-0 mt-1">
                      {getChangeIcon(change.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {change.filePath}
                        </span>
                        <Badge variant={getSeverityColor(change.severity)}>
                          {change.severity}
                        </Badge>
                        {(() => {
                          const automationStatus =
                            ComplexChangeApplier.getAutomationStatus(
                              change.type
                            );
                          return automationStatus.automated ? (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Automated
                            </Badge>
                          ) : (
                            <Badge variant="outline">Manual</Badge>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-gray-600">
                        {change.description}
                      </p>
                      {(() => {
                        const automationStatus =
                          ComplexChangeApplier.getAutomationStatus(change.type);
                        return automationStatus.automated ? (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {automationStatus.description}
                          </p>
                        ) : (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠ {automationStatus.description}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No complex changes detected</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "migration" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Migration Steps</h3>
            {updateResult.migrationSteps.length > 0 ? (
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
                        <Badge variant="outline">{step.type}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No migration steps required</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Migration Script Modal */}
      {showMigrationScript && migrationScript && (
        <div className="fixed inset-0 bg-background backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="bg-background rounded-lg shadow-2xl border relative">
              {/* Close Button */}
              <ModalCloseButton
                onClick={() => setShowMigrationScript(false)}
                ariaLabel="Close migration script"
              />
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Migration Script</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {migrationScript}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
