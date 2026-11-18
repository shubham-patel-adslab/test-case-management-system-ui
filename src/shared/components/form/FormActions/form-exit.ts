import type { Location } from 'react-router';

const FORM_EXIT_STATE_KEY = 'isFormExit';

// Navigation options for a form's own exits — Cancel (already confirmed when dirty) and leaving after a
// save — so FormActions' unsaved-changes guard lets them through: `navigate(path, FORM_EXIT_NAVIGATION)`.
export const FORM_EXIT_NAVIGATION = { state: { [FORM_EXIT_STATE_KEY]: true } };

export function isFormExit(location: Location): boolean {
    const state: unknown = location.state;

    return typeof state === 'object' && state !== null && FORM_EXIT_STATE_KEY in state;
}
