import { z } from 'zod';

import {
    PROJECT_DESCRIPTION_MAX_LENGTH,
    PROJECT_MEMBERS_MAX,
    PROJECT_NAME_MAX_LENGTH,
    PROJECT_STATUSES,
    PROJECT_VERSION_MAX_LENGTH,
} from './project.constant';

// Messages are i18next translation keys (namespace: 'project'), not display text —
// translated at render time via t(errors.field.message), so the schema itself stays locale-agnostic.
// `.trim()` runs before the length checks, so whitespace-only names fail "required" and the
// submitted values are already trimmed (ui-requirements §5.5).
export const projectFormSchema = z.object({
    name: z.string()
        .trim()
        .min(1, { message: 'validation.nameRequired' })
        .max(PROJECT_NAME_MAX_LENGTH, { message: 'validation.nameMaxLength' }),
    description: z.string()
        .trim()
        .max(PROJECT_DESCRIPTION_MAX_LENGTH, { message: 'validation.descriptionMaxLength' }),
    version: z.string()
        .trim()
        .max(PROJECT_VERSION_MAX_LENGTH, { message: 'validation.versionMaxLength' }),
    status: z.enum(PROJECT_STATUSES, { message: 'validation.statusRequired' }),
    // The whole team (user ids). Optional to fill: an empty team is valid.
    memberIds: z.array(z.string())
        .max(PROJECT_MEMBERS_MAX, { message: 'validation.membersMax' }),
});
