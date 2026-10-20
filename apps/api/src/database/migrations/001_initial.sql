-- Migración 001: Esquema inicial GEO-MARTE 3D
-- SAE SPACE AI — Mineral-01

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  description TEXT
);

-- Proyectos
CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  crs TEXT,
  vertical_datum TEXT,
  origin_x REAL,
  origin_y REAL,
  grid_cells_x INTEGER NOT NULL CHECK(grid_cells_x > 0),
  grid_cells_y INTEGER NOT NULL CHECK(grid_cells_y > 0),
  cell_size_x_m REAL NOT NULL CHECK(cell_size_x_m > 0),
  cell_size_y_m REAL NOT NULL CHECK(cell_size_y_m > 0),
  depth_max_m REAL NOT NULL CHECK(depth_max_m > 0),
  vertical_step_m REAL NOT NULL CHECK(vertical_step_m > 0),
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Fuentes de evidencia
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

-- Sondeos
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

-- Intervalos de sondeo
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

-- Muestras
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

-- Resultados minerales
CREATE TABLE IF NOT EXISTS mineral_result (
  id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES sample(id) ON DELETE CASCADE,
  mineral_name TEXT NOT NULL,
  formula TEXT,
  identification_method TEXT NOT NULL,
  abundance_value REAL CHECK(abundance_value >= 0 AND abundance_value <= 100),
  abundance_unit TEXT,
  uncertainty REAL,
  detection_limit REAL,
  report_id TEXT,
  source_id TEXT NOT NULL REFERENCES evidence_source(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Resultados granulométricos
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

-- Columnas estratigráficas
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

-- Intervalos estratigráficos
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

-- Observaciones de voxeles (solo los que tienen evidencia)
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_created ON project(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_borehole_project ON borehole(project_id);
CREATE INDEX IF NOT EXISTS idx_interval_borehole ON borehole_interval(borehole_id);
CREATE INDEX IF NOT EXISTS idx_sample_borehole ON sample(borehole_id);
CREATE INDEX IF NOT EXISTS idx_mineral_sample ON mineral_result(sample_id);
CREATE INDEX IF NOT EXISTS idx_grain_sample ON grain_size_result(sample_id);
CREATE INDEX IF NOT EXISTS idx_strat_column ON stratigraphic_column(project_id);
CREATE INDEX IF NOT EXISTS idx_strat_interval_column ON stratigraphic_interval(column_id);
CREATE INDEX IF NOT EXISTS idx_voxel_project ON voxel_observation(project_id);

-- Insertar versión inicial
INSERT OR IGNORE INTO schema_version (version, description) VALUES (1, 'Esquema inicial GEO-MARTE 3D');
