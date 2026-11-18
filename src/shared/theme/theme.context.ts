import { createContext, useContext } from 'react';

import type { ThemeMode } from './theme.type';

export type ThemeContextValue = {
    // The theme on screen: the viewer's choice, or light until they choose.
    mode: ThemeMode;
    toggleMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
    // useContext rather than React 19's use(): the PRD (Frontend Req §1) evaluates useContext by name.
    const value = useContext(ThemeContext);

    if (!value) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }

    return value;
}
