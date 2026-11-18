import { THEME_MODES, THEME_STORAGE_KEY } from './theme.constant';
import type { ThemeMode } from './theme.type';

function isThemeMode(value: string | null): value is ThemeMode {
    return THEME_MODES.some((mode) => mode === value);
}

// A per-browser convenience: storage may be unavailable (private mode, blocked site data), and every access
// tolerates that — without it the app follows the operating system's setting.
export function getStoredThemeMode(): ThemeMode | null {
    try {
        const value = localStorage.getItem(THEME_STORAGE_KEY);

        return isThemeMode(value) ? value : null;
    } catch {
        return null;
    }
}

export function storeThemeMode(mode: ThemeMode): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
        // Not remembered: the next visit follows the operating system again.
    }
}
