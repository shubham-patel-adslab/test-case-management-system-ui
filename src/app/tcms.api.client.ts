import axios from 'axios';

import { isUnauthorizedError } from './api-error';

// No Authorization header: the access token travels in an httpOnly cookie that the browser sends to the
// same-origin /api by itself (ui-requirements §5.5).
export const tcmsApiClient = axios.create({
    baseURL: import.meta.env.VITE_TCMS_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | undefined;

// The auth feature registers what "signed out" means (clear the session and cache); the API client only
// detects it. Returns an unregister function for effect cleanup.
export function setUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
    unauthorizedHandler = handler;

    return () => {
        if (unauthorizedHandler === handler) {
            unauthorizedHandler = undefined;
        }
    };
}

tcmsApiClient.interceptors.response.use(undefined, (error: unknown) => {
    if (isUnauthorizedError(error)) {
        unauthorizedHandler?.();
    }

    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
});
