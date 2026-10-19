# INSTRUCCIONES PARA APLICAR CORRECCIÓN CI — PR#2
## GEO-MARTE 3D — SAE SPACE AI

**Repositorio:** https://github.com/sae-space-ai/geo-marte-3d  
**Pull Request:** https://github.com/sae-space-ai/geo-marte-3d/pull/2  
**Rama:** geo-marte-3d-phase-00-9ae8a

---

## 📋 RESUMEN DE CAMBIOS

### Problema resuelto
ESLint 9.39.5 fallaba con configuración antigua `.eslintrc.json`. Se migró a configuración plana `eslint.config.mjs`.

### Archivos modificados
1. **`eslint.config.mjs`** (NUEVO) — Configuración plana ESLint 9
2. **`package.json`** (MODIFICADO) — Scripts lint actualizados
3. **`src/domain/tests.vitest.ts`** (MODIFICADO) — 35 pruebas reales
4. **`.eslintrc.json`** (ELIMINAR) — Configuración obsoleta

---

## 🚀 PASOS PARA APLICAR EN CODESPACES

### 1. Abrir Codespaces en la rama correcta
```bash
# Ir a https://github.com/sae-space-ai/geo-marte-3d
# Click en "Code" → "Codespaces" → "Create codespace on main"

# Cambiar a la rama de la PR
git fetch origin
git checkout geo-marte-3d-phase-00-9ae8a
```

### 2. Copiar archivos desde el sandbox

#### Archivo 1: `eslint.config.mjs` (NUEVO)
Crear este archivo en la raíz del proyecto:

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

#### Archivo 2: `package.json` (MODIFICAR scripts)
Reemplazar las líneas de scripts:

**ANTES:**
```json
"scripts": {
  "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint src --ext .ts,.tsx --fix",
  ...
}
```

**DESPUÉS:**
```json
"scripts": {
  "lint": "eslint src --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint src --fix",
  ...
}
```

#### Archivo 3: `src/domain/tests.vitest.ts` (REEMPLAZAR COMPLETO)
Copiar el contenido completo desde el sandbox (35 pruebas).

#### Archivo 4: `.eslintrc.json` (ELIMINAR)
```bash
rm .eslintrc.json
```

### 3. Instalar dependencias
```bash
npm install
```

Esto actualizará `package-lock.json` con las nuevas dependencias:
- `@eslint/js@^9.0.0`
- `globals@^15.0.0`

### 4. Verificar ESLint
```bash
npm run lint
```

**Resultado esperado:** Sin errores (o solo advertencias no críticas)

### 5. Verificar TypeScript
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
✓ src/domain/tests.vitest.ts (35 tests)

Test Files  1 passed (1)
Tests  35 passed (35)
```

### 7. Verificar build
```bash
npm run build
```

**Resultado esperado:** Build exitoso sin errores

### 8. Commit y push
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

git push origin geo-marte-3d-phase-00-9ae8a
```

### 9. Verificar GitHub Actions
1. Ir a https://github.com/sae-space-ai/geo-marte-3d/actions
2. Esperar a que se ejecute el workflow
3. Verificar que los 3 jobs pasan:
   - ✅ lint
   - ✅ test
   - ✅ build

### 10. Fusionar PR (solo si todo pasa)
```bash
gh pr merge 2 --merge
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de fusionar, verificar:

- [ ] `eslint.config.mjs` creado en la raíz
- [ ] `.eslintrc.json` eliminado
- [ ] `package.json` tiene scripts lint sin `--ext`
- [ ] `src/domain/tests.vitest.ts` tiene 35 pruebas
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run lint` pasa sin errores críticos
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run test` → 35/35 pruebas pasando
- [ ] `npm run build` → build exitoso
- [ ] GitHub Actions: lint, test, build pasan
- [ ] No se modifica `sae-space-ai/minerales`
- [ ] PR #2 actualizada con todos los cambios

---

## ⚠️ PROBLEMAS COMUNES

### Error: "ESLint couldn't find the config file"
**Solución:** Verificar que `eslint.config.mjs` existe en la raíz del proyecto.

### Error: "Cannot find module '@eslint/js'"
**Solución:** Ejecutar `npm install` para instalar las dependencias.

### Error: "Tests not found"
**Solución:** Verificar que `src/domain/tests.vitest.ts` existe y tiene pruebas.

### Error: "lint script uses --ext which is deprecated"
**Solución:** Verificar que `package.json` tiene el script lint sin `--ext`.

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar logs de GitHub Actions
2. Verificar que todos los archivos están copiados correctamente
3. Ejecutar `npm install` de nuevo
4. Limpiar caché: `rm -rf node_modules dist && npm install`

---

**Fecha:** 2026  
**Estado:** Instrucciones listas para aplicar en Codespaces  
**Objetivo:** Dejar PR#2 lista para fusión segura en main
