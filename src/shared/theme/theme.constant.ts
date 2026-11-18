export const THEME_MODES = ['light', 'dark'] as const;

// The viewer's choice, per browser (ui-requirements §5.3). Not sensitive (ui-requirements §5.5).
export const THEME_STORAGE_KEY = 'tcms.theme';

// Without a stored choice the app is light, whatever the operating system's setting (user decision 2026-11-18).
export const DEFAULT_THEME_MODE = 'light';
