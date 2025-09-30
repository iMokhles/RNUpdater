import { useEffect } from "react";
import { useAppStore } from "../lib/stores/app-store";
import { useThemeStore } from "../lib/stores/theme-store";
import { Button } from "../components/ui/button-css-modules";
import { Card } from "../components/ui/card-css-modules";
import { ProjectSelector } from "../components/project-selector";
import { ProjectInfo } from "../components/project-info";
import { VersionSelector } from "../components/version-selector";
import { ThemeSwitcher } from "../components/theme-switcher";
import { ThemeCustomizer } from "../components/theme-customizer";
import { DownloadProgressComponent } from "../components/download-progress";
import styles from "./main.module.css";

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
      <div className={styles.mainContainer}>
        <div className={styles.contentContainer}>
          <div className={styles.container}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="loading-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.contentContainer}>
        <div className={styles.container}>
          <div className={styles.maxWidth4xl}>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <h1 className={styles.title}>RNUpdater</h1>
                <p className={styles.subtitle}>
                  A powerful tool for updating React Native applications
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Theme: {theme} | Effective: {getEffectiveTheme()}
                </div>
              </div>
              <div className={styles.headerRight}>
                <ThemeSwitcher />
                <ThemeCustomizer />
              </div>
            </div>

            {error && (
              <div className={styles.errorContainer}>
                <Card variant="error" padding="md">
                  <p className="text-destructive">{error}</p>
                </Card>
              </div>
            )}

            {!currentProject ? (
              <div className={styles.projectSelection}>
                <h2 className={styles.projectSelectionTitle}>
                  Select a Project
                </h2>
                <p className={styles.projectSelectionDescription}>
                  Choose a React Native project to analyze and upgrade to the
                  latest version.
                </p>
                <div className={styles.projectGrid}>
                  <ProjectSelector />
                </div>
              </div>
            ) : (
              <div className={styles.projectContent}>
                <div className={styles.projectGrid}>
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
    </div>
  );
}
