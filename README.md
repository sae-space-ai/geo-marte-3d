# GEO-MARTE 3D — SAE SPACE AI

**Proyecto:** Mineral-01  
**Fase actual:** FASE 00 — Base ejecutable y verificable  
**Estado:** Desarrollo activo

---

## Descripción

Plataforma de representación del subsuelo terrestre con datos comprobables. Inspirada metodológicamente en los rovers Perseverance y Curiosity de la NASA.

### Principio científico fundamental

**NUNCA se inventa litología, mineralogía, estratigrafía ni mediciones.**

- Los espacios sin datos figuran como **UNKNOWN**
- Un sondeo puntual NO valida automáticamente un voxel de 1 m²
- La resolución de la cuadrícula NO es la precisión de una medición
- Los datos de Marte NO se usan para afirmar la composición de una parcela terrestre

---

## Configuración del modelo demo

| Parámetro | Valor |
|-----------|-------|
| Resolución horizontal X | 1 m |
| Resolución horizontal Y | 1 m |
| Paso vertical | 0,10 m |
| Profundidad | 0 a 20 m |
| Grid | 2 × 2 columnas |
| Niveles por columna | 200 |
| **Total voxeles conceptuales** | **800** |
| **Estado inicial** | **100% UNKNOWN** |

---

## Tecnologías

### Frontend
- React 18 + TypeScript estricto
- Vite 6
- Tailwind CSS 4
- React Three Fiber + Three.js (visor 3D)
- Zod (validaciones)
- sql.js (SQLite en navegador)

### Persistencia
- SQLite en navegador (sql.js)
- Migraciones versionadas
- LocalStorage para persistencia

---

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Compilación para producción
npm run build

# Verificación de tipos
npm run typecheck
```

---

## Estructura del proyecto

```
src/
├── App.tsx                    # Aplicación principal
├── main.tsx                   # Entry point
├── index.css                  # Estilos
├── domain/
│   ├── types.ts               # Tipos TypeScript
│   ├── grid.ts                # Generador de malla de voxeles
│   ├── validation.ts          # Validadores Zod
│   ├── store.ts               # Estado de la aplicación
│   └── tests.ts               # 20 pruebas ejecutables
├── database/
│   └── sqlite.ts              # Persistencia SQLite + migraciones
├── services/
│   └── api.ts                 # Capa de servicios (simula API REST)
└── features/
    └── viewer3d/
        └── Viewer3D.tsx       # Visor 3D
