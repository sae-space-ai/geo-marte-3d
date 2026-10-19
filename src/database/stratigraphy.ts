// GEO-MARTE 3D — Persistencia de columnas estratigráficas
// SQLite real en navegador (sql.js) con migraciones
// SAE SPACE AI — Mineral-01

import { initDatabase, persistDatabase, getDatabase } from './sqlite';

// === Migración v2: columnas estratigráficas ===

const MIGRATION_V2 = `
  CREATE TABLE IF NOT EXISTS stratigraphic_column (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    borehole_id TEXT REFERENCES borehole(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    total_depth_m REAL NOT NULL CHECK(total_depth_m > 0),
    source_id TEXT NOT NULL REFERENCES evidence_source(id),
    is_synthetic INTEGER NOT NULL DEFAULT 0,
    synthetic_notice TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stratigraphic_interval (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL REFERENCES stratigraphic_column(id) ON DELETE CASCADE,
    depth_from_m REAL NOT NULL CHECK(depth_from_m >= 0),
    depth_to_m REAL NOT NULL CHECK(depth_to_m > depth_from_m),
    lithology_raw TEXT,
    texture_raw TEXT,
    color_hex TEXT,
    observation_method TEXT NOT NULL,
    source_id TEXT NOT NULL REFERENCES evidence_source(id),
    quality_status TEXT NOT NULL DEFAULT 'valid' CHECK(quality_status IN ('valid','rejected','conflict')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_strat_column ON stratigraphic_column(project_id);
  CREATE INDEX IF NOT EXISTS idx_strat_interval_column ON stratigraphic_interval(column_id);
`;

let v2Applied = false;

export async function ensureSchemaV2(): Promise<void> {
  if (v2Applied) return;
  const db = await initDatabase();
  try {
    db.run(MIGRATION_V2);
    v2Applied = true;
    persistDatabase();
  } catch (e) {
    console.error('Error aplicando migración v2:', e);
    throw e;
  }
}

// === Tipos ===

export interface StratigraphicColumn {
  id: string;
  projectId: string;
  boreholeId?: string;
  name: string;
  x: number;
  y: number;
  totalDepthM: number;
  sourceId: string;
  isSynthetic: boolean;
  syntheticNotice?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StratigraphicInterval {
  id: string;
  columnId: string;
  depthFromM: number;
  depthToM: number;
  lithologyRaw?: string;
  textureRaw?: string;
  colorHex?: string;
  observationMethod: string;
  sourceId: string;
  qualityStatus: 'valid' | 'rejected' | 'conflict';
  notes?: string;
  createdAt: string;
}

// === Validaciones ===

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function validateColumn(input: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.projectId || typeof input.projectId !== 'string') {
    errors.push({ field: 'projectId', message: 'projectId obligatorio', code: 'REQUIRED' });
  }
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Nombre obligatorio', code: 'REQUIRED' });
  }
  if (typeof input.x !== 'number' || !isFinite(input.x)) {
    errors.push({ field: 'x', message: 'Coordenada X inválida (debe ser número finito)', code: 'INVALID_COORDINATE' });
  }
  if (typeof input.y !== 'number' || !isFinite(input.y)) {
    errors.push({ field: 'y', message: 'Coordenada Y inválida (debe ser número finito)', code: 'INVALID_COORDINATE' });
  }
  if (typeof input.totalDepthM !== 'number' || input.totalDepthM <= 0) {
    errors.push({ field: 'totalDepthM', message: 'Profundidad total debe ser positiva', code: 'INVALID_DEPTH' });
  }
  if (!input.sourceId || typeof input.sourceId !== 'string') {
    errors.push({ field: 'sourceId', message: 'sourceId obligatorio', code: 'REQUIRED' });
  }

  return errors;
}

export function validateInterval(input: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.columnId || typeof input.columnId !== 'string') {
    errors.push({ field: 'columnId', message: 'columnId obligatorio', code: 'REQUIRED' });
  }
  if (typeof input.depthFromM !== 'number' || input.depthFromM < 0) {
    errors.push({ field: 'depthFromM', message: 'Profundidad desde no puede ser negativa', code: 'NEGATIVE_DEPTH' });
  }
  if (typeof input.depthToM !== 'number' || input.depthToM <= 0) {
    errors.push({ field: 'depthToM', message: 'Profundidad hasta debe ser positiva', code: 'INVALID_DEPTH' });
  }
  if (typeof input.depthFromM === 'number' && typeof input.depthToM === 'number') {
    if (input.depthToM <= input.depthFromM) {
      errors.push({ field: 'depthToM', message: 'Profundidad hasta debe ser mayor que desde (espesor cero no válido)', code: 'ZERO_THICKNESS' });
    }
  }
  if (!input.observationMethod || typeof input.observationMethod !== 'string') {
    errors.push({ field: 'observationMethod', message: 'Método de observación obligatorio', code: 'REQUIRED' });
  }
  if (!input.sourceId || typeof input.sourceId !== 'string') {
    errors.push({ field: 'sourceId', message: 'sourceId obligatorio', code: 'REQUIRED' });
  }

  return errors;
}

