import type { DefectSeverity } from './defect.type';

// OpenAPI DefectCreateRequest — from a failed execution, one per execution.
export type DefectCreateRequestDto = {
    title: string;
    description: string;
    severity: DefectSeverity;
};
