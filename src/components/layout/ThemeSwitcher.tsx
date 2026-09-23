"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { THEMES } from "@/constants/appConstants";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/utils/cn";

const OPTIONS = [
  { value: THEMES.LIGHT, label: "Light", icon: Sun },
  { value: THEMES.DARK, label: "Dark", icon: Moon },
  { value: THEMES.SYSTEM, label: "System", icon: Monitor },
] as const;

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn("grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1", className)}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <opt.icon className="size-3.5" aria-hidden />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
