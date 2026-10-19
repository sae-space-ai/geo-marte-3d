# Instrucciones para Aplicar Cambios desde GitHub Codespaces
## GEO-MARTE 3D — Fase 00.2

**Repositorio:** https://github.com/sae-space-ai/geo-marte-3d  
**Pull Request:** https://github.com/sae-space-ai/geo-marte-3d/pull/2

---

## 📋 Lista de Archivos a Aplicar

### Archivos Modificados (6):
1. `package.json`
2. `vitest.config.ts`
3. `src/App.tsx`
4. `src/domain/grid.ts`
5. `src/domain/tests.ts`
6. `src/features/viewer3d/Viewer3D.tsx`

### Archivos Nuevos (7):
7. `src/domain/tests.vitest.ts`
8. `.eslintrc.json`
9. `.github/workflows/ci.yml`
10. `docs/LIMITATIONS_SQLJS.md`
11. `docs/FASTIFY_IMPLEMENTATION_PLAN.md`
12. `FASE_00.2_AUDITORIA.md`
13. `FASE_00.2_FINAL.md`

---

## 🚀 Pasos para Aplicar desde Codespaces

### 1. Abrir Codespaces
```bash
# Ir a https://github.com/sae-space-ai/geo-marte-3d
# Click en "Code" → "Codespaces" → "Create codespace on main"
```

### 2. Crear rama de trabajo
```bash
git checkout -b fix/pr2-final-corrections
```

### 3. Copiar contenido de archivos

Para cada archivo de la lista anterior, copiar el contenido desde el sandbox y pegarlo en el archivo correspondiente en Codespaces.

**Método alternativo:** Si tienes acceso al sandbox, puedes descargar todos los archivos como ZIP y subirlos.

### 4. Instalar dependencias
```bash
npm install
```

### 5. Verificar typecheck
```bash
npm run typecheck
```

**Resultado esperado:** Sin errores

### 6. Ejecutar pruebas Vitest
```bash
npm run test
```

**Resultado esperado:**
```
✓ src/domain/tests.vitest.ts (X tests)
✓ src/domain/tests.ts (35 tests)

Test Files  2 passed (2)
Tests  35 passed (35)
```

### 7. Ejecutar ESLint
```bash
npm run lint
```

**Resultado esperado:** Sin errores (puede haber advertencias)

### 8. Verificar build
```bash
npm run build
```

**Resultado esperado:**
```
✓ 717 modules transformed.
dist/index.html                   0.84 kB
dist/assets/index-*.css          28.99 kB
dist/assets/tests-*.js            8.67 kB
dist/assets/index-*.js        1191.59 kB
✓ built in X.XXs
```

### 9. Commit de cambios
```bash
git add .
git commit -m "fix: correcciones finales PR#2

- package.json: scripts funcionales (lint, test, typecheck, coverage)
- vitest.config.ts: descubrimiento correcto de pruebas (*.vitest.ts)
- App.tsx: transmitir selectedDepth real al Viewer3D
- Conservadas todas las correcciones de PR#1:
  * InstancedMesh con useEffect
  * Visor 200 niveles completos (ventana deslizante)
  * CSV valida campos obligatorios
  * Grid con Math.floor para no exceder profundidad

Añadidas 5 pruebas de regresión (total: 35).
Documentación: limitaciones sql.js, plan Fastify.

Fixes PR#2"
```

### 10. Push a GitHub
```bash
git push -u origin fix/pr2-final-corrections
```

### 11. Crear/actualizar Pull Request

**Opción A: Si PR #2 ya existe y quieres actualizarla:**
```bash
gh pr checkout 2
git merge fix/pr2-final-corrections
git push origin main
```

**Opción B: Si quieres crear una nueva PR:**
```bash
gh pr create \
  --title "Fix: Correcciones finales PR#2" \
  --body "## Correcciones aplicadas

### package.json
- Scripts funcionales: lint, test, typecheck, coverage

### vitest.config.ts
- Descubrimiento correcto de pruebas (*.vitest.ts)
- passWithNoTests: false

### App.tsx
- Transmitir selectedDepth real al Viewer3D
- Slider navega 0-199 correctamente

### Conservadas correcciones PR#1
- InstancedMesh con useEffect
- Visor 200 niveles completos
- CSV valida campos obligatorios
- Grid con Math.floor

### Pruebas
- 35 pruebas implementadas
- 5 pruebas de regresión PR#1

### Documentación
- Limitaciones sql.js
- Plan Fastify

Fixes PR#2"
```

### 12. Verificar GitHub Actions
```bash
# Ir a https://github.com/sae-space-ai/geo-marte-3d/actions
# Verificar que los 3 jobs pasan:
# - lint ✅
# - test ✅
# - build ✅
```

### 13. Fusionar PR (solo si todo pasa)
```bash
gh pr merge 2 --merge --delete-branch
```

---

## ✅ Checklist de Verificación

Antes de fusionar, verificar:

- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run test` → 35 pruebas pasando
- [ ] `npm run lint` → sin errores críticos
- [ ] `npm run build` → build exitoso
- [ ] Visor 3D navegable 0-20m (slider 0-199)
- [ ] 800 voxeles UNKNOWN en demo
- [ ] 6 intervalos sintéticos marcados
- [ ] GitHub Actions: lint, test, build pasan
- [ ] No se modifica `sae-space-ai/minerales`
- [ ] PR #2 actualizada con todos los cambios

---

## 🔍 Verificación Manual en Navegador

Después de `npm run dev`:

### Visor 3D
1. Ir a sección "Visor 3D"
2. Mover slider de 0 a 199
3. Verificar que visualización se actualiza
4. Verificar etiqueta muestra nivel y profundidad correctos

### Columna Estratigráfica
1. Ir a sección "Columna estratigráfica"
2. Verificar aviso "DATOS SINTÉTICOS"
3. Verificar 6 intervalos marcados como sintéticos
4. Probar añadir intervalo con validaciones

### Control Científico
1. Ir a sección "Control científico"
2. Click "Ejecutar pruebas"
3. Verificar 35/35 pasando

---

## ⚠️ Problemas Comunes

### Error: "Cannot find module 'vitest'"
```bash
npm install vitest --save-dev
```

### Error: "ESLint configuration not found"
Verificar que `.eslintrc.json` existe en la raíz del proyecto.

### Error: "Tests not found"
Verificar que `vitest.config.ts` incluye `'src/**/*.vitest.ts'` en `include`.

### Error: "selectedDepth is not defined"
Verificar que `App.tsx` tiene `const [selectedDepth, setSelectedDepth] = useState(0);`

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs de GitHub Actions
2. Verificar que todos los archivos están copiados correctamente
3. Ejecutar `npm install` de nuevo
4. Limpiar caché: `rm -rf node_modules dist && npm install`

---

**Fecha:** 2026  
**Estado:** Instrucciones listas para aplicar en Codespaces
