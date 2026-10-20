import { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '../database/connection.js';

export const registerSystemRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/system/scientific-status
  app.get('/scientific-status', async () => {
    const db = getDatabase();
    
    const stats = {
      projects: (db.prepare('SELECT COUNT(*) as count FROM project').get() as any).count,
      sources: (db.prepare('SELECT COUNT(*) as count FROM evidence_source').get() as any).count,
      boreholes: (db.prepare('SELECT COUNT(*) as count FROM borehole').get() as any).count,
      intervals: (db.prepare('SELECT COUNT(*) as count FROM borehole_interval').get() as any).count,
      columns: (db.prepare('SELECT COUNT(*) as count FROM stratigraphic_column').get() as any).count,
      stratIntervals: (db.prepare('SELECT COUNT(*) as count FROM stratigraphic_interval').get() as any).count,
      samples: (db.prepare('SELECT COUNT(*) as count FROM sample').get() as any).count,
      mineralResults: (db.prepare('SELECT COUNT(*) as count FROM mineral_result').get() as any).count,
      voxelObservations: (db.prepare('SELECT COUNT(*) as count FROM voxel_observation').get() as any).count,
    };

    return {
      phase: 'FASE_00',
      schemaVersion: 1,
      verifiedData: false,
      warning: 'SIN DATOS GEOLÓGICOS VERIFICADOS — Fase 00: base ejecutable',
      statistics: stats,
      principles: [
        'No se inventa litología, mineralogía ni mediciones',
        'Los espacios sin datos figuran como UNKNOWN',
        'Un sondeo puntual no valida un voxel completo',
        'Trazabilidad completa de fuente a geometría',
        'Los datos de Marte no afirman composición terrestre',
      ],
    };
  });
};
