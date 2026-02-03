"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";

export interface FlashcardStudySettings {
  /** Show definition first instead of term */
  showDefinitionFirst: boolean;
  /** Auto-advance to next card */
  autoplay: boolean;
  /** Autoplay speed in seconds */
  autoplaySpeed: number;
  /** Only show starred cards */
  starredOnly: boolean;
}

const DEFAULT_SETTINGS: FlashcardStudySettings = {
  showDefinitionFirst: false,
  autoplay: false,
  autoplaySpeed: 3,
  starredOnly: false,
};

const AUTOPLAY_SPEEDS = [
  { value: 2, label: "Fast (2s)" },
  { value: 3, label: "Normal (3s)" },
  { value: 5, label: "Slow (5s)" },
  { value: 8, label: "Very slow (8s)" },
];

interface FlashcardSettingsProps {
  settings: FlashcardStudySettings;
  onChange: (settings: FlashcardStudySettings) => void;
  onRestart: () => void;
  hasStarredCards: boolean;
}

export function FlashcardSettings({
  settings,
  onChange,
  onRestart,
  hasStarredCards,
}: FlashcardSettingsProps) {
  const [open, setOpen] = useState(false);

  const updateSetting = <K extends keyof FlashcardStudySettings>(
    key: K,
    value: FlashcardStudySettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_SETTINGS);
  };

  const activeSettingsCount = [
    settings.showDefinitionFirst,
    settings.autoplay,
    settings.starredOnly,
  ].filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative"
          aria-label="Flashcard settings"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Options
          {activeSettingsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeSettingsCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Study Options</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-7 text-xs"
            >
              Reset
            </Button>
          </div>

          {/* Show definition first */}
          <div className="flex items-center justify-between">
            <label htmlFor="showDefFirst" className="text-sm">
              Show definition first
            </label>
            <button
              id="showDefFirst"
              role="switch"
              aria-checked={settings.showDefinitionFirst}
              onClick={() =>
                updateSetting("showDefinitionFirst", !settings.showDefinitionFirst)
              }
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                settings.showDefinitionFirst ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                  settings.showDefinitionFirst ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Starred only */}
          <div className="flex items-center justify-between">
            <label
              htmlFor="starredOnly"
              className={cn("text-sm", !hasStarredCards && "text-muted-foreground")}
            >
              Starred terms only
            </label>
            <button
              id="starredOnly"
              role="switch"
              aria-checked={settings.starredOnly}
              disabled={!hasStarredCards}
              onClick={() => updateSetting("starredOnly", !settings.starredOnly)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                settings.starredOnly ? "bg-primary" : "bg-muted",
                !hasStarredCards && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                  settings.starredOnly ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
          {!hasStarredCards && (
            <p className="text-xs text-muted-foreground -mt-2">
              Star some terms to use this option
            </p>
          )}

          {/* Autoplay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="autoplay" className="text-sm">
                Autoplay
              </label>
              <button
                id="autoplay"
                role="switch"
                aria-checked={settings.autoplay}
                onClick={() => updateSetting("autoplay", !settings.autoplay)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  settings.autoplay ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    settings.autoplay ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {settings.autoplay && (
              <div className="pl-0">
                <label className="text-xs text-muted-foreground block mb-2">
                  Speed
                </label>
                <div className="flex gap-1">
                  {AUTOPLAY_SPEEDS.map((speed) => (
                    <button
                      key={speed.value}
                      onClick={() => updateSetting("autoplaySpeed", speed.value)}
                      className={cn(
                        "flex-1 px-2 py-1 text-xs rounded transition-colors",
                        settings.autoplaySpeed === speed.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {speed.value}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-border" />

          {/* Restart */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onRestart();
              setOpen(false);
            }}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart Flashcards
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DEFAULT_SETTINGS };
