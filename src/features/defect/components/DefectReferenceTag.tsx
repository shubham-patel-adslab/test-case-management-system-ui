import { Flex, Typography } from 'antd';

import { DefectSeverityTag } from './DefectSeverityTag';
import type { DefectReferenceType } from '../defect.type';

type DefectReferenceTagProps = {
    defect: DefectReferenceType;
};

// A run's defect in a list: severity and title.
export function DefectReferenceTag({ defect }: DefectReferenceTagProps) {
    return (
        <Flex gap={4} align="center">
            <DefectSeverityTag severity={defect.severity} />
            <Typography.Text ellipsis={{ tooltip: defect.title }}>{defect.title}</Typography.Text>
        </Flex>
    );
}
