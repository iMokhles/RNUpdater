import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => "light" | "dark";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  setTheme: (theme) => {
    set({ theme });
    // Save to localStorage
    localStorage.setItem("rn-updater-theme", theme);
  },
  getEffectiveTheme: () => {
    const { theme } = get();
    if (theme === "system") {
      // Ensure window.matchMedia is available and properly initialized
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      // Fallback to light theme if matchMedia is not available
      return "light";
    }
    return theme;
  },
}));

// Initialize theme from localStorage on store creation
// Only run this in the browser environment
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("rn-updater-theme") as Theme;
  if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
    useThemeStore.setState({ theme: savedTheme });
  }
}
