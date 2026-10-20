import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '../database/connection.js';
import { v4 as uuid } from 'uuid';

const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  crs: z.string().max(50).optional(),
  verticalDatum: z.string().max(50).optional(),
  gridCellsX: z.number().int().min(1),
  gridCellsY: z.number().int().min(1),
  cellSizeXM: z.number().positive(),
  cellSizeYM: z.number().positive(),
  depthMaxM: z.number().positive(),
  verticalStepM: z.number().positive(),
});

export const registerProjectRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/projects
  app.get('/', async () => {
    const db = getDatabase();
    const projects = db.prepare('SELECT * FROM project ORDER BY created_at DESC').all();
    return projects;
  });

  // POST /api/projects
  app.post('/', async (request, reply) => {
    const validation = projectSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Datos de proyecto inválidos',
        details: validation.error.issues,
      });
    }

    const db = getDatabase();
    const id = `proj-${uuid()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO project (id, name, description, crs, vertical_datum, grid_cells_x, grid_cells_y,
        cell_size_x_m, cell_size_y_m, depth_max_m, vertical_step_m, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.name,
      validation.data.description || '',
      validation.data.crs || null,
      validation.data.verticalDatum || null,
      validation.data.gridCellsX,
      validation.data.gridCellsY,
      validation.data.cellSizeXM,
      validation.data.cellSizeYM,
      validation.data.depthMaxM,
      validation.data.verticalStepM,
      now,
      now
    );

    return reply.status(201).send({ id, ...validation.data, created_at: now, updated_at: now });
  });

  // GET /api/projects/:id
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM project WHERE id = ?').get(request.params.id);
    
    if (!project) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }
    
    return project;
  });

  // GET /api/projects/:id/grid
  app.get<{ Params: { id: string } }>('/:id/grid', async (request, reply) => {
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM project WHERE id = ?').get(request.params.id) as any;
    
    if (!project) {
      return reply.status(404).send({ error: 'Proyecto no encontrado' });
    }

    const levels = Math.floor(project.depth_max_m / project.vertical_step_m + 0.0001);
    const totalVoxels = project.grid_cells_x * project.grid_cells_y * levels;
    const observations = db.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN state = \'UNKNOWN\' THEN 1 ELSE 0 END) as unknown FROM voxel_observation WHERE project_id = ?'
    ).get(request.params.id) as any;

    return {
      projectId: request.params.id,
      gridCellsX: project.grid_cells_x,
      gridCellsY: project.grid_cells_y,
      cellSizeXM: project.cell_size_x_m,
      cellSizeYM: project.cell_size_y_m,
      depthMaxM: project.depth_max_m,
      verticalStepM: project.vertical_step_m,
      levels,
      totalVoxels,
      observations: {
        total: observations?.total || 0,
        unknown: observations?.unknown || 0,
      },
    };
  });
};
