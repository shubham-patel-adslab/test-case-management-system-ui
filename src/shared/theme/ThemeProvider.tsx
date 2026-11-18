import { useEffect, useState, useSyncExternalStore } from 'react';
import { ConfigProvider, theme } from 'antd';

import { DARK_SCHEME_QUERY } from './theme.constant';
import { ThemeContext } from './theme.context';
import { getStoredThemeMode, storeThemeMode } from './theme.storage';
import type { ThemeMode } from './theme.type';

// The operating system's setting, kept current while the app is open (synced to the browser's media query).
function subscribeToSystemScheme(onChange: () => void): () => void {
    const query = window.matchMedia(DARK_SCHEME_QUERY);

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
}

function getSystemMode(): ThemeMode {
    return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light';
}

// Page-level styles outside antd's components (body background, scrollbars, native controls) follow the
// theme too: its tokens become CSS custom properties on the root, read by the global stylesheets.
function RootThemeStyles({ mode }: { mode: ThemeMode }) {
    const { token } = theme.useToken();

    useEffect(() => {
        const root = document.documentElement;

        root.style.colorScheme = mode;
        root.style.setProperty('--tb-page-bg-color', token.colorBgLayout);
        root.style.setProperty('--tb-page-text-color', token.colorText);
        root.style.setProperty('--tb-scrollbar-thumb-color', token.colorTextQuaternary);
        root.style.setProperty('--tb-scrollbar-thumb-hover-color', token.colorTextTertiary);
    }, [mode, token]);

    return null;
}

type ThemeProviderProps = {
    children: React.ReactNode;
};

// Light/dark through antd's theme algorithm (ui-requirements §5.3): the viewer's stored choice, else the
// operating system's setting.
export function ThemeProvider({ children }: ThemeProviderProps) {
    const [chosenMode, setChosenMode] = useState(getStoredThemeMode);
    const systemMode = useSyncExternalStore(subscribeToSystemScheme, getSystemMode);
    const mode = chosenMode ?? systemMode;

    const toggleMode = () => {
        const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';

        storeThemeMode(nextMode);
        setChosenMode(nextMode);
    };

    const algorithm = mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
    // antd's Layout header defaults to a dark navy in both themes; the app's header is a plain surface.
    const themeConfig = {
        algorithm,
        components: {
            Layout: { headerBg: theme.getDesignToken({ algorithm }).colorBgContainer },
        },
    };

    return (
        <ThemeContext value={{ mode, toggleMode }}>
            <ConfigProvider theme={themeConfig}>
                <RootThemeStyles mode={mode} />
                {children}
            </ConfigProvider>
        </ThemeContext>
    );
}
