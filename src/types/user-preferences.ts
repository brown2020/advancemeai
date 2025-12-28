import { THEMES } from "@/constants/appConstants";

export type ThemePreference =
  | typeof THEMES.SYSTEM
  | typeof THEMES.LIGHT
  | typeof THEMES.DARK;

export type UserPreferences = {
  theme: ThemePreference;
  emailNotifications: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: THEMES.SYSTEM,
  emailNotifications: false,
};


