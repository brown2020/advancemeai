import { useLocalStorageObject } from "./useLocalStorage";
import { useAuth } from "@/lib/auth";
import { DEFAULT_FLASHCARD_SETTINGS } from "@/constants/flashcardConstants";

// Type for flashcard settings
export type FlashcardSettings = typeof DEFAULT_FLASHCARD_SETTINGS;

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
    DEFAULT_FLASHCARD_SETTINGS
  );

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_FLASHCARD_SETTINGS);
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
