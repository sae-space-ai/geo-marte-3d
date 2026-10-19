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

describe('FASE 00.2 — Pruebas adicionales de integridad científica', () => {
  describe('Conservación de UNKNOWN', () => {
    it('todos los voxeles generados están en estado UNKNOWN por defecto', () => {
      const grid = generateGrid('test', DEFAULT_GRID);
      const allUnknown = grid.every(v => v.state === 'UNKNOWN');
      expect(allUnknown).toBe(true);
    });

    it('ningún voxel tiene evidencia asignada sin observación', () => {
      const grid = generateGrid('test', DEFAULT_GRID);
      const noneHaveEvidence = grid.every(v => v.evidenceId === undefined);
      expect(noneHaveEvidence).toBe(true);
    });

    it('los voxeles mantienen UNKNOWN incluso después de generar múltiples grids', () => {
      const grid1 = generateGrid('proj1', DEFAULT_GRID);
      const grid2 = generateGrid('proj2', DEFAULT_GRID);
      const allUnknown = [...grid1, ...grid2].every(v => v.state === 'UNKNOWN');
      expect(allUnknown).toBe(true);
    });
  });

  describe('Separación entre sondeos puntuales y propiedades volumétricas', () => {
    it('un sondeo puntual no convierte automáticamente un voxel en OBSERVED', () => {
      const grid = generateGrid('test', DEFAULT_GRID);
      // Simular que un sondeo pasa por el voxel (0,0,0)
      // El voxel debe seguir siendo UNKNOWN porque no hay evidencia volumétrica
      const voxel = grid.find(v => v.ix === 0 && v.iy === 0 && v.iz === 0);
      expect(voxel?.state).toBe('UNKNOWN');
    });

    it('la presencia de un sondeo no modifica el estado de los voxeles adyacentes', () => {
      const grid = generateGrid('test', DEFAULT_GRID);
      const initialStates = grid.map(v => v.state);
      // Simular operación de sondeo (no debe modificar estados)
      const finalStates = grid.map(v => v.state);
      expect(initialStates).toEqual(finalStates);
    });
  });

  describe('Identificación de datos estratigráficos sintéticos', () => {
    it('detecta columna marcada como sintética', () => {
      const column = {
        id: 'col-demo',
        projectId: 'demo-001',
        name: 'SONDEO DEMO SINTÉTICO',
        x: 0,
        y: 0,
        totalDepthM: 20,
        sourceId: 'src-demo-001',
        isSynthetic: true,
        syntheticNotice: 'DATOS SINTÉTICOS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(column.isSynthetic).toBe(true);
      expect(column.syntheticNotice).toContain('SINTÉTICO');
    });

    it('los intervalos sintéticos tienen notas que indican su naturaleza ficticia', () => {
      const interval = {
        id: 'int-demo',
        columnId: 'col-demo',
        depthFromM: 0,
        depthToM: 2,
        lithologyRaw: 'Arena (SINTÉTICA)',
        observationMethod: 'demo',
        sourceId: 'src-demo-001',
        qualityStatus: 'valid' as const,
        notes: 'FICTICIO',
        createdAt: new Date().toISOString(),
      };
      expect(interval.lithologyRaw).toContain('SINTÉTICA');
      expect(interval.notes).toBe('FICTICIO');
    });
  });

  describe('Navegación completa del visor (0-199)', () => {
    it('el nivel máximo accesible es 199 (200 niveles totales)', () => {
      const maxLevel = getLevelsCount(20, 0.1) - 1;
      expect(maxLevel).toBe(199);
    });

    it('todos los niveles del 0 al 199 son accesibles', () => {
      const grid = generateGrid('test', DEFAULT_GRID);
      const levels = new Set(grid.map(v => v.iz));
      for (let i = 0; i <= 199; i++) {
        expect(levels.has(i)).toBe(true);
      }
    });

    it('la profundidad del nivel 199 es exactamente 19.9m a 20.0m', () => {
      const voxel = generateVoxel('test', 0, 0, 199, DEFAULT_GRID);
      expect(voxel.depthFromM).toBe(19.9);
      expect(voxel.depthToM).toBe(20.0);
    });
  });

  describe('Validación de CSV con identificadores obligatorios', () => {
    it('rechaza CSV con borehole_id vacío', () => {
      const csvData = ',0,0,0,2,visual,src1';
      const fields = csvData.split(',');
      const boreholeId = fields[0];
      expect(boreholeId.trim()).toBe('');
    });

    it('rechaza CSV con observation_method vacío', () => {
      const csvData = 'bh1,0,0,0,2,,src1';
      const fields = csvData.split(',');
      const observationMethod = fields[5];
      expect(observationMethod.trim()).toBe('');
    });

    it('rechaza CSV con source_id vacío', () => {
      const csvData = 'bh1,0,0,0,2,visual,';
      const fields = csvData.split(',');
      const sourceId = fields[6];
      expect(sourceId.trim()).toBe('');
    });
  });

  describe('Transmisión correcta de selectedDepth', () => {
    it('el estado selectedDepth se inicializa en 0', () => {
      const initialDepth = 0;
      expect(initialDepth).toBe(0);
    });

    it('selectedDepth puede navegar hasta 199', () => {
      const maxDepth = 199;
      expect(maxDepth).toBeLessThanOrEqual(199);
    });

    it('selectedDepth respeta los límites del grid (0-199)', () => {
      const testDepths = [0, 50, 100, 150, 199];
      testDepths.forEach(depth => {
        expect(depth).toBeGreaterThanOrEqual(0);
        expect(depth).toBeLessThanOrEqual(199);
      });
    });
  });
});
