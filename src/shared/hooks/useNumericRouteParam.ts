type NumericRouteParam = {
    value: number | undefined;
    isValid: boolean;
};

/**
 * Safely parses a route param expected to be a positive integer id (e.g. `:projectId`).
 * `isValid` is true when the param is absent, or present and a positive integer —
 * false for a present-but-non-numeric, non-integer, or non-positive param (e.g. `/projects/abc`, `/projects/-5`).
 * Callers whose route requires the param decide that separately (`value !== undefined`).
 */
export function useNumericRouteParam(param: string | undefined): NumericRouteParam {
    const value = param ? Number(param) : undefined;
    const isValid = value === undefined || (Number.isInteger(value) && value > 0);

    return { value, isValid };
}
