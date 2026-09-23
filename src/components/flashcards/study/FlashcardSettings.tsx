"use client";

import { useState } from "react";
import { RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { SettingSwitch } from "./SettingSwitch";

export interface FlashcardStudySettings {
  /** Show definition first instead of term */
  showDefinitionFirst: boolean;
  /** Shuffle the card order */
  shuffle: boolean;
  /** Auto-advance to next card */
  autoplay: boolean;
  /** Autoplay speed in seconds */
  autoplaySpeed: number;
  /** Only show starred cards */
  starredOnly: boolean;
}

export const DEFAULT_SETTINGS: FlashcardStudySettings = {
  showDefinitionFirst: false,
  shuffle: false,
  autoplay: false,
  autoplaySpeed: 3,
  starredOnly: false,
};

const AUTOPLAY_SPEEDS = [2, 3, 5, 8];

interface FlashcardSettingsProps {
  settings: FlashcardStudySettings;
  onChange: (settings: FlashcardStudySettings) => void;
  onRestart: () => void;
  hasStarredCards: boolean;
}

/** Options popover for the flashcard viewer. */
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

  const activeSettingsCount = [
    settings.showDefinitionFirst,
    settings.shuffle,
    settings.autoplay,
    settings.starredOnly,
  ].filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            activeSettingsCount > 0
              ? `Flashcard options (${activeSettingsCount} on)`
              : "Flashcard options"
          }
        >
          <Settings2 />
          {activeSettingsCount > 0 ? (
            <span
              className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
              aria-hidden
            >
              {activeSettingsCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Options</h3>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange(DEFAULT_SETTINGS)}
          >
            Reset
          </Button>
        </div>

        <div className="divide-y divide-border">
          <SettingSwitch
            id="fc-show-definition-first"
            label="Definition first"
            checked={settings.showDefinitionFirst}
            onCheckedChange={(v) => updateSetting("showDefinitionFirst", v)}
          />
          <SettingSwitch
            id="fc-shuffle"
            label="Shuffle"
            checked={settings.shuffle}
            onCheckedChange={(v) => updateSetting("shuffle", v)}
          />
          <SettingSwitch
            id="fc-starred-only"
            label="Starred terms only"
            description={hasStarredCards ? undefined : "Star some terms to use this."}
            checked={settings.starredOnly}
            disabled={!hasStarredCards}
            onCheckedChange={(v) => updateSetting("starredOnly", v)}
          />
          <div className="py-1">
            <SettingSwitch
              id="fc-autoplay"
              label="Autoplay"
              checked={settings.autoplay}
              onCheckedChange={(v) => updateSetting("autoplay", v)}
            />
            {settings.autoplay ? (
              <div className="mt-2" role="group" aria-label="Autoplay speed">
                <p className="mb-1.5 text-xs text-muted-foreground">Seconds per side</p>
                <div className="flex gap-1 rounded-xl bg-secondary p-1">
                  {AUTOPLAY_SPEEDS.map((speed) => {
                    const active = settings.autoplaySpeed === speed;
                    return (
                      <button
                        key={speed}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateSetting("autoplaySpeed", speed)}
                        className={cn(
                          "h-8 flex-1 rounded-lg text-xs font-semibold tabular-nums transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "bg-card text-foreground shadow-card"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {speed}s
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            onRestart();
            setOpen(false);
          }}
        >
          <RotateCcw aria-hidden />
          Restart from first card
        </Button>
      </PopoverContent>
    </Popover>
  );
}
