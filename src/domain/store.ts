// GEO-MARTE 3D — Store de estado (simulación frontend de la API)
// En producción esto se conectaría al backend Fastify/SQLite

import { Project, Voxel, EvidenceSource, Borehole, BoreholeInterval, KnowledgeState } from './types';
import { DEFAULT_GRID, generateGrid, countVoxels, countUnknownVoxels } from './grid';

export interface AppState {
  projects: Project[];
  voxels: Voxel[];
  sources: EvidenceSource[];
  boreholes: Borehole[];
  intervals: BoreholeInterval[];
  currentProjectId: string | null;
  selectedVoxel: Voxel | null;
  selectedDepth: number;
}

export function createInitialState(): AppState {
  const demoProject: Project = {
    id: 'demo-001',
    name: 'Demo GEO-MARTE 2×2×20m',
    description: 'Modelo demostrativo de 2×2 m con 20 m de profundidad. Todos los voxeles en estado UNKNOWN. Sin datos geológicos verificados.',
    gridCellsX: 2,
    gridCellsY: 2,
    cellSizeXM: DEFAULT_GRID.cellSizeXM,
    cellSizeYM: DEFAULT_GRID.cellSizeYM,
    depthMaxM: DEFAULT_GRID.maxDepthM,
    verticalStepM: DEFAULT_GRID.verticalStepM,
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoVoxels = generateGrid(demoProject.id, {
    cellSizeXM: demoProject.cellSizeXM,
    cellSizeYM: demoProject.cellSizeYM,
    verticalStepM: demoProject.verticalStepM,
    maxDepthM: demoProject.depthMaxM,
    gridCellsX: demoProject.gridCellsX,
    gridCellsY: demoProject.gridCellsY,
  }, 'UNKNOWN');

  const demoSource: EvidenceSource = {
    id: 'src-demo-001',
    title: 'Datos sintéticos de demostración',
    organization: 'SAE Space AI',
    sourceType: 'other',
    description: 'Fuente de demostración. No contiene datos geológicos reales. SYNTHETIC_TEST_DATA=true.',
  };

  return {
    projects: [demoProject],
    voxels: demoVoxels,
    sources: [demoSource],
    boreholes: [],
    intervals: [],
    currentProjectId: demoProject.id,
    selectedVoxel: null,
    selectedDepth: 0,
  };
}

export function getProjectStats(state: AppState, projectId: string) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return null;

  const projectVoxels = state.voxels.filter(v => v.projectId === projectId);
  const totalVoxels = countVoxels({
    cellSizeXM: project.cellSizeXM,
    cellSizeYM: project.cellSizeYM,
    verticalStepM: project.verticalStepM,
    maxDepthM: project.depthMaxM,
    gridCellsX: project.gridCellsX,
    gridCellsY: project.gridCellsY,
  });
  const unknownCount = countUnknownVoxels(projectVoxels);
  const levels = Math.round(project.depthMaxM / project.verticalStepM);

  return {
    totalVoxels,
    unknownCount,
    observedCount: projectVoxels.filter(v => v.state === 'OBSERVED').length,
    levels,
    columns: project.gridCellsX * project.gridCellsY,
    projectBoreholes: state.boreholes.filter(b => b.projectId === projectId).length,
    projectIntervals: state.intervals.filter(i => {
      const bh = state.boreholes.find(b => b.id === i.boreholeId);
      return bh?.projectId === projectId;
    }).length,
  };
}

export function updateVoxelState(
  state: AppState,
  voxelId: string,
  newState: KnowledgeState,
  evidenceId?: string
): AppState {
  return {
    ...state,
    voxels: state.voxels.map(v =>
      v.id === voxelId ? { ...v, state: newState, evidenceId, version: v.version + 1 } : v
    ),
  };
}

export function addBorehole(state: AppState, borehole: Borehole): AppState {
  return {
    ...state,
    boreholes: [...state.boreholes, borehole],
  };
}

export function addInterval(state: AppState, interval: BoreholeInterval): AppState {
  return {
    ...state,
    intervals: [...state.intervals, interval],
  };
}

export function addSource(state: AppState, source: EvidenceSource): AppState {
  return {
    ...state,
    sources: [...state.sources, source],
  };
}
