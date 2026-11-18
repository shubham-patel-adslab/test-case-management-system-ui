import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import { useTheme } from './theme.context';

// A toggle button: its name stays "Dark theme" and aria-pressed says whether it's on.
export function ThemeToggle() {
    const { t } = useTranslation('common');
    const { mode, toggleMode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <Tooltip title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                aria-label={t('theme.dark')}
                aria-pressed={isDark}
                onClick={toggleMode}
            />
        </Tooltip>
    );
}
