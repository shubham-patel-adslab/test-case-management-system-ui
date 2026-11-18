import { http, HttpResponse } from 'msw';

import { defectMock, findMockDefectOfExecution, toDefectDetailsResponse, type MockDefect } from './defect.mock.data';
import type { DefectCreateRequestDto } from '../defect.request.dto';
import { getMockSessionUser, mockErrorResponse, withMockPermission } from '../../auth/mock/auth.mock.handler';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { findMockProjectInScope } from '../../project/mock/project.mock.handler';
import { addMockAuditLog, executionMock } from '../../test-execution/mock/test-execution.mock.data';

const DEFECTS_URL = `${import.meta.env.VITE_TCMS_API_URL}/projects/:projectId/test-executions/:executionId/defects`;

export const defectMockHandler = [
    // Only from a FAIL, one per execution (409 otherwise), like the backend; audit DEFECT_CREATED.
    http.post(DEFECTS_URL, withMockPermission(RESOURCE_CODE.DEFECT, PERMISSION_CODE.CREATE, async ({ params, request }) => {
        const projectId = Number(params.projectId);
        const execution = findMockProjectInScope(projectId, PERMISSION_CODE.UPDATE)
            ? executionMock.find((candidate) => candidate.id === Number(params.executionId) && candidate.projectId === projectId)
            : undefined;

        if (!execution) {
            return mockErrorResponse(404, 'NOT_FOUND', 'Test execution not found');
        }

        if (execution.status !== 'FAIL') {
            return mockErrorResponse(409, 'CONFLICT', 'A defect can only be created from a failed execution');
        }

        if (findMockDefectOfExecution(execution.id)) {
            return mockErrorResponse(409, 'CONFLICT', 'This execution already has a defect');
        }

        const body = await request.json() as DefectCreateRequestDto;
        const now = new Date().toISOString();
        const user = getMockSessionUser()!;
        const defect: MockDefect = {
            id: defectMock.reduce((maxId, candidate) => Math.max(maxId, candidate.id), 0) + 1,
            projectId,
            executionId: execution.id,
            title: body.title,
            description: body.description,
            severity: body.severity,
            createdById: user.id,
            createdAt: now,
            updatedAt: now,
        };

        defectMock.push(defect);
        addMockAuditLog(execution.id, 'DEFECT_CREATED', user.id, { defectId: defect.id }, now);

        return HttpResponse.json(toDefectDetailsResponse(defect), { status: 201 });
    })),
];
