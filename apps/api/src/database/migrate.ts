import { getDatabase } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(): void {
  const db = getDatabase();
  const migrationsDir = path.join(__dirname, 'migrations');
  
  // Obtener versión actual
  let currentVersion = 0;
  try {
    const result = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get() as any;
    currentVersion = result?.version || 0;
  } catch {
    // Tabla no existe aún
  }

  // Leer migraciones
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const match = file.match(/^(\d+)_/);
    if (!match) continue;
    
    const version = parseInt(match[1], 10);
    if (version <= currentVersion) continue;

    console.log(`Aplicando migración ${version}: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
  }

  console.log(`Migraciones completadas. Versión actual: ${currentVersion}`);
}

// Ejecutar si es el script principal
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMigrations();
}
