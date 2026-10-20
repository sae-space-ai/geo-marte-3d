import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '../database/connection.js';
import { v4 as uuid } from 'uuid';

const sourceSchema = z.object({
  title: z.string().min(1).max(500),
  organization: z.string().min(1).max(200),
  sourceType: z.enum(['borehole', 'geophysical', 'laboratory', 'cartography', 'bibliography', 'other']),
  url: z.string().url().optional(),
  reference: z.string().max(500).optional(),
  license: z.string().max(200).optional(),
  description: z.string().max(2000),
});

export const registerSourceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM evidence_source ORDER BY created_at DESC').all();
  });

  app.post('/', async (request, reply) => {
    const validation = sourceSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: validation.error.issues });
    }

    const db = getDatabase();
    const id = `src-${uuid()}`;

    db.prepare(`
      INSERT INTO evidence_source (id, title, organization, source_type, url, reference, license, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.title,
      validation.data.organization,
      validation.data.sourceType,
      validation.data.url || null,
      validation.data.reference || null,
      validation.data.license || null,
      validation.data.description
    );

    return reply.status(201).send({ id, ...validation.data });
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const db = getDatabase();
    const source = db.prepare('SELECT * FROM evidence_source WHERE id = ?').get(request.params.id);
    if (!source) return reply.status(404).send({ error: 'Fuente no encontrada' });
    return source;
  });
};
