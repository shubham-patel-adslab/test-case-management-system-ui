import { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';

import { DEFAULT_THEME_MODE } from './theme.constant';
import { ThemeContext } from './theme.context';
import { getStoredThemeMode, storeThemeMode } from './theme.storage';
import type { ThemeMode } from './theme.type';

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

// Light/dark through antd's theme algorithm (ui-requirements §5.3): the viewer's stored choice, else light.
export function ThemeProvider({ children }: ThemeProviderProps) {
    const [mode, setMode] = useState<ThemeMode>(() => getStoredThemeMode() ?? DEFAULT_THEME_MODE);

    const toggleMode = () => {
        const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';

        storeThemeMode(nextMode);
        setMode(nextMode);
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
