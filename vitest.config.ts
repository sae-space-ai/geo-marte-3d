import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.vitest.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    passWithNoTests: false, // Fallo si no se encuentran pruebas
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/domain/**/*.ts', 'src/database/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.vitest.ts', '**/*.d.ts'],
    },
  },
});
