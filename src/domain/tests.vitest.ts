// GEO-MARTE 3D — Pruebas Vitest automatizadas
// SAE SPACE AI — Mineral-01
// FASE 00.2 — Pruebas de regresión PR#1

import { describe, it, expect } from 'vitest';
import {
  getLevelsCount,
  generateGrid,
  generateVoxel,
  DEFAULT_GRID,
} from '../domain/grid';
import { boreholeIntervalSchema } from '../domain/validation';
import {
  validateColumn,
  validateInterval,
  validateColumnIntervals,
} from '../database/stratigraphy';

describe('FASE 00.2 — PR#1 Regression Tests', () => {
  describe('PR#1-1: Rechazo de intervalos de profundidad invertida o espesor cero', () => {
    it('rechaza intervalo con profundidad invertida (from > to)', () => {
      const result = boreholeIntervalSchema.safeParse({
        boreholeId: 'bh1',
        depthFromM: 5.0,
        depthToM: 3.0,
        observationMethod: 'visual',
        sourceId: 'src1',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza intervalo con espesor cero (from === to)', () => {
      const result = boreholeIntervalSchema.safeParse({
        boreholeId: 'bh1',
        depthFromM: 5.0,
        depthToM: 5.0,
        observationMethod: 'visual',
        sourceId: 'src1',
      });
      expect(result.success).toBe(false);
    });

    it('acepta intervalo válido con espesor positivo', () => {
      const result = boreholeIntervalSchema.safeParse({
        boreholeId: 'bh1',
        depthFromM: 3.0,
        depthToM: 5.0,
        observationMethod: 'visual',
        sourceId: 'src1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('PR#1-3: Visor representa los 200 niveles (0-20m)', () => {
    it('genera exactamente 200 niveles para 20m con paso 0.1m', () => {
      const levels = getLevelsCount(20, 0.1);
      expect(levels).toBe(200);
    });

    it('genera 800 voxeles para grid 2x2 con 200 niveles', () => {
      const grid = generateGrid('test', DEFAULT_GRID);
      expect(grid.length).toBe(800);
    });

    it('el último nivel termina exactamente en 20.0m', () => {
      const lastLevel = 199;
      const voxel = generateVoxel('test', 0, 0, lastLevel, DEFAULT_GRID);
      expect(voxel.depthToM).toBe(20.0);
    });
  });

  describe('PR#1-5: Redondeo no excede profundidad máxima', () => {
    it('Math.floor garantiza no exceder profundidad máxima', () => {
      const levels = getLevelsCount(20.0, 0.1);
      const maxDepthReached = levels * 0.1;
      expect(maxDepthReached).toBeLessThanOrEqual(20.0 + 0.0001);
    });

    it('lanza error si un voxel excede la profundidad máxima', () => {
      // Intentar crear un voxel en nivel 200 (que sería 20.0-20.1m)
      expect(() => {
        generateVoxel('test', 0, 0, 200, DEFAULT_GRID);
      }).toThrow();
    });

    it('no lanza error para el último nivel válido (199)', () => {
      expect(() => {
        generateVoxel('test', 0, 0, 199, DEFAULT_GRID);
      }).not.toThrow();
    });
  });

  describe('Columna estratigráfica — validaciones', () => {
    it('rechaza columna con coordenadas infinitas', () => {
      const errors = validateColumn({
        projectId: 'p1',
        name: 'Test',
        x: Infinity,
        y: 0,
        totalDepthM: 20,
        sourceId: 'src1',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rechaza intervalo con profundidad negativa', () => {
      const errors = validateInterval({
        columnId: 'c1',
        depthFromM: -1,
        depthToM: 2,
        observationMethod: 'visual',
        sourceId: 'src1',
      });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('detecta solapamientos entre intervalos', () => {
      const intervals = [
        { id: 'i1', columnId: 'c1', depthFromM: 0, depthToM: 5, observationMethod: 'visual', sourceId: 'src1', qualityStatus: 'valid' as const, createdAt: '' },
        { id: 'i2', columnId: 'c1', depthFromM: 3, depthToM: 8, observationMethod: 'visual', sourceId: 'src1', qualityStatus: 'valid' as const, createdAt: '' },
      ];
      const report = validateColumnIntervals(intervals, 20);
      expect(report.overlaps.length).toBeGreaterThan(0);
    });

    it('detecta espacios UNKNOWN entre intervalos', () => {
      const intervals = [
        { id: 'i1', columnId: 'c1', depthFromM: 0, depthToM: 2, observationMethod: 'visual', sourceId: 'src1', qualityStatus: 'valid' as const, createdAt: '' },
        { id: 'i2', columnId: 'c1', depthFromM: 5, depthToM: 8, observationMethod: 'visual', sourceId: 'src1', qualityStatus: 'valid' as const, createdAt: '' },
      ];
      const report = validateColumnIntervals(intervals, 20);
      expect(report.gaps.length).toBeGreaterThan(0);
    });
  });
});
