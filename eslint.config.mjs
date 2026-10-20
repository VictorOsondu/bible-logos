import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // These read JSON from outside services whose shape is not under our control, and tests
    // build loose mock objects; `any` is accepted there and nowhere else.
    files: ['src/app/api/research/route.ts', 'src/components/ResearchPanel.tsx', '__tests__/**', 'e2e/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'data/**', 'coverage/**', 'test-results/**', 'playwright-report/**', 'next-env.d.ts']),
]);
