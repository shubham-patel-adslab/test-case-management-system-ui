import type { DefectSeverity } from './defect.type';
import type { UserReferenceResponseDto } from '../user/user.response.dto';

// OpenAPI DefectReferenceResponse — on execution summaries (lists).
export type DefectReferenceResponseDto = {
    id: number;
    title: string;
    severity: DefectSeverity;
};

// OpenAPI DefectDetailsResponse — on execution details, and the create response.
export type DefectDetailsResponseDto = DefectReferenceResponseDto & {
    projectId: number;
    executionId: number;
    description: string;
    // null once the user row is removed (the OpenAPI spec omits the null — ui-requirements §11 q. 11).
    createdBy: UserReferenceResponseDto | null;
    createdAt: string;
    updatedAt: string;
};
