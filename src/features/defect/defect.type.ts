import { z } from 'zod';

import type { DEFECT_SEVERITIES } from './defect.constant';
import type { defectFormSchema } from './defect.schema';
import type { UserReferenceType } from '../user/user.type';

export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number];

export type DefectReferenceType = {
    id: number;
    title: string;
    severity: DefectSeverity;
};

export type DefectDetailsType = DefectReferenceType & {
    description: string;
    createdBy: UserReferenceType | null;
    createdAt: string;
};

export type DefectFormType = z.infer<typeof defectFormSchema>;
