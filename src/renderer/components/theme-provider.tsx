import { useEffect, useState } from "react";
import { useThemeStore } from "../lib/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { getEffectiveTheme } = useThemeStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      const effectiveTheme = getEffectiveTheme();
      const root = document.documentElement;

      console.log("Updating theme to:", effectiveTheme);
      console.log("Current root classes before:", root.className);

      // Remove existing theme classes
      root.classList.remove("light", "dark");

      // Add the current theme class
      root.classList.add(effectiveTheme);

      // Update the data attribute for CSS selectors
      root.setAttribute("data-theme", effectiveTheme);

      console.log("Current root classes after:", root.className);
      console.log("Data theme attribute:", root.getAttribute("data-theme"));

      // Mark as initialized after first update
      if (!isInitialized) {
        setIsInitialized(true);
      }
    };

    // Set initial theme with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      updateTheme();
    }, 0);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Only update if theme is set to system
      const currentTheme = useThemeStore.getState().theme;
      if (currentTheme === "system") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      clearTimeout(timeoutId);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [getEffectiveTheme, isInitialized]);

  // Listen for theme changes
  useEffect(() => {
    const unsubscribe = useThemeStore.subscribe((state) => {
      console.log("Theme store changed:", state.theme);
      const effectiveTheme = state.getEffectiveTheme();
      const root = document.documentElement;

      console.log("Applying theme class:", effectiveTheme);
      root.classList.remove("light", "dark");
      root.classList.add(effectiveTheme);
      root.setAttribute("data-theme", effectiveTheme);

      console.log("Root classes after change:", root.className);
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
