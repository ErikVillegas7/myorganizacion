"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocalStorageState } from "./use-local-storage";
import { mergeByUpdatedAt, nowIso } from "@/lib/sync-utils";

export type AppTheme = "dark" | "light";

export type AppSettings = {
  theme: AppTheme;
  name: string;
  avatar?: string; // base64 data URL
  soundEnabled?: boolean;
  updatedAt: string;
};

const defaultSettings: AppSettings = {
  theme: "dark",
  name: "Estudiante",
  soundEnabled: false,
  updatedAt: nowIso(),
};

type SettingsUpdater = AppSettings | ((prev: AppSettings) => AppSettings);

export function useSettings() {
  const [settings, setSettings] = useLocalStorageState<AppSettings>("mo_settings", defaultSettings);
  const { status } = useSession();
  const [remoteReady, setRemoteReady] = useState(false);
  const localSnapshot = useRef(settings);

  useEffect(() => {
    localSnapshot.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!settings.updatedAt) {
      setSettings((prev) => ({ ...prev, updatedAt: nowIso() }));
    }
  }, [settings.updatedAt, setSettings]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    const loadRemote = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setRemoteReady(true);
          return;
        }
        const data = await res.json();
        const remoteSettings = data?.settings as AppSettings | null;
        const remoteEmpty = !remoteSettings || Object.keys(remoteSettings).length === 0;
        const local = localSnapshot.current;
        const localNormalized = local.updatedAt ? local : { ...local, updatedAt: nowIso() };

        if (remoteEmpty) {
          await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: localNormalized }),
          });
        } else {
          const remoteNormalized = remoteSettings.updatedAt
            ? remoteSettings
            : { ...remoteSettings, updatedAt: nowIso() };
          const merged = mergeByUpdatedAt(localNormalized, remoteNormalized);
          if (!cancelled) {
            setSettings(merged);
          }
          if (merged.updatedAt !== remoteNormalized.updatedAt) {
            await fetch("/api/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ settings: merged }),
            });
          }
        }
      } catch {
        // Keep local settings if remote sync fails.
      }

      if (!cancelled) setRemoteReady(true);
    };

    void loadRemote();
    return () => {
      cancelled = true;
    };
  }, [status, setSettings]);

  useEffect(() => {
    if (status !== "authenticated" || !remoteReady) return;
    const timeout = window.setTimeout(() => {
      void fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [status, remoteReady, settings]);

  const setSettingsWithUpdatedAt = (next: SettingsUpdater) => {
    setSettings((prev) => {
      const resolved = typeof next === "function"
        ? (next as (value: AppSettings) => AppSettings)(prev)
        : next;
      return { ...resolved, updatedAt: nowIso() };
    });
  };

  return [settings, setSettingsWithUpdatedAt] as const;
}
