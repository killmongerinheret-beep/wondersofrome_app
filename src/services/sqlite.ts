import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export type DownloadRecord = {
  sight_id: string;
  variant: string;
  local_uri: string;
  downloaded_at?: number | null;
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return await dbInitPromise;

  dbInitPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('rome_guide.db');
    await initDatabase(db);
    dbInstance = db;
    return db;
  })();

  try {
    return await dbInitPromise;
  } catch (error) {
    dbInstance = null;
    dbInitPromise = null;
    throw error;
  }
};

const initDatabase = async (db: SQLite.SQLiteDatabase) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS downloads (
        sight_id TEXT NOT NULL,
        variant TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        downloaded_at INTEGER,
        PRIMARY KEY (sight_id, variant)
      );

      CREATE TABLE IF NOT EXISTS progress (
        sight_id TEXT PRIMARY KEY,
        completed BOOLEAN DEFAULT 0,
        last_played_variant TEXT,
        last_position INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS cached_sights (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );
    `);
    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const saveDownload = async (sightId: string, variant: string, localUri: string) => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO downloads (sight_id, variant, local_uri, downloaded_at) VALUES (?, ?, ?, ?)',
    [sightId, variant, localUri, Date.now()]
  );
};

export const getDownload = async (sightId: string, variant: string) => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ local_uri: string }>(
    'SELECT local_uri FROM downloads WHERE sight_id = ? AND variant = ?',
    [sightId, variant]
  );
  return result;
};

export const getAllDownloads = async (): Promise<DownloadRecord[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DownloadRecord>(
    'SELECT sight_id, variant, local_uri, downloaded_at FROM downloads ORDER BY downloaded_at DESC'
  );
  return rows ?? [];
};

export const clearDownloads = async () => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM downloads');
};

export const clearProgress = async () => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM progress');
};

export const updateProgress = async (sightId: string, completed: boolean, lastPlayedVariant: string, lastPosition: number) => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO progress (sight_id, completed, last_played_variant, last_position) VALUES (?, ?, ?, ?)',
    [sightId, completed ? 1 : 0, lastPlayedVariant, lastPosition]
  );
};

// ── Sight cache ──────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export const saveCachedSights = async (sights: unknown[]): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM cached_sights');
  await db.runAsync(
    'INSERT INTO cached_sights (id, data, cached_at) VALUES (?, ?, ?)',
    ['all', JSON.stringify(sights), Date.now()]
  );
};

export const getCachedSights = async <T>(): Promise<T[] | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ data: string; cached_at: number }>(
    'SELECT data, cached_at FROM cached_sights WHERE id = ?',
    ['all']
  );
  if (!row) return null;
  if (Date.now() - row.cached_at > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(row.data) as T[];
  } catch {
    return null;
  }
};