```

---

## Secciones de la aplicación

1. **Inicio** — Resumen del proyecto y configuración
2. **Proyectos** — Gestión de proyectos
3. **Visor 3D** — Visualización de voxeles con Three.js
4. **Sondeos** — Registro de sondeos con validación
5. **Muestras** — Gestión de muestras y análisis
6. **Fuentes** — Catálogo de fuentes de evidencia
7. **Importación** — Importación CSV con previsualización
8. **Control científico** — Verificación de integridad y pruebas
9. **Tecnología marciana** — Documentación de instrumentos NASA
10. **Documentación** — Principios y referencias

---

## Validaciones implementadas

### Esquemas Zod
- `projectSchema`: configuración de proyecto
- `boreholeSchema`: sondeos con coordenadas finitas
- `boreholeIntervalSchema`: intervalos (rechaza espesor cero)
- `sampleSchema`: muestras con método y fuente
- `mineralResultSchema`: resultados minerales con método de identificación
- `grainSizeSchema`: granulometría (suma 95-105%)
- `coordinateSchema`: coordenadas finitas

### Validaciones críticas
- ✅ Rechazo de espesor cero
- ✅ Rechazo de profundidad negativa
- ✅ Rechazo de coordenadas inválidas (Infinity, NaN)
- ✅ Detección de IDs duplicados
- ✅ source_id obligatorio
- ✅ Granulometría: suma inválida rechazada

---

## Pruebas ejecutables (20 mínimas)

Las pruebas están en `src/domain/tests.ts` y se ejecutan en la sección "Control científico":

1. Columna 20 m → 200 niveles
2. Malla 2×2 → 800 voxeles
3. Primer nivel: 0,00–0,10 m
4. Último nivel: 19,90–20,00 m
5. No excede profundidad máxima
6. Rechazo de espesor cero
7. Rechazo de profundidad negativa
8. Rechazo de coordenadas inválidas
9. Sin IDs duplicados
10. Sin evidencia → UNKNOWN
11. Sondeo puntual ≠ voxel OBSERVED
12. Mineral sin muestra → no verificado
13. Granulometría >100% rechazada
14. Sin source_id → error
15. CSV malformado detectado
16. Estado del sistema: OK
17. Validación de entrada de proyecto
18. Datos geológicos inválidos rechazados
19. Demo: 800 voxeles UNKNOWN
20. Intervalo grueso ≠ múltiples mediciones

---

## Estados de conocimiento

| Estado | Color | Descripción |
|--------|-------|-------------|
| UNKNOWN | Gris | Sin datos verificados |
| OBSERVED | Azul | Observación directa |
| INTERPOLATED | Ámbar | Resultado calculado |
| INFERRED | Violeta | Interpretación |
| CONFLICT | Rojo | Evidencia incompatible |
| REJECTED | Gris claro | Registro excluido |

---

## Instrumentos NASA documentados

- **RIMFAX** (Perseverance): Radar de subsuelo
- **PIXL** (Perseverance): Fluorescencia de rayos X
- **SHERLOC** (Perseverance): Raman ultravioleta
- **SuperCam** (Perseverance): LIBS, Raman, IR
- **CheMin** (Curiosity): Difracción de rayos X
- **Mastcam-Z / WATSON**: Imágenes y microscopía

**Nota:** Estos instrumentos se documentan como referencia metodológica. Este proyecto NO posee dichos instrumentos ni cuenta con respaldo de NASA.

---

## Fuentes terrestres documentadas

- **IGME-CSIC**: Cartografía geológica, sondeos, litoteca
- **IGN / CNIG**: MDT, ortofotos, LiDAR
- **NASA PDS**: Datos planetarios (adaptación futura)
- **USGS**: Geología, hidrogeología, bibliotecas espectrales

---

## Roadmap

- **FASE 00**: Base ejecutable y verificable ← **ACTUAL**
- **FASE 01**: Georreferenciación y terrenos
- **FASE 02**: Cartografía IGME/IGN/CNIG
- **FASE 03**: Sondeos y análisis reales
- **FASE 04**: Radar y geofísica terrestre
- **FASE 05**: FRX, DRX, Raman y mineralogía
- **FASE 06**: Interpretación estratigráfica y 3D avanzado
- **FASE 07**: Interpolación e incertidumbre
- **FASE 08**: Procesamiento NASA PDS adaptable
- **FASE 09**: IA geológica verificable
- **FASE 10**: Gemelo digital e informes
- **FASE 11**: Rendimiento a gran escala
- **FASE 12**: Auditoría científica y preparación operativa

---

## Principios de integridad científica

1. **Trazabilidad completa**: fuente → geometría → profundidad → estado
2. **Método analítico obligatorio** para identificación de minerales
3. **Conservación de datos originales** y cadena de transformaciones
4. **Incertidumbre declarada** explícitamente
5. **UNKNOWN visible**: los espacios sin datos no se rellenan
6. **Separación** entre prueba sintética y evidencia real
7. **Versiones de esquema** y corrección no silenciosa de conflictos
8. **Un sondeo puntual NO convierte un voxel completo en OBSERVED**
9. **Los datos de Marte nunca se usan para afirmar composición terrestre**

---

## Seguridad

- ✅ Validación de entradas con Zod
- ✅ SQL parametrizado (sin inyección)
- ✅ Sin secretos embebidos en código
- ✅ CORS restrictivo (cuando haya backend)
- ✅ Límites de tamaño de archivo (10 MB CSV)

---

## Escalabilidad

| Área | Voxeles conceptuales |
|------|---------------------|
| 10 m² | 2.000 |
| 1.000 m² | 200.000 |
| 100.000 m² | 20.000.000 |

**Estrategias futuras:** PostGIS, chunking, instancing, caché, niveles de detalle.

---

## Estado actual

**FASE 00 PARCIAL** — Completada en entorno sandbox, publicación remota pendiente.

### Completado:
- ✅ Frontend React completo
- ✅ Visor 3D operativo
- ✅ Modelo de dominio con validaciones
- ✅ Persistencia SQLite real
- ✅ 20 pruebas ejecutables
- ✅ Importación CSV
- ✅ Documentación científica
- ✅ Build exitoso

### Pendiente (requiere entorno local):
- ⚠️ Backend Fastify real
- ⚠️ Vitest para pruebas automatizadas
- ⚠️ ESLint/Prettier
- ⚠️ GitHub Actions
- ⚠️ Publicación en GitHub
- ⚠️ Verificación de repositorio remoto

---

## Licencia

Pendiente de decisión del propietario. No se han incorporado licencias de código abierto sin autorización.

---

## Contacto

**Organización:** SAE Space AI  
**Proyecto:** GEO-MARTE 3D / Mineral-01  
**Repositorio previsto:** sae-space-ai/geo-marte-3d

---

**Última actualización:** 2026  
**Fase:** 00 — Base ejecutable y verificable
