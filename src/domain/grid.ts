// GEO-MARTE 3D — Generador de malla de voxeles
// Principio: los voxeles sin observaciones son UNKNOWN
// No se inventa litología, mineralogía ni estratigrafía

import { Voxel, GridConfig, KnowledgeState } from './types';

export const DEFAULT_GRID: GridConfig = {
  cellSizeXM: 1.0,
  cellSizeYM: 1.0,
  verticalStepM: 0.1,
  maxDepthM: 20.0,
  gridCellsX: 2,
  gridCellsY: 2,
};

export function getLevelsCount(maxDepthM: number, verticalStepM: number): number {
  // CORRECCIÓN PR#1-5: Usar Math.floor para garantizar que no se exceda la profundidad máxima
  // Math.round podría generar un nivel adicional por errores de punto flotante
  return Math.floor(maxDepthM / verticalStepM + 0.0001); // +0.0001 para tolerancia de precisión
}

export function getDepthBoundsMm(iz: number, verticalStepM: number): { fromMm: number; toMm: number } {
  const stepMm = Math.round(verticalStepM * 1000);
  return {
    fromMm: iz * stepMm,
    toMm: (iz + 1) * stepMm,
  };
}

export function getDepthBoundsM(iz: number, verticalStepM: number): { fromM: number; toM: number } {
  return {
    fromM: parseFloat((iz * verticalStepM).toFixed(4)),
    toM: parseFloat(((iz + 1) * verticalStepM).toFixed(4)),
  };
}

export function generateVoxelId(projectId: string, ix: number, iy: number, iz: number): string {
  return `${projectId}_v${ix}_${iy}_${iz}`;
}

export function generateVoxel(
  projectId: string,
  ix: number,
  iy: number,
  iz: number,
  config: GridConfig,
  state: KnowledgeState = 'UNKNOWN'
): Voxel {
  const { fromM, toM } = getDepthBoundsM(iz, config.verticalStepM);
  const { fromMm, toMm } = getDepthBoundsMm(iz, config.verticalStepM);
  const volume = parseFloat((config.cellSizeXM * config.cellSizeYM * config.verticalStepM).toFixed(6));

  // CORRECCIÓN PR#1-5: Validación explícita para garantizar que ningún voxel exceda la profundidad máxima
  if (toM > config.maxDepthM + 0.0001) {
    throw new Error(`Voxel iz=${iz} excede profundidad máxima: ${toM}m > ${config.maxDepthM}m`);
  }

  return {
    id: generateVoxelId(projectId, ix, iy, iz),
    projectId,
    ix,
    iy,
    iz,
    depthFromM: fromM,
    depthToM: toM,
    depthFromMm: fromMm,
    depthToMm: toMm,
    volumeM3: volume,
    state,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

export function generateGrid(
  projectId: string,
  config: GridConfig,
  state: KnowledgeState = 'UNKNOWN'
): Voxel[] {
  const levels = getLevelsCount(config.maxDepthM, config.verticalStepM);
  const voxels: Voxel[] = [];

  for (let ix = 0; ix < config.gridCellsX; ix++) {
    for (let iy = 0; iy < config.gridCellsY; iy++) {
      for (let iz = 0; iz < levels; iz++) {
        voxels.push(generateVoxel(projectId, ix, iy, iz, config, state));
      }
    }
  }

  return voxels;
}

export function getVoxelByIndex(voxels: Voxel[], ix: number, iy: number, iz: number): Voxel | undefined {
  return voxels.find(v => v.ix === ix && v.iy === iy && v.iz === iz);
}

export function getVoxelsByColumn(voxels: Voxel[], ix: number, iy: number): Voxel[] {
  return voxels.filter(v => v.ix === ix && v.iy === iy).sort((a, b) => a.iz - b.iz);
}

export function getVoxelsByDepth(voxels: Voxel[], iz: number): Voxel[] {
  return voxels.filter(v => v.iz === iz);
}

export function getVoxelsByDepthRange(voxels: Voxel[], izFrom: number, izTo: number): Voxel[] {
  return voxels.filter(v => v.iz >= izFrom && v.iz <= izTo);
}

export function countVoxels(config: GridConfig): number {
  const levels = getLevelsCount(config.maxDepthM, config.verticalStepM);
  return config.gridCellsX * config.gridCellsY * levels;
}

export function countUnknownVoxels(voxels: Voxel[]): number {
  return voxels.filter(v => v.state === 'UNKNOWN').length;
}

export function validateGridConfig(config: Partial<GridConfig>): string[] {
  const errors: string[] = [];

  if (config.cellSizeXM !== undefined && config.cellSizeXM <= 0) {
    errors.push('cellSizeXM debe ser mayor que cero');
  }
  if (config.cellSizeYM !== undefined && config.cellSizeYM <= 0) {
    errors.push('cellSizeYM debe ser mayor que cero');
  }
  if (config.verticalStepM !== undefined && config.verticalStepM <= 0) {
    errors.push('verticalStepM debe ser mayor que cero');
  }
  if (config.maxDepthM !== undefined && config.maxDepthM <= 0) {
    errors.push('maxDepthM debe ser mayor que cero');
  }
  if (config.gridCellsX !== undefined && config.gridCellsX <= 0) {
    errors.push('gridCellsX debe ser mayor que cero');
  }
  if (config.gridCellsY !== undefined && config.gridCellsY <= 0) {
    errors.push('gridCellsY debe ser mayor que cero');
  }

  return errors;
}
