"use client";

import { mergeById, mergeByUpdatedAt, normalizeItems, type SyncItem } from "@/lib/sync-utils";
import type { AppSettings } from "@/lib/use-settings";

export const APP_STORAGE_KEYS = [
  "mo_notes",
  "mo_folders",
  "mo_events",
  "mo_habits",
  "mo_subjects",
  "mo_units",
  "mo_settings",
] as const;

const readJson = <T>(key: string): T | null => {
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
};

const requestJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo leer ${url}`);
  }
  return (await res.json()) as T;
};

const putJson = async (url: string, body: unknown) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`No se pudo guardar ${url}`);
  }
};

const toArray = <T extends SyncItem>(value: unknown): T[] =>
  normalizeItems(Array.isArray(value) ? (value as T[]) : []);

const mergeLocalRemote = <T extends SyncItem>(
  local: T[] | null,
  remote: unknown,
) => mergeById(normalizeItems(local ?? []), toArray<T>(remote));

const isDefaultSettings = (settings: AppSettings | null) =>
  settings?.theme === "dark" &&
  settings.name === "Estudiante" &&
  !settings.avatar &&
  settings.soundEnabled !== true;

const mergeSettings = (local: AppSettings | null, remote: unknown) => {
  const remoteSettings =
    remote && typeof remote === "object" && !Array.isArray(remote)
      ? (remote as AppSettings)
      : null;

  if (!local) return remoteSettings ?? {};
  if (remoteSettings && isDefaultSettings(local)) return remoteSettings;
  if (!remoteSettings) return local;
  return mergeByUpdatedAt(local, remoteSettings);
};

export const syncLocalDataBeforeLogout = async () => {
  const [notesData, subjectsData, calendarData, habitsData, settingsData] = await Promise.all([
    requestJson<{ notes?: unknown; folders?: unknown }>("/api/notes"),
    requestJson<{ subjects?: unknown; units?: unknown }>("/api/subjects"),
    requestJson<{ events?: unknown }>("/api/calendar"),
    requestJson<{ habits?: unknown }>("/api/habits"),
    requestJson<{ settings?: unknown }>("/api/settings"),
  ]);

  await Promise.all([
    putJson("/api/notes", {
      notes: mergeLocalRemote(readJson<SyncItem[]>("mo_notes"), notesData.notes),
      folders: mergeLocalRemote(readJson<SyncItem[]>("mo_folders"), notesData.folders),
    }),
    putJson("/api/subjects", {
      subjects: mergeLocalRemote(readJson<SyncItem[]>("mo_subjects"), subjectsData.subjects),
      units: mergeLocalRemote(readJson<SyncItem[]>("mo_units"), subjectsData.units),
    }),
    putJson("/api/calendar", {
      events: mergeLocalRemote(readJson<SyncItem[]>("mo_events"), calendarData.events),
    }),
    putJson("/api/habits", {
      habits: mergeLocalRemote(readJson<SyncItem[]>("mo_habits"), habitsData.habits),
    }),
    putJson("/api/settings", {
      settings: mergeSettings(readJson<AppSettings>("mo_settings"), settingsData.settings),
    }),
  ]);
};

export const clearLocalAppData = () => {
  APP_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};
