"use client";

import { Mail, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface PreferencesCardProps {
  emailNotifications: boolean;
  onEmailNotificationsChange: (value: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
}

/** Account-synced preferences (notifications) with an explicit save. */
export function PreferencesCard({
  emailNotifications,
  onEmailNotificationsChange,
  onSave,
  isSaving,
}: PreferencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-muted-foreground" aria-hidden />
          Preferences
        </CardTitle>
        <CardDescription>Saved to your account and synced across devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-xl border border-border p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <Mail className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p id="email-notifs-label" className="text-sm font-semibold">
              Product updates
            </p>
            <p className="text-xs text-muted-foreground">
              Occasional emails about new study features.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailNotifications}
            aria-labelledby="email-notifs-label"
            onClick={() => onEmailNotificationsChange(!emailNotifications)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              emailNotifications ? "bg-primary" : "bg-secondary border border-border"
            )}
          >
            <span
              className={cn(
                "inline-block size-5 rounded-full bg-card shadow-card transition-transform",
                emailNotifications ? "translate-x-5.5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Saving also stores your theme choice above.
          </p>
          <Button type="button" onClick={onSave} disabled={isSaving} isLoading={isSaving}>
            Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
