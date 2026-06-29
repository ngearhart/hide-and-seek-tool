/**
 * .eslint.js
 *
 * ESLint configuration file.
 */
// @ts-check

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn"
    }
  })),
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**, **/lib/**'],
  },
]
