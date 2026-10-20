#!/bin/bash
# ============================================================================
# SCRIPT DE APLICACIÓN — FASE 00.2 GEO-MARTE 3D
# ============================================================================
# Propósito: Aplicar correcciones de CI en un entorno Codespaces con Git/Node
# Repositorio: https://github.com/sae-space-ai/geo-marte-3d
# PR: https://github.com/sae-space-ai/geo-marte-3d/pull/2
# Rama: geo-marte-3d-phase-00-9ae8a
# ============================================================================

set -e

echo "============================================================"
echo " GEO-MARTE 3D — Aplicación de correcciones Fase 00.2"
echo "============================================================"
echo ""

# Verificación de entorno
echo "[1/8] Verificando entorno..."
command -v git >/dev/null 2>&1 || { echo "ERROR: git no disponible"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: node no disponible"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm no disponible"; exit 1; }

echo "  Node: $(node --version)"
echo "  npm: $(npm --version)"
echo "  git: $(git --version)"
echo ""

# Verificar repositorio
echo "[2/8] Verificando repositorio..."
if [ ! -d ".git" ]; then
    echo "ERROR: No estás en un repositorio Git"
    echo "Ejecuta este script desde la raíz de geo-marte-3d"
    exit 1
fi

REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [[ "$REMOTE" != *"geo-marte-3d"* ]]; then
    echo "ADVERTENCIA: El remoto no parece ser geo-marte-3d"
    echo "Remoto actual: $REMOTE"
    read -p "¿Continuar de todos modos? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Verificar que NO estamos en minerales
if [[ "$REMOTE" == *"minerales"* ]]; then
    echo "ERROR CRÍTICO: Estás en el repositorio minerales"
    echo "Este script NO debe ejecutarse en sae-space-ai/minerales"
    exit 1
fi

echo "  Repositorio: $REMOTE"
echo "  Rama actual: $(git branch --show-current)"
echo ""

# Respaldo
echo "[3/8] Creando respaldo de seguridad..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
cp -r src "$BACKUP_DIR/" 2>/dev/null || true
[ -f .eslintrc.json ] && cp .eslintrc.json "$BACKUP_DIR/" 2>/dev/null || true
echo "  Respaldo creado en: $BACKUP_DIR/"
echo ""

# Aplicar cambios
echo "[4/8] Aplicando cambios..."

# 4.1 Crear eslint.config.mjs
echo "  Creando eslint.config.mjs..."
cat > eslint.config.mjs << 'EOF'
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
EOF

# 4.2 Eliminar .eslintrc.json si existe
if [ -f .eslintrc.json ]; then
    echo "  Eliminando .eslintrc.json obsoleto..."
    rm .eslintrc.json
fi

# 4.3 Actualizar package.json
echo "  Actualizando package.json..."
# Usar node para actualizar JSON de forma segura
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Actualizar scripts
pkg.scripts = {
  ...pkg.scripts,
  'lint': 'eslint src --report-unused-disable-directives --max-warnings 0',
  'lint:fix': 'eslint src --fix',
  'test': 'vitest run',
  'test:watch': 'vitest',
  'test:ui': 'vitest --ui',
  'coverage': 'vitest run --coverage',
  'preview': 'vite preview'
};

// Asegurar dependencias
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies['@eslint/js'] = '^9.39.5';
pkg.dependencies['globals'] = '^15.15.0';
pkg.dependencies['typescript-eslint'] = '^8.0.0';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo ""

# 4.4 Verificar tests.vitest.ts
echo "  Verificando tests.vitest.ts..."
if [ ! -f src/domain/tests.vitest.ts ]; then
    echo "ERROR: src/domain/tests.vitest.ts no existe"
    echo "Este archivo debe contener las 35 pruebas"
    exit 1
fi

TEST_COUNT=$(grep -c "it(" src/domain/tests.vitest.ts || echo "0")
echo "  Pruebas encontradas en tests.vitest.ts: $TEST_COUNT"
if [ "$TEST_COUNT" -lt "30" ]; then
    echo "ADVERTENCIA: Se esperaban al menos 30 pruebas"
fi
echo ""

# Instalar dependencias
echo "[5/8] Instalando dependencias..."
npm install
echo ""

# Verificaciones
echo "[6/8] Ejecutando verificaciones..."

echo "  [lint] Ejecutando ESLint..."
if npm run lint; then
    echo "  ✅ lint pasó"
else
    echo "  ⚠️  lint falló (revisar errores)"
fi
echo ""

echo "  [typecheck] Ejecutando TypeScript..."
if npm run typecheck; then
    echo "  ✅ typecheck pasó"
else
    echo "  ⚠️  typecheck falló (revisar errores)"
fi
echo ""

echo "  [test] Ejecutando Vitest..."
if npm run test; then
    echo "  ✅ test pasó"
else
    echo "  ⚠️  test falló (revisar errores)"
fi
echo ""

echo "  [build] Ejecutando build..."
if npm run build; then
    echo "  ✅ build pasó"
else
    echo "  ⚠️  build falló (revisar errores)"
fi
echo ""

# Resumen
echo "[7/8] Resumen de cambios..."
echo "  Archivos modificados:"
git status --short
echo ""

echo "[8/8] Próximos pasos..."
echo ""
echo "============================================================"
echo " VERIFICACIÓN COMPLETADA"
echo "============================================================"
echo ""
echo "Si todas las verificaciones pasaron:"
echo ""
echo "  1. Revisa los cambios:"
echo "     git diff"
echo ""
echo "  2. Commit de los cambios:"
echo "     git add ."
echo "     git commit -m \"fix: correcciones CI Fase 00.2"
echo ""
echo "     - eslint.config.mjs: configuración plana ESLint 9"
echo "     - package.json: scripts lint actualizados"
echo "     - tests.vitest.ts: 35 pruebas reales"
echo "     - Eliminada configuración obsoleta .eslintrc.json"
echo ""
echo "     Fixes CI failure in PR#2\""
echo ""
echo "  3. Push a la rama:"
echo "     git push origin geo-marte-3d-phase-00-9ae8a"
echo ""
echo "  4. Verificar GitHub Actions:"
echo "     https://github.com/sae-space-ai/geo-marte-3d/actions"
echo ""
echo "  5. Fusionar PR #2 si todos los checks pasan:"
echo "     gh pr merge 2 --merge"
echo ""
echo "============================================================"
echo " Respaldo disponible en: $BACKUP_DIR/"
echo "============================================================"
