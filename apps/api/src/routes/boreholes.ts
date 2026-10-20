import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '../database/connection.js';
import { v4 as uuid } from 'uuid';

const boreholeSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  x: z.number().finite(),
  y: z.number().finite(),
  collarElevation: z.number().finite().optional(),
  totalDepthM: z.number().positive(),
  drillingMethod: z.string().max(100).optional(),
  crs: z.string().max(50).optional(),
  sourceId: z.string().min(1),
  positionAccuracy: z.string().max(100).optional(),
});

const intervalSchema = z.object({
  boreholeId: z.string().min(1),
  depthFromM: z.number().min(0),
  depthToM: z.number().positive(),
  lithologyRaw: z.string().max(500).optional(),
  textureRaw: z.string().max(500).optional(),
  observationMethod: z.string().min(1),
  sourceId: z.string().min(1),
  observedAt: z.string().optional(),
  verticalResolutionM: z.number().positive().optional(),
}).refine(data => data.depthToM > data.depthFromM, {
  message: 'depthToM debe ser mayor que depthFromM',
  path: ['depthToM'],
});

export const registerBoreholeRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', async (request, reply) => {
    const validation = boreholeSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const db = getDatabase();
    const id = `bh-${uuid()}`;

    db.prepare(`
      INSERT INTO borehole (id, project_id, name, x, y, collar_elevation, total_depth_m, drilling_method, crs, source_id, position_accuracy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.projectId,
      validation.data.name,
      validation.data.x,
      validation.data.y,
      validation.data.collarElevation || null,
      validation.data.totalDepthM,
      validation.data.drillingMethod || null,
      validation.data.crs || null,
      validation.data.sourceId,
      validation.data.positionAccuracy || null
    );

    return reply.status(201).send({ id, ...validation.data });
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const db = getDatabase();
    const borehole = db.prepare('SELECT * FROM borehole WHERE id = ?').get(request.params.id);
    if (!borehole) return reply.status(404).send({ error: 'Sondeo no encontrado' });
    return borehole;
  });

  app.get<{ Params: { id: string } }>('/:id/intervals', async (request, reply) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM borehole_interval WHERE borehole_id = ? ORDER BY depth_from_m').all(request.params.id);
  });

  app.post('/intervals', async (request, reply) => {
    const validation = intervalSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const db = getDatabase();
    const id = `int-${uuid()}`;

    db.prepare(`
      INSERT INTO borehole_interval (id, borehole_id, depth_from_m, depth_to_m, lithology_raw, texture_raw, observation_method, source_id, observed_at, vertical_resolution_m)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.boreholeId,
      validation.data.depthFromM,
      validation.data.depthToM,
      validation.data.lithologyRaw || null,
      validation.data.textureRaw || null,
      validation.data.observationMethod,
      validation.data.sourceId,
      validation.data.observedAt || null,
      validation.data.verticalResolutionM || null
    );

    return reply.status(201).send({ id, ...validation.data });
  });
};