export interface IntervalValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  gaps: { from: number; to: number }[];
  overlaps: { intervalA: string; intervalB: string; from: number; to: number }[];
  outOfBounds: { intervalId: string; issue: string }[];
}

export function validateColumnIntervals(
  intervals: StratigraphicInterval[],
  totalDepthM: number
): IntervalValidationReport {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const gaps: { from: number; to: number }[] = [];
  const overlaps: { intervalA: string; intervalB: string; from: number; to: number }[] = [];
  const outOfBounds: { intervalId: string; issue: string }[] = [];

  // Validar cada intervalo individualmente
  for (const interval of intervals) {
    const intervalErrors = validateInterval(interval);
    errors.push(...intervalErrors);

    if (interval.depthFromM >= totalDepthM) {
      outOfBounds.push({ intervalId: interval.id, issue: `Desde ${interval.depthFromM}m excede profundidad total ${totalDepthM}m` });
    }
    if (interval.depthToM > totalDepthM + 0.001) {
      outOfBounds.push({ intervalId: interval.id, issue: `Hasta ${interval.depthToM}m excede profundidad total ${totalDepthM}m` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, gaps, overlaps, outOfBounds };
  }

  // Ordenar por profundidad
  const sorted = [...intervals].sort((a, b) => a.depthFromM - b.depthFromM);

  // Detectar solapamientos
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.depthToM > next.depthFromM + 0.0001) {
      const overlapFrom = next.depthFromM;
      const overlapTo = Math.min(current.depthToM, next.depthToM);
      overlaps.push({
        intervalA: current.id,
        intervalB: next.id,
        from: overlapFrom,
        to: overlapTo,
      });
    }
  }

  // Detectar espacios sin información (UNKNOWN)
  let cursor = 0;
  for (const interval of sorted) {
    if (interval.depthFromM > cursor + 0.0001) {
      gaps.push({ from: cursor, to: interval.depthFromM });
    }
    cursor = Math.max(cursor, interval.depthToM);
  }
  if (cursor < totalDepthM - 0.0001) {
    gaps.push({ from: cursor, to: totalDepthM });
  }

  if (gaps.length > 0) {
    warnings.push(`Espacios sin información: ${gaps.length} tramo(s) en estado UNKNOWN`);
  }
  if (overlaps.length > 0) {
    warnings.push(`Solapamientos detectados: ${overlaps.length}`);
  }

  return {
    valid: overlaps.length === 0 && outOfBounds.length === 0,
    errors,
    warnings,
    gaps,
    overlaps,
    outOfBounds,
  };
}

// === Operaciones CRUD ===

export function insertStratColumn(col: StratigraphicColumn): boolean {
  const db = getDatabase();
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO stratigraphic_column
       (id, project_id, borehole_id, name, x, y, total_depth_m, source_id, is_synthetic, synthetic_notice, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [col.id, col.projectId, col.boreholeId || null, col.name, col.x, col.y,
       col.totalDepthM, col.sourceId, col.isSynthetic ? 1 : 0,
       col.syntheticNotice || null, col.notes || null]
    );
    persistDatabase();
    return true;
  } catch (e) {
    console.error('Error insertando columna:', e);
    return false;
  }
}

export function getAllStratColumns(): StratigraphicColumn[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    const result = db.exec('SELECT * FROM stratigraphic_column ORDER BY created_at DESC');
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      id: row[0] as string,
      projectId: row[1] as string,
      boreholeId: row[2] as string | undefined,
      name: row[3] as string,
      x: row[4] as number,
      y: row[5] as number,
      totalDepthM: row[6] as number,
      sourceId: row[7] as string,
      isSynthetic: (row[8] as number) === 1,
      syntheticNotice: row[9] as string | undefined,
      notes: row[10] as string | undefined,
      createdAt: row[11] as string,
      updatedAt: row[12] as string,
    }));
  } catch (e) {
    console.error('Error leyendo columnas:', e);
    return [];
  }
}

