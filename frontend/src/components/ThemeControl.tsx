import { useEffect, useState } from "react";
import { Laptop2, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";
const KEY = "multiops-theme";

export function useThemePreference() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const effective = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.dataset.theme = effective;
      root.style.colorScheme = effective;
    };

    apply();
    if (theme === "system") media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const update = (value: Theme) => {
    localStorage.setItem(KEY, value);
    setTheme(value);
  };

  return { theme, setTheme: update };
}

export default function ThemeControl() {
  const { theme, setTheme } = useThemePreference();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Laptop2;

  return (
    <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300" style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-card)" }}>
      <Icon className="h-4 w-4 text-violet-700 dark:text-violet-300" aria-hidden="true" />
      <span className="sr-only">Theme preference</span>
      <select
        aria-label="Theme preference"
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
        className="max-w-24 cursor-pointer bg-transparent outline-none"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
