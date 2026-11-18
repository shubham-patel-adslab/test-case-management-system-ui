import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Flex, Progress, Tag, Typography } from 'antd';

import type { ExecutionProgressType } from '../test-execution.type';

const PERCENT = 100;

type ExecutionProgressSummaryProps = {
    title: string;
    progress: ExecutionProgressType;
};

// Executed / total with a bar, the pass rate, and the count per status (ui-requirements §4.4).
export function ExecutionProgressSummary({ title, progress }: ExecutionProgressSummaryProps) {
    const { t } = useTranslation('testExecution');

    // useMemo written explicitly (PRD Frontend Req §1: test statistics and pass rates), although the React
    // Compiler would memoize it too.
    const stats = useMemo(() => {
        const executed = progress.total - progress.pending;

        return {
            executed,
            executedPercent: progress.total > 0 ? Math.round((executed / progress.total) * PERCENT) : 0,
            // Of the runs with a result, how many passed.
            passRate: executed > 0 ? Math.round((progress.passed / executed) * PERCENT) : 0,
        };
    }, [progress]);

    return (
        <Card size="small" title={title}>
            {progress.total === 0 ? (
                <Typography.Text type="secondary">{t('progress.none')}</Typography.Text>
            ) : (
                <Flex vertical gap="small">
                    <Flex justify="space-between" wrap gap="small">
                        <Typography.Text>{t('progress.executed', { executed: stats.executed, total: progress.total })}</Typography.Text>
                        <Typography.Text type="secondary">{t('progress.passRate', { rate: stats.passRate })}</Typography.Text>
                    </Flex>
                    <Progress percent={stats.executedPercent} aria-label={t('progress.executed', { executed: stats.executed, total: progress.total })} />
                    <Flex gap={4} wrap>
                        <Tag color="processing">{t('progress.pending', { count: progress.pending })}</Tag>
                        <Tag color="green">{t('progress.passed', { count: progress.passed })}</Tag>
                        <Tag color="red">{t('progress.failed', { count: progress.failed })}</Tag>
                        <Tag color="orange">{t('progress.blocked', { count: progress.blocked })}</Tag>
                        <Tag>{t('progress.skipped', { count: progress.skipped })}</Tag>
                    </Flex>
                </Flex>
            )}
        </Card>
    );
}
