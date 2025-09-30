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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full bg-background text-foreground"
      style={{
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                RNUpdater
              </h1>
              <p className="text-muted-foreground">
                A powerful tool for updating React Native applications
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Theme: {theme} | Effective: {getEffectiveTheme()}
              </div>
            </div>
            <ThemeSwitcher />
          </header>

          {error && (
            <Card className="error-card mb-6 p-4 bg-destructive/10 border-destructive/20">
              <p className="text-destructive">{error}</p>
            </Card>
          )}

          {!currentProject ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="space-y-6">
                <ProjectSelector />
              </div>
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-card-foreground mb-4">
                    App Information
                  </h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-mono text-sm text-foreground">
                        {version}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform:</span>
                      <span className="font-mono text-sm capitalize text-foreground">
                        {platform}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProjectInfo />
                <VersionSelector
                  releases={projectAnalysis?.availableReleases || []}
                  currentVersion={currentProject.reactNativeVersion}
                />
              </div>
              <DownloadProgressComponent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
