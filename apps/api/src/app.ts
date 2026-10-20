import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { runMigrations } from './database/migrate.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerSourceRoutes } from './routes/sources.js';
import { registerBoreholeRoutes } from './routes/boreholes.js';
import { registerStratigraphyRoutes } from './routes/stratigraphy.js';
import { registerImportRoutes } from './routes/imports.js';
import { registerSystemRoutes } from './routes/system.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });

  // Migraciones
  runMigrations();

  // Rutas
  await app.register(registerHealthRoutes, { prefix: '/health' });
  await app.register(registerProjectRoutes, { prefix: '/api/projects' });
  await app.register(registerSourceRoutes, { prefix: '/api/sources' });
  await app.register(registerBoreholeRoutes, { prefix: '/api/boreholes' });
  await app.register(registerStratigraphyRoutes, { prefix: '/api/stratigraphy' });
  await app.register(registerImportRoutes, { prefix: '/api/imports' });
  await app.register(registerSystemRoutes, { prefix: '/api/system' });

  // Manejo de errores
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: error.message || 'Error interno del servidor',
      statusCode: error.statusCode || 500,
    });
  });

  return app;
}

export async function startServer(): Promise<void> {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Servidor GEO-MARTE 3D API ejecutándose en http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
