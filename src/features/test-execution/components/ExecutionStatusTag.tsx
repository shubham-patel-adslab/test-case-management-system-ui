import { useTranslation } from 'react-i18next';
import { Tag } from 'antd';

import { EXECUTION_PENDING } from '../test-execution.constant';
import type { ExecutionStatus } from '../test-execution.type';
import { ExecutionResultTag } from '../../test-case/components/ExecutionResultTag';

type ExecutionStatusTagProps = {
    status: ExecutionStatus;
};

// A recorded result looks like a test case's last result; pending has its own (antd preset) color.
export function ExecutionStatusTag({ status }: ExecutionStatusTagProps) {
    const { t } = useTranslation('testExecution');

    if (status === EXECUTION_PENDING) {
        return <Tag color="processing">{t('status.PENDING')}</Tag>;
    }

    return <ExecutionResultTag result={status} />;
}
