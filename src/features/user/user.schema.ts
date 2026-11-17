import { z } from 'zod';

import { USER_EMAIL_MAX_LENGTH, USER_NAME_MAX_LENGTH } from './user.constant';

// Messages are i18next translation keys (namespace: 'user'). Same rules as the backend; it also lowercases
// the email, so the UI only trims.
// Last name is optional: an empty value is sent as "" (ui-requirements §4.8).
export const userFormSchema = z.object({
    firstName: z.string()
        .trim()
        .min(1, { message: 'validation.firstNameRequired' })
        .max(USER_NAME_MAX_LENGTH, { message: 'validation.nameMaxLength' }),
    lastName: z.string()
        .trim()
        .max(USER_NAME_MAX_LENGTH, { message: 'validation.nameMaxLength' }),
    email: z.string()
        .trim()
        .min(1, { message: 'validation.emailRequired' })
        .max(USER_EMAIL_MAX_LENGTH, { message: 'validation.emailMaxLength' })
        .pipe(z.email({ message: 'validation.emailInvalid' })),
    roleCode: z.string().min(1, { message: 'validation.roleRequired' }),
});
