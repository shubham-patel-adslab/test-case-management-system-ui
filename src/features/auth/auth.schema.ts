import { z } from 'zod';

import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from './auth.constant';

// Messages are i18next translation keys (namespace: 'auth').
// Email is trimmed before the format check; the password is never trimmed (spaces are valid characters)
// and has no minimum length here — a wrong password is a 401, not a validation hint.
export const authSignInFormSchema = z.object({
    email: z.string()
        .trim()
        .min(1, { message: 'validation.emailRequired' })
        .pipe(z.email({ message: 'validation.emailInvalid' })),
    password: z.string().min(1, { message: 'validation.passwordRequired' }),
});

const passwordByteLength = (password: string) => new TextEncoder().encode(password).length;

// Mirrors the backend's new-password rule (min 8 characters, max 72 bytes, never trimmed).
export const authSetPasswordFormSchema = z.object({
    password: z.string()
        .min(PASSWORD_MIN_LENGTH, { message: 'validation.passwordMinLength' })
        .refine((password) => passwordByteLength(password) <= PASSWORD_MAX_BYTES, {
            message: 'validation.passwordMaxLength',
        }),
    confirmPassword: z.string().min(1, { message: 'validation.confirmPasswordRequired' }),
}).refine((form) => form.password === form.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
});
