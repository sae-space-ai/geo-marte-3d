# GEO-MARTE 3D API — Backend Fastify

**Proyecto:** GEO-MARTE 3D — SAE SPACE AI — Mineral-01  
**Fase:** 01 (planificado)  
**Estado:** Código completo, pendiente de ejecución en entorno Node

---

## Descripción

Backend REST API para GEO-MARTE 3D implementado con Fastify + TypeScript + better-sqlite3. Proporciona persistencia real en servidor, validación de datos y migraciones versionadas.

---

## Estructura

```
apps/api/
├── src/
│   ├── server.ts              # Entry point
│   ├── app.ts                 # Configuración Fastify
│   ├── database/
│   │   ├── connection.ts      # Conexión SQLite
│   │   ├── migrate.ts         # Script de migración
│   │   └── migrations/
│   │       └── 001_initial.sql
│   └── routes/
│       ├── health.ts          # GET /health
│       ├── projects.ts        # CRUD proyectos
│       ├── sources.ts         # CRUD fuentes
│       ├── boreholes.ts       # CRUD sondeos
│       ├── stratigraphy.ts    # CRUD columnas estratigráficas
│       ├── imports.ts         # Importación CSV/JSON
│       └── system.ts          # Estado científico
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Instalación

```bash
cd apps/api
npm install
```

---

## Configuración

Copia `.env.example` a `.env` y ajusta las variables:

```bash
cp .env.example .env
```

Variables principales:
- `PORT`: Puerto del servidor (default: 3001)
- `DATABASE_PATH`: Ruta del archivo SQLite
- `CORS_ORIGIN`: Orígenes permitidos
- `LOG_LEVEL`: Nivel de logging

---

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Migraciones
```bash
npm run migrate
```

---

## API Endpoints

### Health
- `GET /health` — Estado del sistema

### Proyectos
- `GET /api/projects` — Listar proyectos
- `POST /api/projects` — Crear proyecto
- `GET /api/projects/:id` — Obtener proyecto
- `GET /api/projects/:id/grid` — Obtener grid de voxeles

### Fuentes
- `GET /api/sources` — Listar fuentes
- `POST /api/sources` — Crear fuente
- `GET /api/sources/:id` — Obtener fuente

### Sondeos
- `POST /api/boreholes` — Crear sondeo
- `GET /api/boreholes/:id` — Obtener sondeo
- `GET /api/boreholes/:id/intervals` — Listar intervalos
- `POST /api/boreholes/intervals` — Crear intervalo

### Estratigrafía
- `POST /api/stratigraphy` — Crear columna
- `GET /api/stratigraphy/:id` — Obtener columna
- `GET /api/stratigraphy/:id/intervals` — Listar intervalos
- `POST /api/stratigraphy/intervals` — Crear intervalo

### Importación
- `POST /api/imports/boreholes` — Importar sondeos
- `POST /api/imports/stratigraphy` — Importar columnas

### Sistema
- `GET /api/system/scientific-status` — Estado científico

---

## Base de datos

### Esquema (migración 001)

**Tablas principales:**
- `project` — Proyectos con configuración de grid
- `evidence_source` — Fuentes de evidencia
- `borehole` — Sondeos
- `borehole_interval` — Intervalos de sondeo
- `sample` — Muestras
- `mineral_result` — Resultados minerales
- `grain_size_result` — Resultados granulométricos
- `stratigraphic_column` — Columnas estratigráficas
- `stratigraphic_interval` — Intervalos estratigráficos
- `voxel_observation` — Observaciones de voxeles

**Características:**
- Claves foráneas con CASCADE
- CHECK constraints para validación
- Índices para rendimiento
- Migraciones versionadas

---

## Validaciones

Todas las rutas validan entradas con Zod:
- Profundidades positivas
- Espesores > 0
- Coordenadas finitas
- source_id obligatorio
- Granulometría: suma 95-105%

---

## Seguridad

- CORS restrictivo
- Validación de entradas
- SQL parametrizado (sin inyección)
- Límites de tamaño de archivo (10 MB)
- Logs sin datos sensibles
- Autenticación JWT (planificada)

---

## Limitaciones

- **Fase 00:** Frontend usa sql.js en navegador (localStorage)
- **Fase 01:** Backend Fastify + SQLite servidor
- **Fase 02+:** Migración de datos, autenticación, multiusuario

---

## Pruebas

```bash
npm run test
```

Pruebas incluidas:
- Validación de entradas
- Operaciones CRUD
- Migraciones
- Endpoints API

---

## Integración con frontend

El frontend puede usar la API cuando esté disponible:

```typescript
// Ejemplo: Crear proyecto
const response = await fetch('http://localhost:3001/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mi proyecto',
    gridCellsX: 10,
    gridCellsY: 10,
    cellSizeXM: 1,
    cellSizeYM: 1,
    depthMaxM: 20,
    verticalStepM: 0.1,
  }),
});
```

Cuando la API no está disponible, el frontend usa sql.js en modo local/demostración.

---

**Estado:** Código completo, pendiente de ejecución en entorno Node  
**Próximo paso:** Ejecutar en Codespaces y verificar funcionalidad
