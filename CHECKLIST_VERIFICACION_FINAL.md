# ✅ CHECKLIST — VERIFICACIÓN FINAL PR#2
## GEO-MARTE 3D — Fase 00.2

**Repositorio:** https://github.com/sae-space-ai/geo-marte-3d  
**Pull Request:** https://github.com/sae-space-ai/geo-marte-3d/pull/2  
**Rama:** geo-marte-3d-phase-00-9ae8a

---

## 📋 ANTES DE EMPEZAR

- [ ] Abrir Codespaces en el repositorio
- [ ] Cambiar a la rama `geo-marte-3d-phase-00-9ae8a`
- [ ] Tener este checklist abierto para marcar cada paso

---

## 🔧 COPIA DE ARCHIVOS

### Archivos a copiar desde el sandbox:

- [ ] **`eslint.config.mjs`** (NUEVO)
  - [ ] Copiar contenido completo
  - [ ] Pegar en la raíz del proyecto
  - [ ] Verificar que el archivo existe

- [ ] **`package.json`** (MODIFICAR)
  - [ ] Abrir archivo actual
  - [ ] Reemplazar sección `scripts.lint` y `scripts.lint:fix`
  - [ ] Verificar que NO tiene `--ext .ts,.tsx`
  - [ ] Guardar cambios

- [ ] **`src/domain/tests.vitest.ts`** (REEMPLAZAR)
  - [ ] Copiar contenido completo desde sandbox
  - [ ] Reemplazar archivo existente
  - [ ] Verificar que tiene 35 pruebas (contar `it(`)

- [ ] **`.eslintrc.json`** (ELIMINAR)
  - [ ] Verificar que el archivo existe
  - [ ] Ejecutar: `rm .eslintrc.json`
  - [ ] Confirmar que fue eliminado

---

## 📦 INSTALACIÓN DE DEPENDENCIAS

- [ ] Ejecutar: `npm install`
- [ ] Verificar que no hay errores
- [ ] Confirmar que `package-lock.json` se actualizó
- [ ] Verificar que se instalaron:
  - [ ] `@eslint/js@^9.0.0`
  - [ ] `globals@^15.0.0`

---

## ✅ VERIFICACIÓN DE HERRAMIENTAS

### ESLint
- [ ] Ejecutar: `npm run lint`
- [ ] Verificar resultado:
  - ✅ Sin errores críticos
  - ⚠️ Advertencias permitidas (pero idealmente 0)
- [ ] Si hay errores, revisar y corregir

### TypeScript
- [ ] Ejecutar: `npm run typecheck`
- [ ] Verificar resultado:
  - ✅ Sin errores
  - ✅ Salida limpia
- [ ] Si hay errores, revisar tipos

### Vitest
- [ ] Ejecutar: `npm run test`
- [ ] Verificar resultado:
  - ✅ Test Files: 1 passed (1)
  - ✅ Tests: 35 passed (35)
- [ ] Si hay fallos, revisar pruebas individuales

### Build
- [ ] Ejecutar: `npm run build`
- [ ] Verificar resultado:
  - ✅ ✓ built in X.XXs
  - ✅ Sin errores
  - ✅ Archivos generados en `dist/`
- [ ] Verificar que existe `dist/index.html`

---

## 🔍 VERIFICACIÓN DE FUNCIONALIDAD

### Visor 3D
- [ ] Ejecutar: `npm run dev`
- [ ] Abrir navegador en http://localhost:5173
- [ ] Verificar:
  - [ ] Visor 3D carga correctamente
  - [ ] Slider de profundidad funciona (0-199)
  - [ ] Se muestran voxeles UNKNOWN
  - [ ] No hay errores en consola

### Columna Estratigráfica
- [ ] Navegar a sección "Columna estratigráfica"
- [ ] Verificar:
  - [ ] Se muestra aviso "DATOS SINTÉTICOS"
  - [ ] 6 intervalos marcados como sintéticos
  - [ ] Se pueden añadir/eliminar intervalos

### Pruebas en Navegador
- [ ] Navegar a sección "Control científico"
- [ ] Click en "Ejecutar pruebas"
- [ ] Verificar:
  - [ ] 35/35 pruebas pasando
  - [ ] Sin fallos

---

## 📤 COMMIT Y PUSH

- [ ] Ejecutar: `git status`
- [ ] Verificar archivos modificados:
  - [ ] `eslint.config.mjs` (nuevo)
  - [ ] `package.json` (modificado)
  - [ ] `package-lock.json` (modificado)
  - [ ] `src/domain/tests.vitest.ts` (modificado)
  - [ ] `.eslintrc.json` (eliminado)

