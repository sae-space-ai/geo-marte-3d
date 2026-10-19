// GEO-MARTE 3D — Servicio de API (simulación del backend Fastify)
// En producción, estas funciones serían rutas REST en Fastify
// SAE SPACE AI — Mineral-01

import {
  initDatabase,
  insertProject,
  getAllProjects,
  getProjectById,
  insertEvidenceSource,
  getAllEvidenceSources,
  insertBorehole,
  getAllBoreholes,
  insertBoreholeInterval,
  getHealthStatus,
  countVoxelObservations,
  CURRENT_SCHEMA_VERSION,
  DbProject,
} from '../database/sqlite';

import { validateBorehole, validateInterval, validateProject, validateGrainSize } from '../domain/validation';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: { field: string; message: string; code: string }[];
  statusCode: number;
}

let dbInitialized = false;

export async function ensureDb(): Promise<void> {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET /health
export async function getHealth(): Promise<ApiResponse<any>> {
  await ensureDb();
  const health = getHealthStatus();
  return {
    success: true,
    statusCode: 200,
    data: {
      status: health.status,
      version: '0.1.0',
      phase: 'FASE_00',
      schemaVersion: health.schemaVersion,
      dbReady: health.dbReady,
      timestamp: new Date().toISOString(),
    },
  };
}

// GET /api/projects
export async function getProjects(): Promise<ApiResponse<DbProject[]>> {
  await ensureDb();
  const projects = getAllProjects();
  return { success: true, statusCode: 200, data: projects };
}

// POST /api/projects
export async function createProject(input: any): Promise<ApiResponse<DbProject>> {
  await ensureDb();

  // Validación
  const validation = validateProject(input);
  if (!validation.success) {
    return {
      success: false,
      statusCode: 400,
      error: 'Datos de proyecto inválidos',
      errors: validation.errors,
    };
  }

  const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const project: DbProject = {
    id,
    name: input.name,
    description: input.description || '',
    crs: input.crs || null,
    vertical_datum: input.verticalDatum || null,
    origin_x: input.origin?.x || null,
    origin_y: input.origin?.y || null,
    grid_cells_x: input.gridCellsX,
    grid_cells_y: input.gridCellsY,
    cell_size_x_m: input.cellSizeXM,
    cell_size_y_m: input.cellSizeYM,
    depth_max_m: input.depthMaxM,
    vertical_step_m: input.verticalStepM,
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: now,
    updated_at: now,
  };

  const ok = insertProject(project);
  if (!ok) {
    return { success: false, statusCode: 500, error: 'Error al crear proyecto' };
  }

  return { success: true, statusCode: 201, data: project };
}

// GET /api/projects/:id
export async function getProject(id: string): Promise<ApiResponse<DbProject>> {
  await ensureDb();
  const project = getProjectById(id);
  if (!project) {
    return { success: false, statusCode: 404, error: 'Proyecto no encontrado' };
  }
  return { success: true, statusCode: 200, data: project };
}

// GET /api/projects/:id/grid
export async function getProjectGrid(id: string): Promise<ApiResponse<any>> {
  await ensureDb();
  const project = getProjectById(id);
  if (!project) {
    return { success: false, statusCode: 404, error: 'Proyecto no encontrado' };
  }

  const levels = Math.round(project.depth_max_m / project.vertical_step_m);
  const totalVoxels = project.grid_cells_x * project.grid_cells_y * levels;
  const observations = countVoxelObservations(id);

  return {
    success: true,
    statusCode: 200,
    data: {
      projectId: id,
      gridCellsX: project.grid_cells_x,
      gridCellsY: project.grid_cells_y,
      cellSizeXM: project.cell_size_x_m,
      cellSizeYM: project.cell_size_y_m,
      depthMaxM: project.depth_max_m,
      verticalStepM: project.vertical_step_m,
      levels,
      totalVoxels,
      observations,
    },
  };
}

// GET /api/sources
export async function getSources(): Promise<ApiResponse<any[]>> {
  await ensureDb();
  const sources = getAllEvidenceSources();
  return { success: true, statusCode: 200, data: sources };
}

// POST /api/sources
export async function createSource(input: any): Promise<ApiResponse<any>> {
  await ensureDb();

  if (!input.title || !input.organization || !input.sourceType || !input.description) {
    return {
      success: false,
      statusCode: 400,
      error: 'Faltan campos obligatorios: title, organization, sourceType, description',
    };
  }

  const id = `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ok = insertEvidenceSource({
    id,
    title: input.title,
    organization: input.organization,
    source_type: input.sourceType,
    url: input.url,
    reference: input.reference,
    license: input.license,
    description: input.description,
  });

  if (!ok) {
    return { success: false, statusCode: 500, error: 'Error al crear fuente' };
  }

  return { success: true, statusCode: 201, data: { id, ...input } };
}

// GET /api/projects/:id/boreholes
export async function getBoreholes(projectId: string): Promise<ApiResponse<any[]>> {
  await ensureDb();
  const all = getAllBoreholes();
  const filtered = all.filter(b => b.project_id === projectId);
  return { success: true, statusCode: 200, data: filtered };
}

// POST /api/projects/:id/boreholes
export async function createBorehole(projectId: string, input: any): Promise<ApiResponse<any>> {
  await ensureDb();

  const project = getProjectById(projectId);
  if (!project) {
    return { success: false, statusCode: 404, error: 'Proyecto no encontrado' };
  }

  const validation = validateBorehole(input);
  if (!validation.success) {
    return {
      success: false,
      statusCode: 400,
      error: 'Datos de sondeo inválidos',
      errors: validation.errors,
    };
  }

  const id = `bh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ok = insertBorehole({
    id,
    project_id: projectId,
    name: input.name,
    x: input.x,
    y: input.y,
    total_depth_m: input.totalDepthM,
    drilling_method: input.drillingMethod,
    source_id: input.sourceId,
  });

  if (!ok) {
    return { success: false, statusCode: 500, error: 'Error al crear sondeo' };
  }

  return { success: true, statusCode: 201, data: { id, projectId, ...input } };
}

// POST /api/projects/:id/intervals
export async function createInterval(projectId: string, input: any): Promise<ApiResponse<any>> {
  await ensureDb();

  const validation = validateInterval(input);
  if (!validation.success) {
    return {
      success: false,
      statusCode: 400,
      error: 'Datos de intervalo inválidos',
      errors: validation.errors,
    };
  }

  const id = `int-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ok = insertBoreholeInterval({
    id,
    borehole_id: input.boreholeId,
    depth_from_m: input.depthFromM,
    depth_to_m: input.depthToM,
    lithology_raw: input.lithologyRaw,
    observation_method: input.observationMethod,
    source_id: input.sourceId,
  });

  if (!ok) {
    return { success: false, statusCode: 500, error: 'Error al crear intervalo' };
  }

  return { success: true, statusCode: 201, data: { id, ...input } };
}

// GET /api/system/scientific-status
export async function getScientificStatus(): Promise<ApiResponse<any>> {
  await ensureDb();
  const projects = getAllProjects();
  const sources = getAllEvidenceSources();
  const boreholes = getAllBoreholes();

  return {
    success: true,
    statusCode: 200,
    data: {
      phase: 'FASE_00',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      totalProjects: projects.length,
      totalSources: sources.length,
      totalBoreholes: boreholes.length,
      verifiedData: false,
      warning: 'SIN DATOS GEOLÓGICOS VERIFICADOS — Fase 00: base ejecutable',
      principles: [
        'No se inventa litología, mineralogía ni mediciones',
        'Los espacios sin datos figuran como UNKNOWN',
        'Un sondeo puntual no valida un voxel completo',
        'Trazabilidad completa de fuente a geometría',
        'Los datos de Marte no afirman composición terrestre',
      ],
    },
  };
}
