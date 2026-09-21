/**
 * History storage abstraction.
 *
 * Current implementation: browser localStorage (works with zero setup).
 * The interface is database-ready — swap in a MongoDB/Postgres implementation
 * later without touching pages (keep the same method signatures).
 */

export interface HistoryItem {
  id: string;
  tool: string;
  toolLabel: string;
  prompt: string;
  resultText: string;
  createdAt: number;
  status: "success" | "error";
  mode?: "template" | "ai";
}

/** New history entry — `createdAt` is optional; the store stamps it. */
export type HistoryInput = Omit<HistoryItem, "createdAt"> & { createdAt?: number };

export interface HistoryStore {
  list(): HistoryItem[];
  add(item: HistoryInput): void;
  remove(id: string): void;
  clear(): void;
}

const KEY = "balu-ai-studio:history";
const MAX_ITEMS = 200;

function readRaw(): unknown {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as unknown) : [];
  } catch {
    return [];
  }
}

function writeItems(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage full / private mode — fail silently
  }
}

/** Browser localStorage-backed store (default). */
export const localHistoryStore: HistoryStore = {
  list(): HistoryItem[] {
    const raw = readRaw();
    if (!Array.isArray(raw)) return [];
    return (raw as HistoryItem[])
      .filter((i) => i && typeof i.id === "string")
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  add(item) {
    const items = this.list();
    items.unshift({ ...item, createdAt: item.createdAt ?? Date.now() });
    writeItems(items.slice(0, MAX_ITEMS));
  },
  remove(id) {
    writeItems(this.list().filter((i) => i.id !== id));
  },
  clear() {
    writeItems([]);
  },
};

/** Server-ready placeholder — implement with your database of choice. */
export const mongoHistoryStore: HistoryStore = {
  list: () => [],
  add: () => {},
  remove: () => {},
  clear: () => {},
};

export function getHistoryStore(): HistoryStore {
  // Client-side app: localStorage now. When a backend is configured later,
  // return the server store (e.g. mongoHistoryStore) instead.
  return localHistoryStore;
}