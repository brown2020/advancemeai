import { useLocalStorageObject } from "./useLocalStorage";
import { useAuth } from "@/lib/auth";

// Default settings
const DEFAULT_SETTINGS = {
  // Display settings
  cardSize: "medium", // 'small' | 'medium' | 'large'
  showCardCount: true,
  showCreationDate: true,

  // Sorting settings
  sortBy: "updatedAt", // 'title' | 'createdAt' | 'updatedAt' | 'cardCount'
  sortDirection: "desc", // 'asc' | 'desc'

  // Study settings
  shuffleCards: true,
  autoFlip: false,
  autoFlipDelay: 5, // seconds

  // Performance settings
  prefetchSets: true,
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
};

// Type for flashcard settings
export type FlashcardSettings = typeof DEFAULT_SETTINGS;

/**
 * Custom hook for managing user preferences for flashcards
 * Settings are stored in localStorage and tied to the user's ID
 */
export function useFlashcardSettings() {
  const { user } = useAuth();
  const userId = user?.uid || "anonymous";
  const storageKey = `flashcard-settings-${userId}`;

  const [settings, setSettings] = useLocalStorageObject<FlashcardSettings>(
    storageKey,
    DEFAULT_SETTINGS
  );

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Update a single setting
  const updateSetting = <K extends keyof FlashcardSettings>(
    key: K,
    value: FlashcardSettings[K]
  ) => {
    setSettings({ [key]: value } as Partial<FlashcardSettings>);
  };

  return {
    settings,
    setSettings,
    updateSetting,
    resetSettings,
  };
}
