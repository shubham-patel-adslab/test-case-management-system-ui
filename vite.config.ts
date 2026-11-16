import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// Local tcms-api (Express) dev server. Proxying /api through Vite keeps the UI and API on one origin in
// development, so the backend needs no CORS setup.
const TCMS_API_DEV_TARGET = 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
        proxy: {
            '/api': TCMS_API_DEV_TARGET,
        },
    },
})
