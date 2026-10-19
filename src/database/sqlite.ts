// GEO-MARTE 3D — Capa de persistencia SQLite en el navegador (sql.js)
// Simula la API Fastify/SQLite del backend real
// SAE SPACE AI — Mineral-01

import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let initialized = false;

export const CURRENT_SCHEMA_VERSION = 1;

export const MIGRATIONS: { version: number; sql: string; description: string }[] = [
  {
    version: 1,
    description: 'Esquema inicial: proyectos, fuentes, sondeos, intervalos, muestras, resultados',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS project (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        crs TEXT,
        vertical_datum TEXT,
        origin_x REAL,
        origin_y REAL,
        grid_cells_x INTEGER NOT NULL,
        grid_cells_y INTEGER NOT NULL,
        cell_size_x_m REAL NOT NULL,
        cell_size_y_m REAL NOT NULL,
        depth_max_m REAL NOT NULL,
        vertical_step_m REAL NOT NULL,
        schema_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS evidence_source (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        organization TEXT NOT NULL,
        source_type TEXT NOT NULL CHECK(source_type IN ('borehole','geophysical','laboratory','cartography','bibliography','other')),
        url TEXT,
        reference TEXT,
        license TEXT,
        retrieved_at TEXT,
        sha256 TEXT,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS borehole (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        collar_elevation REAL,
        total_depth_m REAL NOT NULL CHECK(total_depth_m > 0),
        drilling_method TEXT,
        crs TEXT,
        source_id TEXT NOT NULL REFERENCES evidence_source(id),
        position_accuracy TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS borehole_interval (
        id TEXT PRIMARY KEY,
        borehole_id TEXT NOT NULL REFERENCES borehole(id) ON DELETE CASCADE,
        depth_from_m REAL NOT NULL CHECK(depth_from_m >= 0),
        depth_to_m REAL NOT NULL CHECK(depth_to_m > depth_from_m),
        lithology_raw TEXT,
        texture_raw TEXT,
        observation_method TEXT NOT NULL,
        source_id TEXT NOT NULL REFERENCES evidence_source(id),
        observed_at TEXT,
        vertical_resolution_m REAL,
        quality_status TEXT NOT NULL DEFAULT 'valid' CHECK(quality_status IN ('valid','rejected','conflict')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sample (
        id TEXT PRIMARY KEY,
        borehole_id TEXT NOT NULL REFERENCES borehole(id) ON DELETE CASCADE,
        depth_from_m REAL NOT NULL CHECK(depth_from_m >= 0),
        depth_to_m REAL NOT NULL CHECK(depth_to_m > depth_from_m),
        sample_type TEXT NOT NULL,
        method TEXT,
        date TEXT,
        laboratory TEXT,
        custody_reference TEXT,
        source_id TEXT NOT NULL REFERENCES evidence_source(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS mineral_result (
        id TEXT PRIMARY KEY,
        sample_id TEXT NOT NULL REFERENCES sample(id) ON DELETE CASCADE,
        mineral_name TEXT NOT NULL,
        formula TEXT,
        identification_method TEXT NOT NULL,
        abundance_value REAL,
        abundance_unit TEXT,
        uncertainty REAL,
        detection_limit REAL,
        report_id TEXT,
        source_id TEXT NOT NULL REFERENCES evidence_source(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS grain_size_result (
        id TEXT PRIMARY KEY,
        sample_id TEXT NOT NULL REFERENCES sample(id) ON DELETE CASCADE,
        gravel_percent REAL CHECK(gravel_percent >= 0 AND gravel_percent <= 100),
        sand_percent REAL CHECK(sand_percent >= 0 AND sand_percent <= 100),
        silt_percent REAL CHECK(silt_percent >= 0 AND silt_percent <= 100),
        clay_percent REAL CHECK(clay_percent >= 0 AND clay_percent <= 100),
        test_method TEXT NOT NULL,
        source_id TEXT NOT NULL REFERENCES evidence_source(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS voxel_observation (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
        ix INTEGER NOT NULL,
        iy INTEGER NOT NULL,
        iz INTEGER NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('UNKNOWN','OBSERVED','INTERPOLATED','INFERRED','CONFLICT','REJECTED')),
        evidence_id TEXT REFERENCES evidence_source(id),
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(project_id, ix, iy, iz)
      );

      CREATE INDEX IF NOT EXISTS idx_borehole_project ON borehole(project_id);
      CREATE INDEX IF NOT EXISTS idx_interval_borehole ON borehole_interval(borehole_id);
      CREATE INDEX IF NOT EXISTS idx_sample_borehole ON sample(borehole_id);
      CREATE INDEX IF NOT EXISTS idx_mineral_sample ON mineral_result(sample_id);
      CREATE INDEX IF NOT EXISTS idx_grain_sample ON grain_size_result(sample_id);
      CREATE INDEX IF NOT EXISTS idx_voxel_project ON voxel_observation(project_id);
    `,
  },
];

export async function initDatabase(): Promise<Database> {
  if (initialized && db) return db;

  const SQL = await initSqlJs();

  // Intentar cargar desde localStorage
  const saved = localStorage.getItem('geo_marte_3d_db');
  if (saved) {
    const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  // Aplicar migraciones
  const currentVersion = getCurrentSchemaVersion();
  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      db.run(migration.sql);
      db.run('INSERT OR REPLACE INTO schema_version (version) VALUES (?)', [migration.version]);
    }
  }

  initialized = true;
  persistDatabase();
  return db;
}

function getCurrentSchemaVersion(): number {
  if (!db) return 0;
  try {
    const result = db.exec('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1');
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0] as number;
    }
  } catch {
    return 0;
  }
  return 0;
}

export function persistDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Array.from(new Uint8Array(data));
  const base64 = btoa(String.fromCharCode(...buffer));
  try {
    localStorage.setItem('geo_marte_3d_db', base64);
  } catch (e) {
    console.warn('No se pudo persistir la base de datos en localStorage:', e);
  }
}

export function getDatabase(): Database | null {
  return db;
}

export function resetDatabase(): void {
  if (db) {
    db.close();
  }
  db = null;
  initialized = false;
  localStorage.removeItem('geo_marte_3d_db');
}

// === Operaciones CRUD ===

export interface DbProject {
  id: string;
  name: string;
  description: string;
  crs: string | null;
  vertical_datum: string | null;
  origin_x: number | null;
  origin_y: number | null;
  grid_cells_x: number;
  grid_cells_y: number;
  cell_size_x_m: number;
  cell_size_y_m: number;
  depth_max_m: number;
  vertical_step_m: number;
  schema_version: number;
  created_at: string;
  updated_at: string;
}

export function insertProject(project: Omit<DbProject, 'created_at' | 'updated_at'>): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO project (id, name, description, crs, vertical_datum, origin_x, origin_y,
        grid_cells_x, grid_cells_y, cell_size_x_m, cell_size_y_m, depth_max_m, vertical_step_m, schema_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project.id, project.name, project.description, project.crs, project.vertical_datum,
       project.origin_x, project.origin_y, project.grid_cells_x, project.grid_cells_y,
       project.cell_size_x_m, project.cell_size_y_m, project.depth_max_m, project.vertical_step_m,
       project.schema_version]
    );
    persistDatabase();
    return true;
  } catch (e) {
    console.error('Error insertando proyecto:', e);
    return false;
  }
}

export function getAllProjects(): DbProject[] {
  if (!db) return [];
  const result = db.exec('SELECT * FROM project ORDER BY created_at DESC');
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0] as string,
    name: row[1] as string,
    description: row[2] as string,
    crs: row[3] as string | null,
    vertical_datum: row[4] as string | null,
    origin_x: row[5] as number | null,
    origin_y: row[6] as number | null,
    grid_cells_x: row[7] as number,
    grid_cells_y: row[8] as number,
    cell_size_x_m: row[9] as number,
    cell_size_y_m: row[10] as number,
    depth_max_m: row[11] as number,
    vertical_step_m: row[12] as number,
    schema_version: row[13] as number,
    created_at: row[14] as string,
    updated_at: row[15] as string,
  }));
}

export function getProjectById(id: string): DbProject | null {
  if (!db) return null;
  const result = db.exec('SELECT * FROM project WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as string,
    name: row[1] as string,
    description: row[2] as string,
    crs: row[3] as string | null,
    vertical_datum: row[4] as string | null,
    origin_x: row[5] as number | null,
    origin_y: row[6] as number | null,
    grid_cells_x: row[7] as number,
    grid_cells_y: row[8] as number,
    cell_size_x_m: row[9] as number,
    cell_size_y_m: row[10] as number,
    depth_max_m: row[11] as number,
    vertical_step_m: row[12] as number,
    schema_version: row[13] as number,
    created_at: row[14] as string,
    updated_at: row[15] as string,
  };
}

export function insertVoxelObservation(obs: {
  id: string;
  project_id: string;
  ix: number;
  iy: number;
  iz: number;
  state: string;
  evidence_id?: string;
}): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT OR REPLACE INTO voxel_observation (id, project_id, ix, iy, iz, state, evidence_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [obs.id, obs.project_id, obs.ix, obs.iy, obs.iz, obs.state, obs.evidence_id || null]
    );
    return true;
  } catch (e) {
    console.error('Error insertando observación de voxel:', e);
    return false;
  }
}

export function countVoxelObservations(projectId: string): { total: number; unknown: number; observed: number } {
  if (!db) return { total: 0, unknown: 0, observed: 0 };
  const totalResult = db.exec('SELECT COUNT(*) FROM voxel_observation WHERE project_id = ?', [projectId]);
  const unknownResult = db.exec("SELECT COUNT(*) FROM voxel_observation WHERE project_id = ? AND state = 'UNKNOWN'", [projectId]);
  const observedResult = db.exec("SELECT COUNT(*) FROM voxel_observation WHERE project_id = ? AND state = 'OBSERVED'", [projectId]);

  return {
    total: totalResult[0]?.values[0]?.[0] as number || 0,
    unknown: unknownResult[0]?.values[0]?.[0] as number || 0,
    observed: observedResult[0]?.values[0]?.[0] as number || 0,
  };
}

export function insertEvidenceSource(source: {
  id: string;
  title: string;
  organization: string;
  source_type: string;
  url?: string;
  reference?: string;
  license?: string;
  description: string;
}): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO evidence_source (id, title, organization, source_type, url, reference, license, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [source.id, source.title, source.organization, source.source_type,
       source.url || null, source.reference || null, source.license || null, source.description]
    );
    persistDatabase();
    return true;
  } catch (e) {
    console.error('Error insertando fuente:', e);
    return false;
  }
}

export function getAllEvidenceSources(): any[] {
  if (!db) return [];
  const result = db.exec('SELECT * FROM evidence_source ORDER BY created_at DESC');
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0],
    title: row[1],
    organization: row[2],
    source_type: row[3],
    url: row[4],
    reference: row[5],
    license: row[6],
    retrieved_at: row[7],
    sha256: row[8],
    description: row[9],
    created_at: row[10],
  }));
}

export function insertBorehole(bh: {
  id: string;
  project_id: string;
  name: string;
  x: number;
  y: number;
  total_depth_m: number;
  drilling_method?: string;
  source_id: string;
}): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO borehole (id, project_id, name, x, y, total_depth_m, drilling_method, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bh.id, bh.project_id, bh.name, bh.x, bh.y, bh.total_depth_m, bh.drilling_method || null, bh.source_id]
    );
    persistDatabase();
    return true;
  } catch (e) {
    console.error('Error insertando sondeo:', e);
    return false;
  }
}

export function getAllBoreholes(): any[] {
  if (!db) return [];
  const result = db.exec('SELECT * FROM borehole ORDER BY created_at DESC');
  if (result.length === 0) return [];
  return result[0].values.map(row => ({
    id: row[0],
    project_id: row[1],
    name: row[2],
    x: row[3],
    y: row[4],
    collar_elevation: row[5],
    total_depth_m: row[6],
    drilling_method: row[7],
    crs: row[8],
    source_id: row[9],
    position_accuracy: row[10],
    created_at: row[11],
  }));
}

export function insertBoreholeInterval(interval: {
  id: string;
  borehole_id: string;
  depth_from_m: number;
  depth_to_m: number;
  lithology_raw?: string;
  observation_method: string;
  source_id: string;
}): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO borehole_interval (id, borehole_id, depth_from_m, depth_to_m, lithology_raw, observation_method, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [interval.id, interval.borehole_id, interval.depth_from_m, interval.depth_to_m,
       interval.lithology_raw || null, interval.observation_method, interval.source_id]
    );
    persistDatabase();
    return true;
  } catch (e) {
    console.error('Error insertando intervalo:', e);
    return false;
  }
}

export function getHealthStatus(): { status: string; schemaVersion: number; dbReady: boolean } {
  return {
    status: initialized ? 'ok' : 'initializing',
    schemaVersion: getCurrentSchemaVersion(),
    dbReady: initialized && db !== null,
  };
}
