/**
 * .eslint.js
 *
 * ESLint configuration file.
 */

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**, **/lib/**'],
  },
]
