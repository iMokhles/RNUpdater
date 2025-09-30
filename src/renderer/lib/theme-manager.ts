/**
 * Theme Manager for RNUpdater Design System
 * Provides comprehensive theme management with color palette customization
 */

export type ThemeMode = "light" | "dark" | "system";
export type ColorPalette =
  | "blue"
  | "purple"
  | "green"
  | "red"
  | "yellow"
  | "cyan"
  | "gray"
  | "custom";

export interface ThemeConfig {
  mode: ThemeMode;
  primaryPalette: ColorPalette;
  secondaryPalette: ColorPalette;
  accentPalette: ColorPalette;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
  };
}

export interface ColorPaletteConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export class ThemeManager {
  private static instance: ThemeManager;
  private config: ThemeConfig;
  private listeners: Set<(config: ThemeConfig) => void> = new Set();

  private constructor() {
    this.config = this.loadConfig();
    this.applyTheme();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Get current theme configuration
   */
  getConfig(): ThemeConfig {
    return { ...this.config };
  }

  /**
   * Update theme configuration
   */
  setConfig(config: Partial<ThemeConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * Set theme mode
   */
  setMode(mode: ThemeMode): void {
    this.setConfig({ mode });
  }

  /**
   * Set primary color palette
   */
  setPrimaryPalette(palette: ColorPalette): void {
    this.setConfig({ primaryPalette: palette });
  }

  /**
   * Set secondary color palette
   */
  setSecondaryPalette(palette: ColorPalette): void {
    this.setConfig({ secondaryPalette: palette });
  }

  /**
   * Set accent color palette
   */
  setAccentPalette(palette: ColorPalette): void {
    this.setConfig({ accentPalette: palette });
  }

  /**
   * Set custom colors
   */
  setCustomColors(colors: ThemeConfig["customColors"]): void {
    this.setConfig({ customColors: colors });
  }

  /**
   * Get available color palettes
   */
  getColorPalettes(): ColorPaletteConfig[] {
    return [
      {
        name: "Blue",
        primary: "hsl(221, 83%, 53%)",
        secondary: "hsl(221, 83%, 53%)",
        accent: "hsl(221, 83%, 53%)",
        description: "Professional blue theme",
      },
      {
        name: "Purple",
        primary: "hsl(262, 83%, 58%)",
        secondary: "hsl(262, 83%, 58%)",
        accent: "hsl(262, 83%, 58%)",
        description: "Creative purple theme",
      },
      {
        name: "Green",
        primary: "hsl(142, 76%, 36%)",
        secondary: "hsl(142, 76%, 36%)",
        accent: "hsl(142, 76%, 36%)",
        description: "Natural green theme",
      },
      {
        name: "Red",
        primary: "hsl(0, 84%, 60%)",
        secondary: "hsl(0, 84%, 60%)",
        accent: "hsl(0, 84%, 60%)",
        description: "Bold red theme",
      },
      {
        name: "Yellow",
        primary: "hsl(38, 92%, 50%)",
        secondary: "hsl(38, 92%, 50%)",
        accent: "hsl(38, 92%, 50%)",
        description: "Energetic yellow theme",
      },
      {
        name: "Cyan",
        primary: "hsl(188, 95%, 43%)",
        secondary: "hsl(188, 95%, 43%)",
        accent: "hsl(188, 95%, 43%)",
        description: "Fresh cyan theme",
      },
      {
        name: "Gray",
        primary: "hsl(0, 0%, 50%)",
        secondary: "hsl(0, 0%, 50%)",
        accent: "hsl(0, 0%, 50%)",
        description: "Neutral gray theme",
      },
      {
        name: "Custom",
        primary: "hsl(221, 83%, 53%)",
        secondary: "hsl(221, 83%, 53%)",
        accent: "hsl(221, 83%, 53%)",
        description: "Custom color theme",
      },
    ];
  }

  /**
   * Get effective theme mode (resolves system preference)
   */
  getEffectiveMode(): "light" | "dark" {
    if (this.config.mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return this.config.mode;
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (config: ThemeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(): void {
    const root = document.documentElement;
    const effectiveMode = this.getEffectiveMode();

    // Remove existing theme classes
    root.classList.remove("light", "dark");
    root.classList.add(effectiveMode);
    root.setAttribute("data-theme", effectiveMode);

    // Apply color palette
    this.applyColorPalette();

    // Apply custom colors if any
    if (this.config.customColors) {
      this.applyCustomColors();
    }
  }

  /**
   * Apply color palette to CSS variables
   */
  private applyColorPalette(): void {
    const root = document.documentElement;

    // Apply primary palette
    if (this.config.primaryPalette !== "custom") {
      this.applyPaletteToRoot(root, "primary", this.config.primaryPalette);
    }

    // Apply secondary palette
    if (this.config.secondaryPalette !== "custom") {
      this.applyPaletteToRoot(root, "secondary", this.config.secondaryPalette);
    }

    // Apply accent palette
    if (this.config.accentPalette !== "custom") {
      this.applyPaletteToRoot(root, "accent", this.config.accentPalette);
    }
  }

  /**
   * Apply specific palette to root element
   */
  private applyPaletteToRoot(
    root: HTMLElement,
    prefix: string,
    palette: ColorPalette
  ): void {
    const paletteMap: Record<ColorPalette, Record<string, string>> = {
      blue: {
        "50": "239 246 255",
        "100": "219 234 254",
        "200": "191 219 254",
        "300": "147 197 253",
        "400": "96 165 250",
        "500": "59 130 246",
        "600": "37 99 235",
        "700": "29 78 216",
        "800": "30 64 175",
        "900": "30 58 138",
        "950": "23 37 84",
      },
      purple: {
        "50": "250 245 255",
        "100": "243 232 255",
        "200": "233 213 255",
        "300": "216 180 254",
        "400": "196 181 253",
        "500": "168 85 247",
        "600": "147 51 234",
        "700": "126 34 206",
        "800": "107 33 168",
        "900": "88 28 135",
        "950": "59 7 100",
      },
      green: {
        "50": "240 253 244",
        "100": "220 252 231",
        "200": "187 247 208",
        "300": "134 239 172",
        "400": "74 222 128",
        "500": "34 197 94",
        "600": "22 163 74",
        "700": "21 128 61",
        "800": "22 101 52",
        "900": "20 83 45",
        "950": "5 46 22",
      },
      red: {
        "50": "254 242 242",
        "100": "254 226 226",
        "200": "254 202 202",
        "300": "252 165 165",
        "400": "248 113 113",
        "500": "239 68 68",
        "600": "220 38 38",
        "700": "185 28 28",
        "800": "153 27 27",
        "900": "127 29 29",
        "950": "69 10 10",
      },
      yellow: {
        "50": "255 251 235",
        "100": "254 243 199",
        "200": "253 230 138",
        "300": "252 211 77",
        "400": "251 191 36",
        "500": "245 158 11",
        "600": "217 119 6",
        "700": "180 83 9",
        "800": "146 64 14",
        "900": "120 53 15",
        "950": "69 26 3",
      },
      cyan: {
        "50": "236 254 255",
        "100": "207 250 254",
        "200": "165 243 252",
        "300": "103 232 249",
        "400": "34 211 238",
        "500": "6 182 212",
        "600": "8 145 178",
        "700": "14 116 144",
        "800": "21 94 117",
        "900": "22 78 99",
        "950": "8 51 68",
      },
      gray: {
        "50": "250 250 250",
        "100": "245 245 245",
        "200": "229 229 229",
        "300": "212 212 212",
        "400": "163 163 163",
        "500": "115 115 115",
        "600": "82 82 82",
        "700": "64 64 64",
        "800": "38 38 38",
        "900": "23 23 23",
        "950": "10 10 10",
      },
      custom: {},
    };

    const colors = paletteMap[palette];
    if (colors) {
      Object.entries(colors).forEach(([shade, value]) => {
        root.style.setProperty(`--${prefix}-${shade}`, value);
      });
    }
  }

  /**
   * Apply custom colors to CSS variables
   */
  private applyCustomColors(): void {
    const root = document.documentElement;
    const customColors = this.config.customColors;

    if (customColors?.primary) {
      root.style.setProperty("--primary", customColors.primary);
    }
    if (customColors?.secondary) {
      root.style.setProperty("--secondary", customColors.secondary);
    }
    if (customColors?.accent) {
      root.style.setProperty("--accent", customColors.accent);
    }
    if (customColors?.background) {
      root.style.setProperty("--background", customColors.background);
    }
    if (customColors?.foreground) {
      root.style.setProperty("--foreground", customColors.foreground);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): ThemeConfig {
    if (typeof window === "undefined") {
      return {
        mode: "system",
        primaryPalette: "blue",
        secondaryPalette: "purple",
        accentPalette: "gray",
      };
    }

    try {
      const saved = localStorage.getItem("rn-updater-theme-config");
      if (saved) {
        return { ...this.getDefaultConfig(), ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn("Failed to load theme config:", error);
    }

    return this.getDefaultConfig();
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "rn-updater-theme-config",
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.warn("Failed to save theme config:", error);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ThemeConfig {
    return {
      mode: "system",
      primaryPalette: "blue",
      secondaryPalette: "purple",
      accentPalette: "gray",
    };
  }

  /**
   * Notify listeners of theme changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.config);
      } catch (error) {
        console.error("Theme listener error:", error);
      }
    });
  }

  /**
   * Reset to default theme
   */
  reset(): void {
    this.setConfig(this.getDefaultConfig());
  }

  /**
   * Export current theme configuration
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import theme configuration
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      this.setConfig(config);
      return true;
    } catch (error) {
      console.error("Failed to import theme config:", error);
      return false;
    }
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
