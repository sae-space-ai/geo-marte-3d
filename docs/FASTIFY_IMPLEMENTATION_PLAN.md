# Implementación de Backend Fastify + SQLite — Plan para Fase 01

**Proyecto:** GEO-MARTE 3D — SAE SPACE AI  
**Estado:** Planificado para Fase 01  
**Fecha:** 2026

---

## Objetivo

Implementar un backend real con Fastify + better-sqlite3 que reemplace la persistencia en navegador (sql.js) y proporcione:
- Persistencia duradera en servidor
- API REST con validación
- Autenticación y autorización
- Escalabilidad para producción

---

## Estructura propuesta

```
apps/
  api/
    src/
      app.ts                    # Configuración Fastify
      server.ts                 # Entry point
      database/
        connection.ts           # better-sqlite3 connection
        migrations/
          001_initial.sql
          002_stratigraphy.sql
        migrate.ts              # Script de migración
      routes/
        health.ts               # GET /health
        projects.ts             # CRUD proyectos
        boreholes.ts            # CRUD sondeos
        intervals.ts            # CRUD intervalos
        sources.ts              # CRUD fuentes
        stratigraphy.ts         # CRUD columnas estratigráficas
        imports.ts              # Importación CSV
      repositories/
        projectRepository.ts
        boreholeRepository.ts
        intervalRepository.ts
        sourceRepository.ts
        stratigraphyRepository.ts
      services/
        projectService.ts
        boreholeService.ts
        validationService.ts
      middleware/
        auth.ts                 # JWT authentication
        validation.ts           # Zod validation middleware
        errorHandler.ts         # Error handling
      utils/
        logger.ts               # Pino logger
        config.ts               # Environment config
    package.json
    tsconfig.json
    .env.example
```

---

## Dependencias necesarias

```json
{
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/jwt": "^8.0.0",
    "@fastify/multipart": "^8.1.0",
    "better-sqlite3": "^9.4.3",
    "zod": "^3.22.4",
    "pino": "^8.17.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0"
  }
}
```

---

## API REST propuesta

### Health
- `GET /health` — Estado del sistema

### Projects
- `GET /api/projects` — Listar proyectos
- `POST /api/projects` — Crear proyecto
- `GET /api/projects/:id` — Obtener proyecto
- `PUT /api/projects/:id` — Actualizar proyecto
- `DELETE /api/projects/:id` — Eliminar proyecto
- `GET /api/projects/:id/grid` — Obtener grid de voxeles

### Boreholes
- `GET /api/projects/:projectId/boreholes` — Listar sondeos
- `POST /api/projects/:projectId/boreholes` — Crear sondeo
- `GET /api/boreholes/:id` — Obtener sondeo
- `PUT /api/boreholes/:id` — Actualizar sondeo
- `DELETE /api/boreholes/:id` — Eliminar sondeo

### Intervals
- `GET /api/boreholes/:boreholeId/intervals` — Listar intervalos
- `POST /api/boreholes/:boreholeId/intervals` — Crear intervalo
- `PUT /api/intervals/:id` — Actualizar intervalo
- `DELETE /api/intervals/:id` — Eliminar intervalo

### Sources
- `GET /api/sources` — Listar fuentes
- `POST /api/sources` — Crear fuente
- `GET /api/sources/:id` — Obtener fuente

### Stratigraphy
- `GET /api/projects/:projectId/stratigraphy` — Listar columnas
- `POST /api/projects/:projectId/stratigraphy` — Crear columna
- `GET /api/stratigraphy/:id` — Obtener columna
- `GET /api/stratigraphy/:id/intervals` — Obtener intervalos
- `POST /api/stratigraphy/:id/intervals` — Crear intervalo
- `DELETE /api/stratigraphy/:id` — Eliminar columna

### Imports
- `POST /api/imports/boreholes` — Importar sondeos CSV
- `POST /api/imports/stratigraphy` — Importar columnas CSV/JSON

### System
- `GET /api/system/scientific-status` — Estado científico

---

## Ejemplo de implementación

