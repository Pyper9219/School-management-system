import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { buildSeed } from "@/src/lib/seed";
import type { Database, Role, User } from "@/src/lib/types";

const DB_KEY = "mga.db.v2";
const SESSION_KEY = "mga.session.v2";

export type ArrayKeys = {
  [K in keyof Database]: Database[K] extends Array<{ id: string }> ? K : never;
}[keyof Database];

interface SchoolContextValue {
  db: Database;
  /** Replace whole collections in one persisted write. */
  patch: (partial: Partial<Database>) => void;
  upsert: <K extends ArrayKeys>(key: K, item: Database[K][number]) => void;
  upsertMany: <K extends ArrayKeys>(key: K, items: Database[K]) => void;
  removeById: <K extends ArrayKeys>(key: K, id: string) => void;
  removeWhere: <K extends ArrayKeys>(key: K, predicate: (item: Database[K][number]) => boolean) => void;
  resetDemoData: () => void;
  currentUser: User | null;
  signIn: (userId: string) => void;
  signOut: () => void;
  asOf: string;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

function loadDb(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.students) && parsed.students.length) return parsed;
    }
  } catch {
    // corrupt or unavailable storage falls through to a fresh seed
  }
  const seeded = buildSeed();
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  } catch {
    // private-mode storage failures leave the session in memory
  }
  return seeded;
}

function isoDateNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDb());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const writeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (writeTimer.current) window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      } catch {
        /* quota exceeded keeps the working copy in memory only */
      }
    }, 250);
    return () => {
      if (writeTimer.current) window.clearTimeout(writeTimer.current);
    };
  }, [db]);

  const patch = useCallback((partial: Partial<Database>) => {
    setDb((prev) => ({ ...prev, ...partial }));
  }, []);

  const upsert = useCallback(<K extends ArrayKeys>(key: K, item: Database[K][number]) => {
    setDb((prev) => {
      const list = prev[key] as Array<{ id: string }>;
      const index = list.findIndex((row) => row.id === item.id);
      const next = index === -1 ? [...list, item] : list.map((row, i) => (i === index ? item : row));
      return { ...prev, [key]: next } as Database;
    });
  }, []);

  const upsertMany = useCallback(<K extends ArrayKeys>(key: K, items: Database[K]) => {
    setDb((prev) => {
      const list = prev[key] as Array<{ id: string }>;
      const byId = new Map(list.map((row) => [row.id, row]));
      for (const item of items as Array<{ id: string }>) byId.set(item.id, item);
      return { ...prev, [key]: [...byId.values()] } as Database;
    });
  }, []);

  const removeById = useCallback(<K extends ArrayKeys>(key: K, id: string) => {
    setDb((prev) => {
      const list = prev[key] as Array<{ id: string }>;
      return { ...prev, [key]: list.filter((row) => row.id !== id) } as Database;
    });
  }, []);

  const removeWhere = useCallback(<K extends ArrayKeys>(key: K, predicate: (item: Database[K][number]) => boolean) => {
    setDb((prev) => {
      const list = prev[key] as Array<{ id: string }>;
      return { ...prev, [key]: list.filter((row) => !predicate(row as never)) } as Database;
    });
  }, []);

  const resetDemoData = useCallback(() => {
    const fresh = buildSeed();
    setDb(fresh);
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    } catch {
      /* ignore */
    }
  }, []);

  const signIn = useCallback((userId: string) => {
    localStorage.setItem(SESSION_KEY, userId);
    setCurrentUserId(userId);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUserId(null);
  }, []);

  const currentUser = useMemo(() => db.users.find((u) => u.id === currentUserId) ?? null, [db.users, currentUserId]);
  const asOf = useMemo(() => isoDateNow(), []);

  const value = useMemo<SchoolContextValue>(
    () => ({
      db, patch, upsert, upsertMany, removeById, removeWhere, resetDemoData,
      currentUser, signIn, signOut, asOf,
    }),
    [db, patch, upsert, upsertMany, removeById, removeWhere, resetDemoData, currentUser, signIn, signOut, asOf],
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used inside SchoolProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
};
