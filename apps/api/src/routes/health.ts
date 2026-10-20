import { FastifyPluginAsync } from 'fastify';

export const registerHealthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    return {
      status: 'ok',
      version: '0.1.0',
      phase: 'FASE_00',
      timestamp: new Date().toISOString(),
      service: 'geo-marte-3d-api',
    };
  });
};
