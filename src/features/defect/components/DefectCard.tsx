import { useTranslation } from 'react-i18next';
import { Card, Typography } from 'antd';

import styles from './DefectCard.module.scss';
import { DefectSeverityTag } from './DefectSeverityTag';
import type { DefectDetailsType } from '../defect.type';
import { formatDateTime } from '../../../shared/format/date.format';
import { formatFullName } from '../../../shared/format/name.format';

type DefectCardProps = {
    defect: DefectDetailsType;
    // Shown when the creator's user row is gone.
    unknownUserLabel: string;
};

// The defect raised from a failed run, shown on that run's page.
export function DefectCard({ defect, unknownUserLabel }: DefectCardProps) {
    const { t } = useTranslation('defect');
    const createdBy = defect.createdBy ? formatFullName(defect.createdBy.firstName, defect.createdBy.lastName) : unknownUserLabel;

    return (
        <Card size="small" title={`#${defect.id} ${defect.title}`} extra={<DefectSeverityTag severity={defect.severity} />}>
            {defect.description && <Typography.Paragraph className={styles['tb-defect-card__text']}>{defect.description}</Typography.Paragraph>}
            <Typography.Text type="secondary">{t('card.createdBy', { name: createdBy, date: formatDateTime(defect.createdAt) })}</Typography.Text>
        </Card>
    );
}
