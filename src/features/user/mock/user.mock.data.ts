import type { RoleResponseDto, UserDetailsResponseDto } from '../user.response.dto';

// Mock-only test accounts (MSW, development). The five named accounts sign in with this password; on the
// real backend an admin invites users and they choose their own.
export const MOCK_USER_PASSWORD = 'Tcms-Mock-1';

// A user record as the mock "database" holds it: the API shape plus what the API never returns.
export type MockUser = UserDetailsResponseDto & {
    password: string | null;
    invitationToken: string | null;
};

export const roleMock: RoleResponseDto[] = [
    { code: 'ADMIN', name: 'Admin', description: 'Full access, including user management' },
    { code: 'TEST_LEAD', name: 'Test Lead', description: 'Manages projects, test cases and suites' },
    { code: 'TESTER', name: 'Tester', description: 'Executes tests and records results' },
    { code: 'READ_ONLY', name: 'Read Only', description: 'Views test data and reports only' },
];

function toUserRole(code: string): UserDetailsResponseDto['role'] {
    const role = roleMock.find((role) => role.code === code)!;

    return { code: role.code, name: role.name };
}

const BASE_DATE = Date.UTC(2026, 0, 5);
const DAY_MS = 24 * 60 * 60 * 1000;

function mockUser(
    index: number,
    firstName: string,
    lastName: string,
    email: string,
    roleCode: string,
    status: MockUser['status'],
): MockUser {
    const createdAt = new Date(BASE_DATE + index * DAY_MS).toISOString();

    return {
        id: `3f6c1f0e-8a4b-4c1d-9e2f-${String(index + 1).padStart(12, '0')}`,
        firstName,
        lastName,
        email,
        status,
        role: toUserRole(roleCode),
        createdAt,
        updatedAt: createdAt,
        password: status === 'INVITED' ? null : MOCK_USER_PASSWORD,
        invitationToken: status === 'INVITED' ? `mock-invitation-${index + 1}` : null,
    };
}

const teamMembers: [string, string, string, MockUser['status']][] = [
    ['Aarav', 'Mehta', 'TEST_LEAD', 'ACTIVE'], ['Neha', 'Kapoor', 'TESTER', 'ACTIVE'],
    ['Vikram', 'Rao', 'TESTER', 'ACTIVE'], ['Sara', 'Thomas', 'READ_ONLY', 'ACTIVE'],
    ['Kabir', 'Singh', 'TESTER', 'INVITED'], ['Meera', 'Iyer', 'TEST_LEAD', 'ACTIVE'],
    ['Rahul', 'Verma', 'TESTER', 'INACTIVE'], ['Priya', 'Nair', 'TESTER', 'ACTIVE'],
    ['Arjun', 'Das', 'READ_ONLY', 'INVITED'], ['Diya', 'Joshi', 'TESTER', 'ACTIVE'],
    ['Karan', 'Malhotra', 'TESTER', 'ACTIVE'], ['Ananya', 'Bose', 'TEST_LEAD', 'ACTIVE'],
    ['Rohit', 'Kulkarni', 'TESTER', 'INACTIVE'], ['Isha', 'Reddy', 'READ_ONLY', 'ACTIVE'],
    ['Nikhil', 'Pandey', 'TESTER', 'ACTIVE'], ['Tara', 'Menon', 'TESTER', 'INVITED'],
    ['Varun', 'Chopra', 'TESTER', 'ACTIVE'], ['Pooja', 'Shah', 'TEST_LEAD', 'ACTIVE'],
    ['Siddharth', 'Ghosh', 'TESTER', 'ACTIVE'], ['Kavya', '', 'READ_ONLY', 'ACTIVE'],
];

// Mutable on purpose: the user and invitation handlers write to it, and the auth mocks read it, so a
// change (deactivate, accept invitation) behaves like the real backend until reload.
export const userMock: MockUser[] = [
    mockUser(0, 'Asha', 'Admin', 'admin@tcms.test', 'ADMIN', 'ACTIVE'),
    mockUser(1, 'Leena', 'Lead', 'lead@tcms.test', 'TEST_LEAD', 'ACTIVE'),
    mockUser(2, 'Tarun', 'Tester', 'tester@tcms.test', 'TESTER', 'ACTIVE'),
    mockUser(3, 'Rohan', 'Reader', 'readonly@tcms.test', 'READ_ONLY', 'ACTIVE'),
    mockUser(4, 'Ivan', 'Inactive', 'inactive@tcms.test', 'TESTER', 'INACTIVE'),
    ...teamMembers.map(([firstName, lastName, roleCode, status], index) => mockUser(
        index + 5,
        firstName,
        lastName,
        `${[firstName, lastName].filter(Boolean).join('.')}@example.com`.toLowerCase(),
        roleCode,
        status,
    )),
];

export function toUserDetailsResponse(user: MockUser): UserDetailsResponseDto {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
