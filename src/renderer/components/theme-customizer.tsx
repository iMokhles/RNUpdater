import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card-css-modules";
import { Button } from "./ui/button-css-modules";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  Settings,
  Check,
} from "lucide-react";
import { themeManager, ThemeConfig, ColorPalette } from "../lib/theme-manager";
import styles from "../styles/base.module.css";

interface ThemeCustomizerProps {
  className?: string;
  onClose?: () => void;
}

export function ThemeCustomizer({ className, onClose }: ThemeCustomizerProps) {
  const [config, setConfig] = useState<ThemeConfig>(themeManager.getConfig());
  const [isOpen, setIsOpen] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: "",
    secondary: "",
    accent: "",
    background: "",
    foreground: "",
  });

  useEffect(() => {
    const unsubscribe = themeManager.subscribe((newConfig) => {
      setConfig(newConfig);
    });

    return unsubscribe;
  }, []);

  const handleModeChange = (mode: ThemeConfig["mode"]) => {
    themeManager.setMode(mode);
  };

  const handlePrimaryPaletteChange = (palette: ColorPalette) => {
    themeManager.setPrimaryPalette(palette);
  };

  const handleSecondaryPaletteChange = (palette: ColorPalette) => {
    themeManager.setSecondaryPalette(palette);
  };

  const handleAccentPaletteChange = (palette: ColorPalette) => {
    themeManager.setAccentPalette(palette);
  };

  const handleCustomColorChange = (
    key: keyof typeof customColors,
    value: string
  ) => {
    setCustomColors((prev) => ({ ...prev, [key]: value }));
  };

  const applyCustomColors = () => {
    themeManager.setCustomColors(customColors);
  };

  const resetTheme = () => {
    themeManager.reset();
    setCustomColors({
      primary: "",
      secondary: "",
      accent: "",
      background: "",
      foreground: "",
    });
  };

  const exportConfig = () => {
    const configJson = themeManager.exportConfig();
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rn-updater-theme.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (themeManager.importConfig(content)) {
          console.log("Theme imported successfully");
        }
      };
      reader.readAsText(file);
    }
  };

  const colorPalettes = themeManager.getColorPalettes();

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.flex + " " + styles.itemsCenter + " " + styles.gap2}
      >
        <Settings className="w-4 h-4" />
        Customize Theme
      </Button>

      {/* Theme Customizer Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme Customizer
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Theme Mode */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Theme Mode</h3>
                <div className="flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={config.mode === value ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        handleModeChange(value as ThemeConfig["mode"])
                      }
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Palettes */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Color Palettes</h3>

                {/* Primary Palette */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Primary Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPalettes.map((palette) => (
                      <Button
                        key={palette.name}
                        variant={
                          config.primaryPalette === palette.name.toLowerCase()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handlePrimaryPaletteChange(
                            palette.name.toLowerCase() as ColorPalette
                          )
                        }
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <span className="text-xs">{palette.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Secondary Palette */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Secondary Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPalettes.map((palette) => (
                      <Button
                        key={palette.name}
                        variant={
                          config.secondaryPalette === palette.name.toLowerCase()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleSecondaryPaletteChange(
                            palette.name.toLowerCase() as ColorPalette
                          )
                        }
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: palette.secondary }}
                        />
                        <span className="text-xs">{palette.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Accent Palette */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Accent Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPalettes.map((palette) => (
                      <Button
                        key={palette.name}
                        variant={
                          config.accentPalette === palette.name.toLowerCase()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleAccentPaletteChange(
                            palette.name.toLowerCase() as ColorPalette
                          )
                        }
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: palette.accent }}
                        />
                        <span className="text-xs">{palette.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Custom Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(customColors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1 capitalize">
                        {key}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={value || "#000000"}
                          onChange={(e) =>
                            handleCustomColorChange(
                              key as keyof typeof customColors,
                              e.target.value
                            )
                          }
                          className="w-10 h-8 rounded border"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            handleCustomColorChange(
                              key as keyof typeof customColors,
                              e.target.value
                            )
                          }
                          placeholder={`Enter ${key} color`}
                          className="flex-1 px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="sm" onClick={applyCustomColors} className="mt-2">
                  <Check className="w-4 h-4 mr-2" />
                  Apply Custom Colors
                </Button>
              </div>
            </CardContent>

            <CardFooter>
              <div className="flex justify-between w-full">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetTheme}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportConfig}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importConfig}
                      className="hidden"
                    />
                  </label>
                </div>
                <Button onClick={() => setIsOpen(false)}>Done</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
