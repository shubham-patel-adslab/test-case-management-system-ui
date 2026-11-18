import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// Local tcms-api (Express) dev server. Proxying /api through Vite keeps the UI and API on one origin in
// development, so the backend needs no CORS setup.
const TCMS_API_DEV_TARGET = 'http://localhost:3000'

// The backend's invitation emails link to http://localhost:5173/set-password (its UI_BASE_URL), so the dev
// server must not drift to another port when 5173 is taken — fail instead.
const TCMS_UI_DEV_PORT = 5173

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
        port: TCMS_UI_DEV_PORT,
        strictPort: true,
        proxy: {
            '/api': TCMS_API_DEV_TARGET,
        },
    },
})
