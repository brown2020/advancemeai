"use client";

import { useEffect, useState, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import type { AchievementId } from "@/types/gamification";
import { getAchievementById } from "@/types/gamification";

interface AchievementToastProps {
  achievementId: AchievementId;
  onClose: () => void;
  autoCloseMs?: number;
}

/**
 * Toast notification for unlocked achievements
 */
export function AchievementToast({
  achievementId,
  onClose,
  autoCloseMs = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const achievement = getAchievementById(achievementId);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimeout = setTimeout(() => setIsVisible(true), 50);

    // Auto close
    const closeTimeout = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(closeTimeout);
    };
  }, [autoCloseMs, handleClose]);

  if (!achievement) return null;

  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
    achievement.icon
  ] ?? LucideIcons.Award;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm",
        "transform transition-all duration-300 ease-out",
        isVisible && !isExiting
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      )}
    >
      <div className="relative overflow-hidden rounded-lg border bg-card shadow-lg">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 animate-pulse" />

        <div className="relative p-4">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            {/* Achievement icon with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-50 animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg">
                <IconComponent size={28} />
              </div>
            </div>

            {/* Achievement details */}
            <div className="flex-1 pt-1">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                Achievement Unlocked!
              </p>
              <p className="text-lg font-bold mt-0.5">{achievement.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {achievement.description}
              </p>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-2">
                +{achievement.xpReward} XP
              </p>
            </div>
          </div>

          {/* Progress bar for auto-close */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
              style={{
                animation: `shrink ${autoCloseMs}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

interface AchievementToastContainerProps {
  achievements: AchievementId[];
  onClear: () => void;
}

/**
 * Container that manages multiple achievement toasts in a queue
 */
export function AchievementToastContainer({
  achievements,
  onClear,
}: AchievementToastContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleClose = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClear();
    }
  };

  const currentAchievement = achievements[currentIndex];
  if (achievements.length === 0 || currentIndex >= achievements.length || !currentAchievement) {
    return null;
  }

  return (
    <AchievementToast
      key={currentAchievement}
      achievementId={currentAchievement}
      onClose={handleClose}
    />
  );
}
