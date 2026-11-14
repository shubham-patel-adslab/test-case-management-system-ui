import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist', 'public/mockServiceWorker.js']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        // Route files declare React.lazy page components next to their exported route config
        // (PRD requires React.lazy). They're config modules — fast refresh doesn't apply to them.
        files: ['**/*.routes.tsx'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
])
