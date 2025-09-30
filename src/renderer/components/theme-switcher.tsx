import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore, Theme } from "../lib/stores/theme-store";
import { Button } from "./ui/button";

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <Moon className="h-4 w-4" />,
  },
  {
    value: "system",
    label: "System",
    icon: <Monitor className="h-4 w-4" />,
  },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (newTheme: Theme) => {
    console.log("Theme change requested:", newTheme);
    setTheme(newTheme);
    console.log("Theme after change:", useThemeStore.getState().theme);
  };

  return (
    <div className="theme-switcher flex items-center gap-1 p-1 bg-muted rounded-lg">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleThemeChange(option.value)}
          data-active={theme === option.value}
          className={`flex items-center gap-2 h-8 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            theme === option.value
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
