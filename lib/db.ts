import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'senra.db')

declare global {
  // eslint-disable-next-line no-var
  var _senraDb: Database.Database | undefined
}

export function getDb(): Database.Database {
  if (!global._senraDb) {
    global._senraDb = new Database(DB_PATH)
    global._senraDb.pragma('journal_mode = WAL')
    initSchema(global._senraDb)
  }
  return global._senraDb
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      iso_code TEXT,
      region TEXT,
      is_ut INTEGER DEFAULT 0,
      raw_data TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS fragility_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state_id INTEGER NOT NULL,
      computed_at TEXT NOT NULL,
      score REAL NOT NULL,
      rank INTEGER NOT NULL,
      band TEXT NOT NULL,
      confidence REAL NOT NULL,
      subscore_road REAL,
      subscore_business REAL,
      subscore_monsoon REAL,
      subscore_logistics REAL,
      subscore_power REAL,
      subscore_cold_chain REAL,
      subscore_concentration REAL,
      imputed_dimensions TEXT DEFAULT '[]',
      sector_preset TEXT DEFAULT 'default',
      FOREIGN KEY (state_id) REFERENCES states(id)
    );

    CREATE TABLE IF NOT EXISTS data_refresh_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ran_at TEXT DEFAULT (datetime('now')),
      status TEXT,
      states_count INTEGER
    );
  `)
}
