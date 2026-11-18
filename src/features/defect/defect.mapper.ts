import type { DefectDetailsResponseDto, DefectReferenceResponseDto } from './defect.response.dto';
import type { DefectCreateRequestDto } from './defect.request.dto';
import type { DefectDetailsType, DefectFormType, DefectReferenceType } from './defect.type';
import { toUserReference } from '../user/user.mapper';

export function toDefectReference(dto: DefectReferenceResponseDto): DefectReferenceType {
    return { id: dto.id, title: dto.title, severity: dto.severity };
}

export function toDefectDetails(dto: DefectDetailsResponseDto): DefectDetailsType {
    return {
        ...toDefectReference(dto),
        description: dto.description,
        createdBy: dto.createdBy && toUserReference(dto.createdBy),
        createdAt: dto.createdAt,
    };
}

export function toDefectCreateRequestDto(form: DefectFormType): DefectCreateRequestDto {
    return { title: form.title, description: form.description, severity: form.severity };
}
