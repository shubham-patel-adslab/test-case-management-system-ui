import { afterEach, describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY } from './theme.constant';
import { getStoredThemeMode, storeThemeMode } from './theme.storage';

function stubStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial));

    vi.stubGlobal('localStorage', {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
    });

    return values;
}

// Protects: a broken or unavailable store never breaks the app — the theme then starts light.
describe('theme storage', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reads back a stored choice', () => {
        const values = stubStorage();

        storeThemeMode('dark');

        expect(values.get(THEME_STORAGE_KEY)).toBe('dark');
        expect(getStoredThemeMode()).toBe('dark');
    });

    it('ignores anything that is not a theme', () => {
        stubStorage({ [THEME_STORAGE_KEY]: 'sepia' });

        expect(getStoredThemeMode()).toBeNull();
    });

    it('tolerates storage that throws (private mode, blocked site data)', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => { throw new Error('blocked'); },
            setItem: () => { throw new Error('blocked'); },
        });

        expect(getStoredThemeMode()).toBeNull();
        expect(() => storeThemeMode('light')).not.toThrow();
    });
});
