import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '../database/connection.js';
import { v4 as uuid } from 'uuid';

const columnSchema = z.object({
  projectId: z.string().min(1),
  boreholeId: z.string().optional(),
  name: z.string().min(1).max(200),
  x: z.number().finite(),
  y: z.number().finite(),
  totalDepthM: z.number().positive(),
  sourceId: z.string().min(1),
  isSynthetic: z.boolean().optional(),
  syntheticNotice: z.string().optional(),
  notes: z.string().optional(),
});

const intervalSchema = z.object({
  columnId: z.string().min(1),
  depthFromM: z.number().min(0),
  depthToM: z.number().positive(),
  lithologyRaw: z.string().max(500).optional(),
  textureRaw: z.string().max(500).optional(),
  colorHex: z.string().max(7).optional(),
  observationMethod: z.string().min(1),
  sourceId: z.string().min(1),
  notes: z.string().optional(),
}).refine(data => data.depthToM > data.depthFromM, {
  message: 'depthToM debe ser mayor que depthFromM',
  path: ['depthToM'],
});

export const registerStratigraphyRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', async (request, reply) => {
    const validation = columnSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const db = getDatabase();
    const id = `col-${uuid()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO stratigraphic_column (id, project_id, borehole_id, name, x, y, total_depth_m, source_id, is_synthetic, synthetic_notice, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.projectId,
      validation.data.boreholeId || null,
      validation.data.name,
      validation.data.x,
      validation.data.y,
      validation.data.totalDepthM,
      validation.data.sourceId,
      validation.data.isSynthetic ? 1 : 0,
      validation.data.syntheticNotice || null,
      validation.data.notes || null,
      now,
      now
    );

    return reply.status(201).send({ id, ...validation.data, created_at: now, updated_at: now });
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const db = getDatabase();
    const column = db.prepare('SELECT * FROM stratigraphic_column WHERE id = ?').get(request.params.id);
    if (!column) return reply.status(404).send({ error: 'Columna no encontrada' });
    return column;
  });

  app.get<{ Params: { id: string } }>('/:id/intervals', async (request, reply) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM stratigraphic_interval WHERE column_id = ? ORDER BY depth_from_m').all(request.params.id);
  });

  app.post('/intervals', async (request, reply) => {
    const validation = intervalSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const db = getDatabase();
    const id = `int-${uuid()}`;

    db.prepare(`
      INSERT INTO stratigraphic_interval (id, column_id, depth_from_m, depth_to_m, lithology_raw, texture_raw, color_hex, observation_method, source_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.columnId,
      validation.data.depthFromM,
      validation.data.depthToM,
      validation.data.lithologyRaw || null,
      validation.data.textureRaw || null,
      validation.data.colorHex || null,
      validation.data.observationMethod,
      validation.data.sourceId,
      validation.data.notes || null
    );

    return reply.status(201).send({ id, ...validation.data });
  });
};
