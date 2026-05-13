"use client";

import { useLocalStorageState } from "./use-local-storage";

export type AppTheme = "dark" | "light";

export type AppSettings = {
  theme: AppTheme;
  name: string;
  avatar?: string; // base64 data URL
};

const defaultSettings: AppSettings = {
  theme: "dark",
  name: "Estudiante",
};

export function useSettings() {
  return useLocalStorageState<AppSettings>("mo_settings", defaultSettings);
}
