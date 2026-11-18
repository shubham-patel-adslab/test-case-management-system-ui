import type { AuthPermissionsResponseDto } from '../auth.response.dto';

// Same grants as the backend's seed migrations. A resource with no grant is absent.
export const rolePermissionsMock: Record<string, AuthPermissionsResponseDto> = {
    ADMIN: {
        PROJECT: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        USER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        ALL_PROJECTS: ['READ', 'UPDATE', 'DELETE'],
        TEST_CASE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        TEST_SUITE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        TEST_EXECUTION: ['CREATE', 'READ', 'UPDATE'],
        TEST_ASSIGNMENT: ['CREATE'],
        DEFECT: ['CREATE', 'READ'],
    },
    TEST_LEAD: {
        PROJECT: ['CREATE', 'READ', 'UPDATE'],
        TEST_CASE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        TEST_SUITE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        TEST_EXECUTION: ['CREATE', 'READ', 'UPDATE'],
        TEST_ASSIGNMENT: ['CREATE'],
        DEFECT: ['CREATE', 'READ'],
    },
    TESTER: {
        PROJECT: ['READ'],
        TEST_CASE: ['READ'],
        TEST_SUITE: ['READ'],
        TEST_EXECUTION: ['CREATE', 'READ', 'UPDATE'],
        DEFECT: ['CREATE', 'READ'],
    },
    READ_ONLY: {
        PROJECT: ['READ'],
        TEST_CASE: ['READ'],
        TEST_SUITE: ['READ'],
        TEST_EXECUTION: ['READ'],
        DEFECT: ['READ'],
    },
};
