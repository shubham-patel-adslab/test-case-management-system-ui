export const THEME_MODES = ['light', 'dark'] as const;

// The viewer's choice, per browser (ui-requirements §5.3). Not sensitive (ui-requirements §5.5).
export const THEME_STORAGE_KEY = 'tcms.theme';

// Without a stored choice the app follows the operating system's setting.
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
