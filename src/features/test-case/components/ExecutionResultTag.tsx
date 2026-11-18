import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';

import type { ExecutionResult } from '../test-case.type';

// antd preset tag colors — named theme presets, not raw color values.
const RESULT_COLOR: Record<ExecutionResult, string> = {
    PASS: 'green',
    FAIL: 'red',
    BLOCKED: 'orange',
    SKIPPED: 'default',
};

type ExecutionResultTagProps = {
    // null: never executed.
    result: ExecutionResult | null;
};

export function ExecutionResultTag({ result }: ExecutionResultTagProps) {
    const { t } = useTranslation('testCase');

    if (!result) {
        return <Tag>{t('result.none')}</Tag>;
    }

    return <Tag color={RESULT_COLOR[result]}>{t(`result.${result}`)}</Tag>;
}