### app.ts

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDatabase } from './database/connection';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret',
  });

  // Initialize database
  await initDatabase();

  // Routes
  app.register(import('./routes/health'));
  app.register(import('./routes/projects'), { prefix: '/api/projects' });
  app.register(import('./routes/boreholes'), { prefix: '/api/boreholes' });
  app.register(import('./routes/sources'), { prefix: '/api/sources' });
  app.register(import('./routes/stratigraphy'), { prefix: '/api/stratigraphy' });
  app.register(import('./routes/imports'), { prefix: '/api/imports' });

  return app;
}
```

### database/connection.ts

```typescript
import Database from 'better-sqlite3';
import { migrate } from './migrate';

let db: Database.Database | null = null;

export async function initDatabase() {
  db = new Database(process.env.DATABASE_PATH || './data/geo-marte-3d.sqlite');
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Run migrations
  migrate(db);
  
  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
```

### routes/projects.ts

```typescript
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '../database/connection';

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  gridCellsX: z.number().int().min(1),
  gridCellsY: z.number().int().min(1),
  cellSizeXM: z.number().positive(),
  cellSizeYM: z.number().positive(),
  depthMaxM: z.number().positive(),
  verticalStepM: z.number().positive(),
});

const projectsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request, reply) => {
    const db = getDatabase();
    const projects = db.prepare('SELECT * FROM project ORDER BY created_at DESC').all();
    return projects;
  });

  app.post('/', async (request, reply) => {
    const validation = projectSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: validation.error.issues,
      });
    }

    const db = getDatabase();
    const id = `proj-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO project (id, name, description, grid_cells_x, grid_cells_y,
        cell_size_x_m, cell_size_y_m, depth_max_m, vertical_step_m, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.data.name,
      validation.data.description || '',
      validation.data.gridCellsX,
      validation.data.gridCellsY,
      validation.data.cellSizeXM,
      validation.data.cellSizeYM,
      validation.data.depthMaxM,
      validation.data.verticalStepM,
      now,
      now
    );

    return reply.status(201).send({ id, ...validation.data });
  });
};

export default projectsRoutes;
```

---

## Migración desde sql.js

### Script de exportación (navegador → servidor)

```typescript
// En el frontend
async function exportToServer() {
  const db = getDatabase();
  const data = db.export();
  
  // Convertir a JSON legible
  const tables = ['project', 'borehole', 'borehole_interval', 'evidence_source', 'stratigraphic_column', 'stratigraphic_interval'];
  const exported = {};
  
  for (const table of tables) {
    const result = db.exec(`SELECT * FROM ${table}`);
    if (result.length > 0) {
      exported[table] = result[0].values.map(row => {
        const obj = {};
        result[0].columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
    }
  }
  
  // Enviar al servidor
  await fetch('/api/imports/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exported),
  });
}
```

---

## Pruebas automatizadas

```typescript
// tests/api/projects.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app';

describe('Projects API', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/projects returns empty array initially', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects',
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('POST /api/projects creates a project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: {
        name: 'Test Project',
        gridCellsX: 2,
        gridCellsY: 2,
        cellSizeXM: 1,
        cellSizeYM: 1,
        depthMaxM: 20,
        verticalStepM: 0.1,
      },
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.json().name).toBe('Test Project');
  });

  it('POST /api/projects rejects invalid input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: {
        name: '', // Invalid: empty name
      },
    });
    
    expect(response.statusCode).toBe(400);
  });
});
```

---

## Checklist de implementación

- [ ] Crear estructura de directorios `apps/api/`
- [ ] Configurar Fastify con plugins (CORS, JWT, multipart)
- [ ] Implementar conexión better-sqlite3
- [ ] Crear migraciones SQL versionadas
- [ ] Implementar rutas CRUD para todas las entidades
- [ ] Añadir validación Zod en todas las rutas
- [ ] Implementar middleware de autenticación
- [ ] Configurar logger Pino
- [ ] Escribir pruebas Vitest para todas las rutas
- [ ] Documentar API con OpenAPI/Swagger
- [ ] Implementar script de migración desde sql.js
- [ ] Configurar variables de entorno (.env)
- [ ] Añadir rate limiting
- [ ] Configurar HTTPS para producción

---

## Conclusión

Esta estructura proporciona una base sólida para migrar de la persistencia en navegador (sql.js) a un backend real con Fastify + SQLite. La implementación debe realizarse en la **Fase 01**, manteniendo el frontend actual intacto y añadiendo una capa de servicios que se conecte al backend en lugar de sql.js.

**Estado:** Planificado, no implementado en Fase 00.
