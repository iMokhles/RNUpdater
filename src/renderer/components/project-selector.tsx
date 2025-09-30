import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { FolderOpen, Package, Smartphone } from "lucide-react";
import { useAppStore } from "../lib/stores/app-store";
import { ProjectService } from "../lib/services/project-service";
import { ReleasesService } from "../lib/services/releases-service";

export function ProjectSelector() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    setLoading,
    setError,
    addProject,
    setCurrentProject,
    setAvailableReleases,
    setProjectAnalysis,
    clearError,
  } = useAppStore();

  const handleSelectProject = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      clearError();

      // Select project folder
      const projectPath = await ProjectService.selectProjectFolder();
      if (!projectPath) {
        return;
      }

      // Analyze the project
      const project = await ProjectService.analyzeProject(projectPath);

      // Fetch available releases
      const releases = await ReleasesService.fetchReleases();
      const releasesAfterCurrent =
        await ReleasesService.getReleasesAfterVersion(
          project.reactNativeVersion
        );

      // Create project analysis
      const analysis = {
        currentVersion: project.reactNativeVersion,
        availableReleases: releasesAfterCurrent,
        recommendedVersion: releasesAfterCurrent.find((r) => r.isStable)
          ?.version,
        upgradePath: releasesAfterCurrent.slice(0, 5).map((r) => r.version), // Show next 5 versions
      };

      // Update store
      addProject(project);
      setCurrentProject(project);
      setAvailableReleases(releases);
      setProjectAnalysis(analysis);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load project";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Select React Native Project
        </CardTitle>
        <CardDescription>
          Choose a React Native project folder to analyze and update
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSelectProject}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Loading..." : "Select Project Folder"}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4" />
            The app will read your package.json to detect React Native version
          </p>
          <p className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Compatible with iOS, Android, and cross-platform projects
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