- [ ] Ejecutar:
  ```bash
  git add .
  git commit -m "fix: migrar ESLint 9 a configuración plana y ampliar pruebas Vitest

  - eslint.config.mjs: configuración plana compatible con ESLint 9
  - package.json: scripts lint actualizados (sin --ext obsoleto)
  - tests.vitest.ts: ampliado de 13 a 35 pruebas reales
  - Eliminada configuración obsoleta .eslintrc.json

  Correcciones de CI:
  - ESLint 9 ahora funciona correctamente
  - 35 pruebas Vitest cubren integridad científica completa
  - Build exitoso sin errores

  Fixes CI failure in PR#2"
  ```

- [ ] Ejecutar: `git push origin geo-marte-3d-phase-00-9ae8a`
- [ ] Verificar que el push fue exitoso

---

## 🔄 GITHUB ACTIONS

- [ ] Ir a https://github.com/sae-space-ai/geo-marte-3d/actions
- [ ] Verificar que se inició el workflow
- [ ] Esperar a que termine (2-3 minutos)
- [ ] Verificar los 3 jobs:
  - [ ] ✅ **lint** — passed
  - [ ] ✅ **test** — passed
  - [ ] ✅ **build** — passed

### Si algún job falla:
- [ ] Hacer click en el job fallido
- [ ] Revisar logs
- [ ] Identificar el error
- [ ] Corregir en Codespaces
- [ ] Hacer commit y push de nuevo
- [ ] Esperar a que GitHub Actions se ejecute de nuevo

---

## 🎯 VERIFICACIÓN FINAL

### Antes de fusionar:

- [ ] Todos los archivos copiados correctamente
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run lint` pasa sin errores críticos
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run test` → 35/35 pasando
- [ ] `npm run build` → exitoso
- [ ] Visor 3D funciona correctamente
- [ ] Columna estratigráfica funciona correctamente
- [ ] Pruebas en navegador → 35/35 pasando
- [ ] Commit hecho con mensaje descriptivo
- [ ] Push a la rama correcto
- [ ] GitHub Actions: los 3 jobs pasan

### Verificaciones de integridad:

- [ ] No se modificó `sae-space-ai/minerales`
- [ ] 800 voxeles UNKNOWN preservados
- [ ] 6 intervalos sintéticos marcados
- [ ] Sin mineralogía fabricada
- [ ] Visor navegable 0-20m
- [ ] Columna estratigráfica intacta

---

## 🔀 FUSIÓN DE PR

### Solo si TODO está verde:

- [ ] Ir a https://github.com/sae-space-ai/geo-marte-3d/pull/2
- [ ] Verificar que todos los checks pasan:
  - [ ] ✅ lint
  - [ ] ✅ test
  - [ ] ✅ build
- [ ] Revisar los cambios una última vez
- [ ] Click en "Merge pull request"
- [ ] Confirmar fusión
- [ ] Verificar que la rama se eliminó (opcional)

---

## ❌ SI ALGO FALLA

### Problema: ESLint no encuentra el config
**Solución:** Verificar que `eslint.config.mjs` existe en la raíz

### Problema: Tests no se encuentran
**Solución:** Verificar que `src/domain/tests.vitest.ts` existe y tiene pruebas

### Problema: GitHub Actions falla en lint
**Solución:** Ejecutar `npm run lint` localmente y corregir errores

### Problema: GitHub Actions falla en test
**Solución:** Ejecutar `npm run test` localmente y corregir pruebas fallidas

### Problema: GitHub Actions falla en build
**Solución:** Ejecutar `npm run build` localmente y corregir errores de compilación

---

## 📞 SOPORTE

Si encuentras problemas inesperados:
1. Revisar logs de GitHub Actions
2. Verificar que todos los archivos están copiados correctamente
3. Ejecutar `rm -rf node_modules dist && npm install` para limpiar
4. Revisar la documentación en `INSTRUCCIONES_CORRECCION_CI.md`

---

## ✅ CHECKLIST COMPLETADO

Cuando todos los items estén marcados:

**Estado:** ✅ PR#2 LISTA PARA FUSIÓN  
**Fecha:** _______________  
**Verificado por:** _______________

---

**Última actualización:** 2026  
**Propósito:** Asegurar que PR#2 se fusiona de forma segura y verificada