export function getStratColumnById(id: string): StratigraphicColumn | null {
  const db = getDatabase();
  if (!db) return null;
  try {
    const result = db.exec('SELECT * FROM stratigraphic_column WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    const row = result[0].values[0];
    return {
      id: row[0] as string,
      projectId: row[1] as string,
      boreholeId: row[2] as string | undefined,
      name: row[3] as string,
      x: row[4] as number,
      y: row[5] as number,
      totalDepthM: row[6] as number,
      sourceId: row[7] as string,
      isSynthetic: (row[8] as number) === 1,
      syntheticNotice: row[9] as string | undefined,
      notes: row[10] as string | undefined,
      createdAt: row[11] as string,
      updatedAt: row[12] as string,
    };
  } catch {
    return null;
  }
}

export function deleteStratColumn(id: string): boolean {
  const db = getDatabase();
  if (!db) return false;
  try {
    db.run('DELETE FROM stratigraphic_column WHERE id = ?', [id]);
    persistDatabase();
    return true;
  } catch {
    return false;
  }
}

export function insertStratInterval(interval: StratigraphicInterval): boolean {
  const db = getDatabase();
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO stratigraphic_interval
       (id, column_id, depth_from_m, depth_to_m, lithology_raw, texture_raw, color_hex, observation_method, source_id, quality_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [interval.id, interval.columnId, interval.depthFromM, interval.depthToM,
       interval.lithologyRaw || null, interval.textureRaw || null, interval.colorHex || null,
       interval.observationMethod, interval.sourceId, interval.qualityStatus, interval.notes || null]
    );
    persistDatabase();
    return true;
  } catch (e) {
    console.error('Error insertando intervalo:', e);
    return false;
  }
}

export function getStratIntervalsByColumn(columnId: string): StratigraphicInterval[] {
  const db = getDatabase();
  if (!db) return [];
  try {
    const result = db.exec('SELECT * FROM stratigraphic_interval WHERE column_id = ? ORDER BY depth_from_m ASC', [columnId]);
    if (result.length === 0) return [];
    return result[0].values.map(row => ({
      id: row[0] as string,
      columnId: row[1] as string,
      depthFromM: row[2] as number,
      depthToM: row[3] as number,
      lithologyRaw: row[4] as string | undefined,
      textureRaw: row[5] as string | undefined,
      colorHex: row[6] as string | undefined,
      observationMethod: row[7] as string,
      sourceId: row[8] as string,
      qualityStatus: row[9] as 'valid' | 'rejected' | 'conflict',
      notes: row[10] as string | undefined,
      createdAt: row[11] as string,
    }));
  } catch {
    return [];
  }
}

export function deleteStratInterval(id: string): boolean {
  const db = getDatabase();
  if (!db) return false;
  try {
    db.run('DELETE FROM stratigraphic_interval WHERE id = ?', [id]);
    persistDatabase();
    return true;
  } catch {
    return false;
  }
}

// === Importación/Exportación ===

export function exportColumnToJSON(column: StratigraphicColumn, intervals: StratigraphicInterval[]): string {
  return JSON.stringify({
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    provenance: {
      generator: 'GEO-MARTE 3D — SAE Space AI',
      warning: column.isSynthetic
        ? 'DATOS SINTÉTICOS DE DEMOSTRACIÓN — No representan estratigrafía real'
        : undefined,
    },
    column: {
      id: column.id,
      projectId: column.projectId,
      boreholeId: column.boreholeId,
      name: column.name,
      coordinates: { x: column.x, y: column.y },
      totalDepthM: column.totalDepthM,
      sourceId: column.sourceId,
      isSynthetic: column.isSynthetic,
      syntheticNotice: column.syntheticNotice,
      notes: column.notes,
    },
    intervals: intervals.map(i => ({
      id: i.id,
      depthFromM: i.depthFromM,
      depthToM: i.depthToM,
      thicknessM: parseFloat((i.depthToM - i.depthFromM).toFixed(4)),
      lithologyRaw: i.lithologyRaw,
      textureRaw: i.textureRaw,
      observationMethod: i.observationMethod,
      sourceId: i.sourceId,
      qualityStatus: i.qualityStatus,
    })),
  }, null, 2);
}

