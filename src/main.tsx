import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'

import './app/i18n.ts';
import { router } from './app/router.tsx';
import { RouterProvider } from 'react-router';
import { AppProviders } from './app/providers.tsx';

// Dev-only, and opt-out via env so the same dev build can point at the real backend repo.
// Dynamic import keeps MSW out of the production bundle entirely.
async function enableMocking() {
    if (import.meta.env.DEV && import.meta.env.VITE_TCMS_API_MOCKING === 'true') {
        const { worker } = await import('./app/mock/browser.ts');

        await worker.start({
            onUnhandledFrame: 'bypass', // don't warn/log on Vite module loads, fonts, etc.
        });
    }
}

void enableMocking().then(() => {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <AppProviders>
                <RouterProvider router={router}></RouterProvider>
            </AppProviders>
        </StrictMode>,
    );
});
