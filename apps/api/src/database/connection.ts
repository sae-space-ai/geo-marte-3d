import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/geo-marte-3d.sqlite');
    db = new Database(dbPath);
    
    // Configuración optimizada
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('cache_size = 10000');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getCurrentSchemaVersion(): number {
  const database = getDatabase();
  try {
    const result = database.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get() as any;
    return result?.version || 0;
  } catch {
    return 0;
  }
}