export function exportColumnToCSV(column: StratigraphicColumn, intervals: StratigraphicInterval[]): string {
  const header = 'column_id,column_name,x_m,y_m,total_depth_m,source_id,is_synthetic,depth_from_m,depth_to_m,thickness_m,lithology_raw,observation_method,quality_status';
  const rows = intervals.map(i => {
    const thickness = (i.depthToM - i.depthFromM).toFixed(4);
    const escape = (s: string | undefined) => {
      if (!s) return '';
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    return [
      column.id,
      escape(column.name),
      column.x,
      column.y,
      column.totalDepthM,
      column.sourceId,
      column.isSynthetic ? 'true' : 'false',
      i.depthFromM,
      i.depthToM,
      thickness,
      escape(i.lithologyRaw),
      escape(i.observationMethod),
      i.qualityStatus,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export function parseColumnCSV(text: string): {
  column: Partial<StratigraphicColumn>;
  intervals: Partial<StratigraphicInterval>[];
  errors: string[];
} {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return { column: {}, intervals: [], errors: ['CSV debe tener cabecera y al menos una fila'] };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['column_id', 'x_m', 'y_m', 'total_depth_m', 'source_id', 'depth_from_m', 'depth_to_m', 'observation_method'];
  const missing = requiredHeaders.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    return { column: {}, intervals: [], errors: [`Cabeceras faltantes: ${missing.join(', ')}`] };
  }

  const errors: string[] = [];
  const intervals: Partial<StratigraphicInterval>[] = [];
  let columnData: Partial<StratigraphicColumn> = {};

  lines.slice(1).forEach((line, idx) => {
    const cols = line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
    if (cols.length !== headers.length) {
      errors.push(`Fila ${idx + 2}: número de columnas incorrecto`);
      return;
    }

    const get = (name: string) => cols[headers.indexOf(name)];
    const getNum = (name: string): number | null => {
      const v = get(name);
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };

    // Primera fila define la columna
    if (idx === 0) {
      columnData = {
        id: get('column_id'),
        name: get('column_name') || get('column_id'),
        x: getNum('x_m') ?? undefined,
        y: getNum('y_m') ?? undefined,
        totalDepthM: getNum('total_depth_m') ?? undefined,
        sourceId: get('source_id'),
        isSynthetic: get('is_synthetic') === 'true',
      };
    }

    const depthFrom = getNum('depth_from_m');
    const depthTo = getNum('depth_to_m');

    if (depthFrom === null || depthTo === null) {
      errors.push(`Fila ${idx + 2}: profundidades inválidas`);
      return;
    }
    if (depthFrom < 0) {
      errors.push(`Fila ${idx + 2}: profundidad desde negativa`);
      return;
    }
    if (depthTo <= depthFrom) {
      errors.push(`Fila ${idx + 2}: espesor cero o negativo`);
      return;
    }

    intervals.push({
      columnId: columnData.id,
      depthFromM: depthFrom,
      depthToM: depthTo,
      lithologyRaw: get('lithology_raw') || undefined,
      observationMethod: get('observation_method'),
      sourceId: get('source_id'),
      qualityStatus: 'valid',
    });
  });

  return { column: columnData, intervals, errors };
}

export function parseColumnJSON(text: string): {
  column: Partial<StratigraphicColumn>;
  intervals: Partial<StratigraphicInterval>[];
  errors: string[];
} {
  try {
    const data = JSON.parse(text);
    if (!data.column || !Array.isArray(data.intervals)) {
      return { column: {}, intervals: [], errors: ['JSON inválido: faltan column o intervals'] };
    }

    const col = data.column;
    const errors: string[] = [];

    if (!col.id) errors.push('column.id obligatorio');
    if (typeof col.x !== 'number' || !isFinite(col.x)) errors.push('column.x inválido');
    if (typeof col.y !== 'number' || !isFinite(col.y)) errors.push('column.y inválido');
    if (typeof col.totalDepthM !== 'number' || col.totalDepthM <= 0) errors.push('column.totalDepthM inválido');
    if (!col.sourceId) errors.push('column.sourceId obligatorio');

    const intervals: Partial<StratigraphicInterval>[] = data.intervals.map((i: any, idx: number) => {
      if (typeof i.depthFromM !== 'number' || i.depthFromM < 0) {
        errors.push(`Intervalo ${idx}: depthFromM inválido`);
      }
      if (typeof i.depthToM !== 'number' || i.depthToM <= 0) {
        errors.push(`Intervalo ${idx}: depthToM inválido`);
      }
      if (typeof i.depthFromM === 'number' && typeof i.depthToM === 'number' && i.depthToM <= i.depthFromM) {
        errors.push(`Intervalo ${idx}: espesor cero o negativo`);
      }
      return {
        columnId: col.id,
        depthFromM: i.depthFromM,
        depthToM: i.depthToM,
        lithologyRaw: i.lithologyRaw,
        textureRaw: i.textureRaw,
        observationMethod: i.observationMethod || 'desconocido',
        sourceId: i.sourceId || col.sourceId,
        qualityStatus: i.qualityStatus || 'valid',
      };
    });

    return { column: col as Partial<StratigraphicColumn>, intervals, errors };
  } catch (e) {
    return { column: {}, intervals: [], errors: ['JSON inválido: error de parseo'] };
  }
}
