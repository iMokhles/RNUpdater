import { useEffect } from "react";
import { useAppStore } from "../lib/stores/app-store";
import { useThemeStore } from "../lib/stores/theme-store";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ProjectSelector } from "../components/project-selector";
import { ProjectInfo } from "../components/project-info";
import { VersionSelector } from "../components/version-selector";
import { ThemeSwitcher } from "../components/theme-switcher";
import { DownloadProgressComponent } from "../components/download-progress";
import { Link } from "react-router-dom";
import { Settings, ExternalLink } from "lucide-react";

export function MainScreen() {
  const {
    version,
    platform,
    isLoading,
    error,
    currentProject,
    projectAnalysis,
    setVersion,
    setPlatform,
    setLoading,
    setError,
  } = useAppStore();

  const { getEffectiveTheme, theme } = useThemeStore();

  // Debug theme state
  console.log("Current theme:", theme);
  console.log("Document root classes:", document.documentElement.className);
  console.log(
    "Document root data-theme:",
    document.documentElement.getAttribute("data-theme")
  );

  const handleUpgrade = (version: string) => {
    console.log("Upgrading to version:", version);
    // For now, show a message that the upgrade will be handled by the version selector
    console.log(
      `Upgrade to version ${version} will be handled by the version selector`
    );
  };

  useEffect(() => {
    const loadAppInfo = async () => {
      setLoading(true);
      try {
        // Debug: Log what's available on window
        console.log("Window object:", window);
        console.log("Window.App:", window.App);
        console.log("Available window properties:", Object.keys(window));

        // Check if window.App is available
        if (!window.App) {
          throw new Error(
            "App API not available. Please restart the application."
          );
        }

        const [appVersion, appPlatform] = await Promise.all([
          window.App.getVersion(),
          window.App.getPlatform(),
        ]);
        setVersion(appVersion);
        setPlatform(appPlatform);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load app info"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppInfo();
  }, [setVersion, setPlatform, setLoading, setError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="loading-spinner animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
                <p className="text-lg text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 pb-6 border-b border-border flex-wrap">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-foreground">
                  RNUpdater
                </h1>
                <p className="text-lg text-muted-foreground">
                  A powerful tool for updating React Native applications
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Theme: {theme} | Effective: {getEffectiveTheme()}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <ThemeSwitcher />
              </div>
            </div>

            {error && (
              <div className="mb-6">
                <Card className="border-destructive bg-destructive/10 p-6">
                  <p className="text-destructive">{error}</p>
                </Card>
              </div>
            )}

            {!currentProject ? (
              <div className="text-center py-12 px-6">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Select a Project
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Choose a React Native project to analyze and upgrade to the
                  latest version.
                </p>
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <ProjectSelector />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                  <ProjectInfo />
                  <VersionSelector
                    releases={projectAnalysis?.availableReleases || []}
                    currentVersion={currentProject.reactNativeVersion}
                    onUpgrade={handleUpgrade}
                  />
                </div>
                <DownloadProgressComponent />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
