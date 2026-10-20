import { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '../database/connection.js';
import { v4 as uuid } from 'uuid';

export const registerImportRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/imports/boreholes - Importar sondeos desde CSV
  app.post('/boreholes', async (request, reply) => {
    const data = request.body as any;
    
    if (!data.projectId || !data.sourceId || !Array.isArray(data.intervals)) {
      return reply.status(400).send({ error: 'Datos de importación inválidos' });
    }

    const db = getDatabase();
    const boreholeId = `bh-${uuid()}`;

    // Crear sondeo
    db.prepare(`
      INSERT INTO borehole (id, project_id, name, x, y, total_depth_m, source_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      boreholeId,
      data.projectId,
      data.name || `Sondeo importado ${new Date().toISOString()}`,
      data.x || 0,
      data.y || 0,
      data.totalDepthM || 20,
      data.sourceId
    );

    // Crear intervalos
    const insertInterval = db.prepare(`
      INSERT INTO borehole_interval (id, borehole_id, depth_from_m, depth_to_m, lithology_raw, observation_method, source_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((intervals: any[]) => {
      for (const interval of intervals) {
        insertInterval.run(
          `int-${uuid()}`,
          boreholeId,
          interval.depthFromM,
          interval.depthToM,
          interval.lithologyRaw || null,
          interval.observationMethod || 'desconocido',
          data.sourceId
        );
      }
    });

    insertMany(data.intervals);

    return reply.status(201).send({
      boreholeId,
      intervalsImported: data.intervals.length,
    });
  });

  // POST /api/imports/stratigraphy - Importar columnas estratigráficas
  app.post('/stratigraphy', async (request, reply) => {
    const data = request.body as any;
    
    if (!data.column || !Array.isArray(data.intervals)) {
      return reply.status(400).send({ error: 'Datos de importación inválidos' });
    }

    const db = getDatabase();
    const columnId = data.column.id || `col-${uuid()}`;
    const now = new Date().toISOString();

    // Crear columna
    db.prepare(`
      INSERT INTO stratigraphic_column (id, project_id, name, x, y, total_depth_m, source_id, is_synthetic, synthetic_notice, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      columnId,
      data.column.projectId || 'demo-001',
      data.column.name || 'Columna importada',
      data.column.x || 0,
      data.column.y || 0,
      data.column.totalDepthM || 20,
      data.column.sourceId || 'src-imported',
      data.column.isSynthetic ? 1 : 0,
      data.column.syntheticNotice || null,
      now,
      now
    );

    // Crear intervalos
    const insertInterval = db.prepare(`
      INSERT INTO stratigraphic_interval (id, column_id, depth_from_m, depth_to_m, lithology_raw, observation_method, source_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((intervals: any[]) => {
      for (const interval of intervals) {
        insertInterval.run(
          `int-${uuid()}`,
          columnId,
          interval.depthFromM,
          interval.depthToM,
          interval.lithologyRaw || null,
          interval.observationMethod || 'desconocido',
          interval.sourceId || data.column.sourceId || 'src-imported'
        );
      }
    });

    insertMany(data.intervals);

    return reply.status(201).send({
      columnId,
      intervalsImported: data.intervals.length,
    });
  });
};
