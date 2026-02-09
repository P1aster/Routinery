import * as SQLite from "expo-sqlite";

import type { HydrationEntry, HydrationType, NapEntry, SleepEntry } from "./types";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("routinery.db");
  }

  return databasePromise;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS hydration_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      timestamp TEXT NOT NULL,
      type TEXT DEFAULT 'water'
    );
    CREATE TABLE IF NOT EXISTS sleep_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bedtime TEXT NOT NULL,
      wakeTime TEXT NOT NULL,
      duration INTEGER NOT NULL,
      quality INTEGER DEFAULT 3
    );
    CREATE TABLE IF NOT EXISTS nap_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration INTEGER NOT NULL,
      quality INTEGER DEFAULT 3
    );
    CREATE INDEX IF NOT EXISTS idx_hydration_timestamp ON hydration_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sleep_bedtime ON sleep_entries(bedtime);
    CREATE INDEX IF NOT EXISTS idx_sleep_wake ON sleep_entries(wakeTime);
    CREATE INDEX IF NOT EXISTS idx_nap_start ON nap_entries(startTime);
  `);
}

export async function addHydrationEntry(input: {
  amount: number;
  timestamp: string;
  type: HydrationType;
}): Promise<HydrationEntry> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO hydration_entries (amount, timestamp, type) VALUES (?, ?, ?)",
    [input.amount, input.timestamp, input.type]
  );
  if (typeof result.lastInsertRowId !== "number") {
    throw new Error("Failed to insert hydration entry.");
  }

  return {
    id: result.lastInsertRowId,
    amount: input.amount,
    timestamp: input.timestamp,
    type: input.type
  };
}

export async function getHydrationEntriesByRange(
  startIso: string,
  endIso: string
): Promise<HydrationEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<HydrationEntry>(
    "SELECT id, amount, timestamp, type FROM hydration_entries WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC",
    [startIso, endIso]
  );
}

export async function getHydrationTotalByRange(
  startIso: string,
  endIso: string
): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM hydration_entries WHERE timestamp BETWEEN ? AND ?",
    [startIso, endIso]
  );

  if (!row || row.total === null) {
    return 0;
  }

  return row.total;
}

export async function addSleepEntry(input: {
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
}): Promise<SleepEntry> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO sleep_entries (bedtime, wakeTime, duration, quality) VALUES (?, ?, ?, ?)",
    [input.bedtime, input.wakeTime, input.duration, input.quality]
  );
  if (typeof result.lastInsertRowId !== "number") {
    throw new Error("Failed to insert sleep entry.");
  }

  return {
    id: result.lastInsertRowId,
    bedtime: input.bedtime,
    wakeTime: input.wakeTime,
    duration: input.duration,
    quality: input.quality
  };
}

export async function getSleepEntriesByRange(
  startIso: string,
  endIso: string
): Promise<SleepEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<SleepEntry>(
    "SELECT id, bedtime, wakeTime, duration, quality FROM sleep_entries WHERE bedtime BETWEEN ? AND ? ORDER BY bedtime DESC",
    [startIso, endIso]
  );
}

export async function getSleepEntriesByWakeRange(
  startIso: string,
  endIso: string
): Promise<SleepEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<SleepEntry>(
    "SELECT id, bedtime, wakeTime, duration, quality FROM sleep_entries WHERE wakeTime BETWEEN ? AND ? ORDER BY wakeTime DESC",
    [startIso, endIso]
  );
}

export async function getSleepAverageByRange(
  startIso: string,
  endIso: string
): Promise<{ averageDuration: number; averageQuality: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    averageDuration: number | null;
    averageQuality: number | null;
  }>(
    "SELECT AVG(duration) as averageDuration, AVG(quality) as averageQuality FROM sleep_entries WHERE bedtime BETWEEN ? AND ?",
    [startIso, endIso]
  );

  return {
    averageDuration: row?.averageDuration ?? 0,
    averageQuality: row?.averageQuality ?? 0
  };
}

export async function addNapEntry(input: {
  startTime: string;
  endTime: string;
  duration: number;
  quality: number;
}): Promise<NapEntry> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO nap_entries (startTime, endTime, duration, quality) VALUES (?, ?, ?, ?)",
    [input.startTime, input.endTime, input.duration, input.quality]
  );
  if (typeof result.lastInsertRowId !== "number") {
    throw new Error("Failed to insert nap entry.");
  }

  return {
    id: result.lastInsertRowId,
    startTime: input.startTime,
    endTime: input.endTime,
    duration: input.duration,
    quality: input.quality
  };
}

export async function getNapEntriesByRange(
  startIso: string,
  endIso: string
): Promise<NapEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<NapEntry>(
    "SELECT id, startTime, endTime, duration, quality FROM nap_entries WHERE startTime BETWEEN ? AND ? ORDER BY startTime DESC",
    [startIso, endIso]
  );
}
