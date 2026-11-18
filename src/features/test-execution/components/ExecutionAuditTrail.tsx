import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Timeline, Typography } from 'antd';

import { UserReferenceName } from './UserReferenceName';
import { getTestExecutionAudit } from '../test-execution.api';
import { toTestExecutionAuditLogs } from '../test-execution.mapper';
import { testExecutionAuditQueryKey } from '../test-execution.query';
import type { TestExecutionAuditLogType } from '../test-execution.type';
import { useCurrentProject } from '../../project/current-project.context';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { formatDateTime } from '../../../shared/format/date.format';
import { formatFullName } from '../../../shared/format/name.format';

type ExecutionAuditTrailProps = {
    executionId: number;
};

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const asNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);

// Who did what to a run, and when (PRD Features §4: audit trail), oldest first.
export function ExecutionAuditTrail({ executionId }: ExecutionAuditTrailProps) {
    const { t } = useTranslation('testExecution');
    const { t: tTestCase } = useTranslation('testCase');
    const project = useCurrentProject();

    const auditQuery = useQuery({
        queryKey: testExecutionAuditQueryKey(project.id, executionId),
        queryFn: ({ signal }) => getTestExecutionAudit(project.id, executionId, signal),
        select: toTestExecutionAuditLogs,
    });

    // CREATED carries only the assignee's id: the team gives the name (an admin outside the team is "a team
    // member" — the API has nothing more for non-admins).
    const memberName = (userId: string | undefined) => {
        const member = project.members.find((candidate) => candidate.id === userId);
        return member ? formatFullName(member.firstName, member.lastName) : t('audit.someone');
    };

    // `details` is untyped JSON per action; read defensively, anything unknown is simply not described.
    const describe = ({ action, details }: TestExecutionAuditLogType): string => {
        switch (action) {
            case 'CREATED': {
                const suiteRunId = asNumber(details.suiteRunId);
                const assigneeId = asString(details.assigneeId);
                const parts = [
                    suiteRunId ? t('audit.createdBySuiteRun', { id: suiteRunId }) : t('audit.created'),
                    assigneeId ? t('audit.assigned', { name: memberName(assigneeId) }) : undefined,
                ];
                return parts.filter(Boolean).join(' · ');
            }
            case 'RESULT_RECORDED': {
                const status = asString(details.status);
                return t('audit.resultRecorded', { result: status ? tTestCase(`result.${status}`) : '' });
            }
            case 'ATTACHMENT_ADDED': {
                const fileNames = Array.isArray(details.fileNames) ? details.fileNames.filter((name) => typeof name === 'string') : [];
                return t('audit.attachmentsAdded', { files: fileNames.join(', ') });
            }
            case 'DEFECT_CREATED':
                return t('audit.defectCreated', { id: asNumber(details.defectId) ?? '' });
        }
    };

    if (auditQuery.isError) {
        return <QueryErrorState onRetry={() => void auditQuery.refetch()} />;
    }

    if (!auditQuery.data) {
        return <QueryLoadingState />;
    }

    if (auditQuery.data.length === 0) {
        return <Typography.Text type="secondary">{t('audit.empty')}</Typography.Text>;
    }

    return (
        <Timeline
            items={auditQuery.data.map((entry) => ({
                key: entry.id,
                content: (
                    <>
                        <Typography.Text>{describe(entry)}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                            <UserReferenceName user={entry.actor} fallback={t('audit.unknownUser')} />
                            {' · '}
                            {formatDateTime(entry.createdAt)}
                        </Typography.Text>
                    </>
                ),
            }))}
        />
    );
}
