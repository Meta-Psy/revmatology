import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Базовое no-unused-vars не видит использования в JSX (<Icon />), поэтому
      // имена с заглавной пропускаются. argsIgnorePattern — то же для
      // переименованных пропсов-компонентов: ({ icon: Icon }), ({ as: Component }).
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      // Хуки живут рядом со своими провайдерами (AuthContext.jsx, Toast.jsx).
      // Цена — при правке этих двух файлов в dev вместо fast refresh
      // перезагружаются их импортёры.
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['useAuth', 'useToast'] },
      ],
    },
  },
])
