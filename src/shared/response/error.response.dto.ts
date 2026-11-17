export type ErrorDetailDto = {
    field: string;
    message: string;
};

// Error envelope for every non-2xx response (ui-requirements §6.2).
export type ErrorResponseDto = {
    error: {
        code: string;
        message: string;
        details?: ErrorDetailDto[];
    };
};
