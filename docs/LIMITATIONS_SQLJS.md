# Limitaciones de Persistencia SQLite en Navegador (sql.js)

**Proyecto:** GEO-MARTE 3D — SAE SPACE AI  
**Fase:** 00.2 — Auditoría y estabilización  
**Fecha:** 2026

---

## Resumen ejecutivo

La Fase 00 implementa persistencia SQLite en el navegador mediante **sql.js** (SQLite compilado a WebAssembly). Esta solución es **funcional para demostración y desarrollo local**, pero tiene limitaciones críticas que deben resolverse en fases posteriores con un backend real (Fastify + better-sqlite3).

---

## Limitaciones identificadas

### 1. Persistencia en localStorage

**Problema:** Los datos se almacenan en `localStorage`, que tiene un límite típico de 5-10 MB por origen.

**Impacto:**
- No escalable para proyectos con miles de sondeos o millones de voxeles
- Riesgo de pérdida de datos si el usuario limpia el almacenamiento del navegador
- No compartido entre dispositivos ni usuarios

**Mitigación actual:**
- Se exporta la base de datos completa a base64 y se guarda en localStorage
- Se documenta claramente que es una solución de demostración

**Resolución futura (Fase 01+):**
- Backend Fastify con better-sqlite3 (archivo SQLite en servidor)
- API REST para operaciones CRUD
- Posible migración a PostgreSQL para producción

---

### 2. Concurrencia y bloqueos

**Problema:** sql.js no soporta concurrencia real. Cada operación es síncrona y bloqueante.

**Impacto:**
- No apto para aplicaciones multiusuario
- Operaciones largas (importación CSV grande) bloquean la interfaz

**Mitigación actual:**
- Operaciones en lotes pequeños
- Feedback visual durante operaciones largas

**Resolución futura:**
- Backend con pool de conexiones SQLite
- Transacciones atómicas en servidor
- WebSockets para notificaciones en tiempo real

---

### 3. Integridad de datos

**Problema:** No hay mecanismo de backup automático ni replicación.

**Impacto:**
- Pérdida total de datos si falla el navegador o el dispositivo
- No hay historial de cambios ni capacidad de rollback

**Mitigación actual:**
- Exportación manual a JSON/CSV
- Validaciones estrictas antes de escribir

**Resolución futura:**
- Backup automático en servidor
- Sistema de versionado de datos
- Capacidad de restauración desde backup

---

### 4. Rendimiento con grandes volúmenes

**Problema:** WebAssembly tiene overhead de memoria y CPU.

**Impacto:**
- Lentitud con más de 10,000 registros
- Consumo elevado de memoria del navegador

**Mitigación actual:**
- Paginación en la UI
- Carga diferida de voxeles (solo los visibles)
- InstancedMesh para renderizado eficiente

**Resolución futura:**
- Backend con índices optimizados
- Caché de consultas frecuentes
- CDN para datos estáticos

---

### 5. Seguridad

**Problema:** Los datos en localStorage son accesibles por JavaScript en el mismo origen.

**Impacto:**
- Vulnerable a XSS (Cross-Site Scripting)
- No hay cifrado en reposo

**Mitigación actual:**
- No se almacenan datos sensibles (contraseñas, tokens)
- Validación de entradas para prevenir inyección

**Resolución futura:**
- Backend con autenticación y autorización
- Cifrado de datos sensibles
- HTTPS obligatorio
- Headers de seguridad (CSP, HSTS)

---

### 6. Migraciones de esquema

**Problema:** Las migraciones se aplican al iniciar la aplicación, pero no hay control de versiones centralizado.

**Impacto:**
- Dificultad para sincronizar esquemas entre usuarios
- Riesgo de inconsistencia si dos usuarios tienen versiones diferentes

**Mitigación actual:**
- Tabla `schema_version` para tracking
- Migraciones idempotentes (CREATE TABLE IF NOT EXISTS)

**Resolución futura:**
- Migraciones centralizadas en backend
- Script de migración versionado en repositorio
- Rollback automático si falla una migración

---

## Tabla de migraciones actuales

| Versión | Descripción | Tablas creadas |
|---------|-------------|----------------|
| 1 | Esquema inicial | project, evidence_source, borehole, borehole_interval, sample, mineral_result, grain_size_result, voxel_observation |
| 2 | Columnas estratigráficas | stratigraphic_column, stratigraphic_interval |

---

## Recomendaciones para Fase 01

1. **Implementar backend Fastify:**
   - better-sqlite3 para persistencia real
   - API REST con validación Zod
   - Middleware de autenticación (JWT)

2. **Migrar datos de localStorage a servidor:**
   - Script de exportación/importación
   - Validación de integridad
   - Backup automático

3. **Implementar sistema de versionado:**
   - Git-like para datos científicos
   - Capacidad de rollback
   - Auditoría de cambios

4. **Optimizar rendimiento:**
   - Índices en columnas frecuentes
   - Consultas preparadas
   - Caché de resultados

5. **Mejorar seguridad:**
   - HTTPS obligatorio
   - Rate limiting en API
   - Validación de entradas en backend
   - Cifrado de datos sensibles

---

## Conclusión

La persistencia con sql.js es **adecuada para la Fase 00** (demostración y desarrollo local), pero **no es viable para producción**. La Fase 01 debe implementar un backend real con Fastify + SQLite/PostgreSQL para garantizar escalabilidad, seguridad e integridad de datos.

**Estado:** Documentado y aceptado como limitación conocida de la Fase 00.
