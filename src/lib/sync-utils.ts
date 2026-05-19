export type SyncItem = {
  id: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

const toTime = (value?: string | null) => (value ? new Date(value).getTime() : 0);

export const nowIso = () => new Date().toISOString();

export const normalizeItems = <T extends SyncItem>(items: T[]): T[] => {
  const needsNormalize = items.some(
    (item) => !item.updatedAt || item.deletedAt === undefined,
  );
  if (!needsNormalize) return items;
  const now = nowIso();
  return items.map((item) => ({
    ...item,
    updatedAt: item.updatedAt ?? now,
    deletedAt: item.deletedAt ?? null,
  }));
};

export const mergeById = <T extends SyncItem>(local: T[], remote: T[]): T[] => {
  const map = new Map<string, T>();

  const add = (item: T) => {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    const existingTime = toTime(existing.updatedAt);
    const itemTime = toTime(item.updatedAt);
    map.set(item.id, itemTime >= existingTime ? item : existing);
  };

  local.forEach(add);
  remote.forEach(add);

  return Array.from(map.values());
};

export const filterActive = <T extends SyncItem>(items: T[]) =>
  items.filter((item) => !item.deletedAt);

export const mergeByUpdatedAt = <T extends { updatedAt?: string }>(local: T, remote: T) =>
  toTime(remote.updatedAt) >= toTime(local.updatedAt) ? remote : local;
