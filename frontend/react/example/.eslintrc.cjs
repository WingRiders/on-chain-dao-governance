module.exports = {
  root: true,
  env: {browser: true, es2020: true},
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        args: 'none',
        varsIgnorePattern: '^_',
      },
    ],
    // keep `no-console` warnings but allow console.error calls
    'no-console': ['warn', {allow: ['error']}],
    'react-refresh/only-export-components': ['warn', {allowConstantExport: true}],
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: 'usePromise',
      },
    ],
  },
}
