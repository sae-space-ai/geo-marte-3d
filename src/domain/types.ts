// GEO-MARTE 3D — Modelo de dominio
// SAE SPACE AI — Mineral-01

export type KnowledgeState =
  | 'UNKNOWN'
  | 'OBSERVED'
  | 'INTERPOLATED'
  | 'INFERRED'
  | 'CONFLICT'
  | 'REJECTED';

export interface Voxel {
  id: string;
  projectId: string;
  ix: number;
  iy: number;
  iz: number;
  depthFromM: number;
  depthToM: number;
  depthFromMm: number;
  depthToMm: number;
  volumeM3: number;
  state: KnowledgeState;
  evidenceId?: string;
  version: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  crs?: string;
  verticalDatum?: string;
  origin?: { x: number; y: number };
  gridCellsX: number;
  gridCellsY: number;
  cellSizeXM: number;
  cellSizeYM: number;
  depthMaxM: number;
  verticalStepM: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceSource {
  id: string;
  title: string;
  organization: string;
  sourceType: 'borehole' | 'geophysical' | 'laboratory' | 'cartography' | 'bibliography' | 'other';
  url?: string;
  reference?: string;
  license?: string;
  retrievedAt?: string;
  sha256?: string;
  description: string;
}

export interface Borehole {
  id: string;
  projectId: string;
  name: string;
  x: number;
  y: number;
  collarElevation?: number;
  totalDepthM: number;
  drillingMethod?: string;
  crs?: string;
  sourceId: string;
  positionAccuracy?: string;
  createdAt: string;
}

export interface BoreholeInterval {
  id: string;
  boreholeId: string;
  depthFromM: number;
  depthToM: number;
  lithologyRaw?: string;
  textureRaw?: string;
  observationMethod: string;
  sourceId: string;
  observedAt?: string;
  verticalResolutionM?: number;
  qualityStatus: 'valid' | 'rejected' | 'conflict';
}

export interface Sample {
  id: string;
  boreholeId: string;
  depthFromM: number;
  depthToM: number;
  sampleType: string;
  method?: string;
  date?: string;
  laboratory?: string;
  custodyReference?: string;
  sourceId: string;
}

export interface MineralResult {
  id: string;
  sampleId: string;
  mineralName: string;
  formula?: string;
  identificationMethod: string;
  abundanceValue?: number;
  abundanceUnit?: string;
  uncertainty?: number;
  detectionLimit?: number;
  reportId?: string;
  sourceId: string;
}

export interface GrainSizeResult {
  id: string;
  sampleId: string;
  gravelPercent?: number;
  sandPercent?: number;
  siltPercent?: number;
  clayPercent?: number;
  testMethod: string;
  sourceId: string;
}

export interface GridConfig {
  cellSizeXM: number;
  cellSizeYM: number;
  verticalStepM: number;
  maxDepthM: number;
  gridCellsX: number;
  gridCellsY: number;
}

export interface ImportPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  errors: ImportError[];
  validRows: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  code: string;
}

export const KNOWLEDGE_COLORS: Record<KnowledgeState, string> = {
  UNKNOWN: '#6b7280',
  OBSERVED: '#3b82f6',
  INTERPOLATED: '#f59e0b',
  INFERRED: '#8b5cf6',
  CONFLICT: '#ef4444',
  REJECTED: '#9ca3af',
};

export const KNOWLEDGE_LABELS: Record<KnowledgeState, string> = {
  UNKNOWN: 'Sin datos',
  OBSERVED: 'Observado',
  INTERPOLATED: 'Interpolado',
  INFERRED: 'Inferido',
  CONFLICT: 'Conflicto',
  REJECTED: 'Rechazado',
};
