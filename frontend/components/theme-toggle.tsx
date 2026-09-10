"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800" />;
  }

  const cycleTheme = () => {
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200 flex items-center justify-center relative w-10 h-10 group"
      title={`Current theme: ${theme}`}
    >
      {theme === "system" && <Monitor className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
      {theme === "dark" && <Moon className="h-5 w-5 text-cyan-400" />}
      {theme === "light" && <Sun className="h-5 w-5 text-amber-500" />}
    </button>
  );
}
