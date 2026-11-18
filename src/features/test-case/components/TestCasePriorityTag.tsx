import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';

import type { TestCasePriority } from '../test-case.type';

// antd preset tag colors — named theme presets, not raw color values.
const PRIORITY_COLOR: Record<TestCasePriority, string> = {
    LOW: 'default',
    MEDIUM: 'blue',
    HIGH: 'orange',
    CRITICAL: 'red',
};

type TestCasePriorityTagProps = {
    priority: TestCasePriority;
};

export function TestCasePriorityTag({ priority }: TestCasePriorityTagProps) {
    const { t } = useTranslation('testCase');

    return <Tag color={PRIORITY_COLOR[priority]}>{t(`priority.${priority}`)}</Tag>;
}
