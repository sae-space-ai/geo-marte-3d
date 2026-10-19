// GEO-MARTE 3D — Validadores con Zod
// Principio: nunca inventar datos científicos

import { z } from 'zod';

// --- Esquemas base ---

export const coordinateSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const depthRangeSchema = z.object({
  depthFromM: z.number().min(0, 'La profundidad desde no puede ser negativa'),
  depthToM: z.number().min(0, 'La profundidad hasta no puede ser negativa'),
}).refine(data => data.depthToM > data.depthFromM, {
  message: 'La profundidad hasta debe ser mayor que la profundidad desde (espesor cero no válido)',
  path: ['depthToM'],
});

export const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  description: z.string().max(2000).optional().default(''),
  crs: z.string().max(50).optional(),
  verticalDatum: z.string().max(50).optional(),
  gridCellsX: z.number().int().min(1),
  gridCellsY: z.number().int().min(1),
  cellSizeXM: z.number().positive(),
  cellSizeYM: z.number().positive(),
  depthMaxM: z.number().positive(),
  verticalStepM: z.number().positive(),
});

export const evidenceSourceSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(500),
  organization: z.string().min(1, 'La organización es obligatoria').max(200),
  sourceType: z.enum(['borehole', 'geophysical', 'laboratory', 'cartography', 'bibliography', 'other']),
  url: z.string().url().optional(),
  reference: z.string().max(500).optional(),
  license: z.string().max(200).optional(),
  description: z.string().max(2000),
});

export const boreholeSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  x: z.number().finite('Coordenada X inválida'),
  y: z.number().finite('Coordenada Y inválida'),
  collarElevation: z.number().finite().optional(),
  totalDepthM: z.number().positive('La profundidad total debe ser positiva'),
  drillingMethod: z.string().max(100).optional(),
  crs: z.string().max(50).optional(),
  sourceId: z.string().min(1, 'El sourceId es obligatorio'),
  positionAccuracy: z.string().max(100).optional(),
});

export const boreholeIntervalSchema = z.object({
  boreholeId: z.string().min(1, 'El boreholeId es obligatorio'),
  depthFromM: z.number().min(0, 'Profundidad desde no puede ser negativa'),
  depthToM: z.number().min(0, 'Profundidad hasta no puede ser negativa'),
  lithologyRaw: z.string().max(500).optional(),
  textureRaw: z.string().max(500).optional(),
  observationMethod: z.string().min(1, 'El método de observación es obligatorio'),
  sourceId: z.string().min(1, 'El sourceId es obligatorio'),
  observedAt: z.string().optional(),
  verticalResolutionM: z.number().positive().optional(),
});

export const sampleSchema = z.object({
  boreholeId: z.string().min(1, 'El boreholeId es obligatorio'),
  depthFromM: z.number().min(0),
  depthToM: z.number().positive(),
  sampleType: z.string().min(1, 'El tipo de muestra es obligatorio'),
  method: z.string().max(200).optional(),
  date: z.string().optional(),
  laboratory: z.string().max(200).optional(),
  custodyReference: z.string().max(200).optional(),
  sourceId: z.string().min(1, 'El sourceId es obligatorio'),
});

export const mineralResultSchema = z.object({
  sampleId: z.string().min(1, 'El sampleId es obligatorio'),
  mineralName: z.string().min(1, 'El nombre del mineral es obligatorio'),
  formula: z.string().max(200).optional(),
  identificationMethod: z.string().min(1, 'El método de identificación es obligatorio'),
  abundanceValue: z.number().min(0).max(100).optional(),
  abundanceUnit: z.string().max(20).optional(),
  uncertainty: z.number().min(0).optional(),
  detectionLimit: z.number().min(0).optional(),
  reportId: z.string().max(200).optional(),
  sourceId: z.string().min(1, 'El sourceId es obligatorio'),
});

export const grainSizeSchema = z.object({
  sampleId: z.string().min(1, 'El sampleId es obligatorio'),
  gravelPercent: z.number().min(0).max(100).optional(),
  sandPercent: z.number().min(0).max(100).optional(),
  siltPercent: z.number().min(0).max(100).optional(),
  clayPercent: z.number().min(0).max(100).optional(),
  testMethod: z.string().min(1, 'El método de ensayo es obligatorio'),
  sourceId: z.string().min(1, 'El sourceId es obligatorio'),
}).refine(data => {
  const values = [data.gravelPercent, data.sandPercent, data.siltPercent, data.clayPercent];
  const present = values.filter(v => v !== undefined && v !== null);
  if (present.length === 4) {
    const sum = present.reduce((a, b) => a + b, 0);
    return sum >= 95 && sum <= 105;
  }
  return true;
}, {
  message: 'La suma de las cuatro fracciones granulométricas debe estar entre 95% y 105%',
});

export const csvRowSchema = z.object({
  borehole_id: z.string().min(1, 'borehole_id es obligatorio'),
  x_m: z.string().min(1, 'x_m es obligatorio'),
  y_m: z.string().min(1, 'y_m es obligatorio'),
  depth_from_m: z.string().min(1, 'depth_from_m es obligatorio'),
  depth_to_m: z.string().min(1, 'depth_to_m es obligatorio'),
  lithology_raw: z.string().optional(),
  observation_method: z.string().min(1, 'observation_method es obligatorio'),
  source_id: z.string().min(1, 'source_id es obligatorio'),
  observed_at: z.string().optional(),
});

// --- Funciones de validación ---

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: { field: string; message: string; code: string }[];
}

export function validateProject(input: unknown): ValidationResult<z.infer<typeof projectSchema>> {
  const result = projectSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: `VALIDATION_${issue.code}`,
    })),
  };
}

export function validateBorehole(input: unknown): ValidationResult<z.infer<typeof boreholeSchema>> {
  const result = boreholeSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: `VALIDATION_${issue.code}`,
    })),
  };
}

export function validateInterval(input: unknown): ValidationResult<z.infer<typeof boreholeIntervalSchema>> {
  const result = boreholeIntervalSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: `VALIDATION_${issue.code}`,
    })),
  };
}

export function validateGrainSize(input: unknown): ValidationResult<z.infer<typeof grainSizeSchema>> {
  const result = grainSizeSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: `VALIDATION_${issue.code}`,
    })),
  };
}
