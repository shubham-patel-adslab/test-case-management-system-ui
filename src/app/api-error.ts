import { isAxiosError } from 'axios';

import type { ErrorDetailDto, ErrorResponseDto } from '../shared/response/error.response.dto';

// Codes the UI branches on (ui-requirements §6.2). The full list lives in the backend.
export const API_ERROR_CODE = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
    INVALID_INVITATION: 'INVALID_INVITATION',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    EMAIL_DELIVERY_FAILED: 'EMAIL_DELIVERY_FAILED',
} as const;

const HTTP_STATUS_UNAUTHORIZED = 401;

function isErrorResponseDto(data: unknown): data is ErrorResponseDto {
    return typeof data === 'object' && data !== null && 'error' in data
        && typeof (data as ErrorResponseDto).error?.code === 'string';
}

function getErrorResponse(error: unknown): ErrorResponseDto | undefined {
    return isAxiosError(error) && isErrorResponseDto(error.response?.data) ? error.response.data : undefined;
}

export function getApiErrorCode(error: unknown): string | undefined {
    return getErrorResponse(error)?.error.code;
}

// Field-level details of a VALIDATION_ERROR (`field` is the request path, e.g. "memberIds[2]").
export function getApiErrorDetails(error: unknown): ErrorDetailDto[] {
    return getErrorResponse(error)?.error.details ?? [];
}

// "Signed out" 401s — everything except a wrong password on the sign-in form.
export function isUnauthorizedError(error: unknown): boolean {
    return isAxiosError(error)
        && error.response?.status === HTTP_STATUS_UNAUTHORIZED
        && getApiErrorCode(error) !== API_ERROR_CODE.INVALID_CREDENTIALS;
}
