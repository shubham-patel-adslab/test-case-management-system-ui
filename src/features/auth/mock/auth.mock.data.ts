import type { AuthPermissionsResponseDto } from '../auth.response.dto';

// Same grants as the backend's seed migrations. A resource with no grant is absent.
export const rolePermissionsMock: Record<string, AuthPermissionsResponseDto> = {
    ADMIN: {
        PROJECT: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
        USER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
    TEST_LEAD: { PROJECT: ['CREATE', 'READ', 'UPDATE'] },
    TESTER: { PROJECT: ['READ'] },
    READ_ONLY: { PROJECT: ['READ'] },
};
