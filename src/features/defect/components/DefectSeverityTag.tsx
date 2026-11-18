import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';

import type { DefectSeverity } from '../defect.type';

// antd preset tag colors — named theme presets, not raw color values.
const SEVERITY_COLOR: Record<DefectSeverity, string> = {
    LOW: 'default',
    MEDIUM: 'blue',
    HIGH: 'orange',
    CRITICAL: 'red',
};

type DefectSeverityTagProps = {
    severity: DefectSeverity;
};

export function DefectSeverityTag({ severity }: DefectSeverityTagProps) {
    const { t } = useTranslation('defect');

    return <Tag color={SEVERITY_COLOR[severity]}>{t(`severity.${severity}`)}</Tag>;
}
