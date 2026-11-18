import { z } from 'zod';

import { DEFECT_DESCRIPTION_MAX_LENGTH, DEFECT_SEVERITIES, DEFECT_TITLE_MAX_LENGTH } from './defect.constant';

// Messages are i18next keys (namespace 'defect'). Trimmed before the checks (ui-requirements §5.5).
export const defectFormSchema = z.object({
    title: z.string()
        .trim()
        .min(1, { message: 'validation.titleRequired' })
        .max(DEFECT_TITLE_MAX_LENGTH, { message: 'validation.titleMaxLength' }),
    description: z.string()
        .trim()
        .max(DEFECT_DESCRIPTION_MAX_LENGTH, { message: 'validation.descriptionMaxLength' }),
    severity: z.enum(DEFECT_SEVERITIES, { message: 'validation.severityRequired' }),
});
