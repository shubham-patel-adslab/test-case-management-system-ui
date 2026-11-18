import type { ProjectDetailsResponseDto, ProjectMemberResponseDto } from '../project.response.dto';
import { PROJECT_STATUSES } from '../project.constant';
import { compareMockUserNames, userMock, type MockUser } from '../../user/mock/user.mock.data';

// A project as the mock "database" holds it: the team as user ids (the backend's project_members).
export type MockProject = Omit<ProjectDetailsResponseDto, 'members'> & {
    memberIds: string[];
};

const projectNames = [
    'Customer Portal', 'Payments Gateway', 'Mobile Banking App', 'Inventory Service', 'HR Onboarding',
    'Analytics Dashboard', 'Notification Service', 'Search Platform', 'Order Management', 'Loyalty Program',
    'Partner API', 'Admin Console', 'Billing Engine', 'Shipping Tracker', 'Identity Service',
    'Reporting Suite', 'Chat Support Widget', 'Content CMS', 'Fraud Detection', 'Data Export Tool',
    'Booking System', 'Feedback Survey', 'Pricing Engine', 'Audit Log Service', 'Marketing Site',
];

const BASE_DATE = Date.UTC(2026, 0, 5);
const DAY_MS = 24 * 60 * 60 * 1000;

// userMock order: admin, test lead, tester, read-only, deactivated account, then 20 team members.
const [, testLead, tester, readOnly] = userMock;
const teamMembers = userMock.slice(5);

// Every non-admin account is on some projects (and off others, to show the 404 for non-members). Two
// rotating team members per project bring in invited and deactivated members too.
function seedMemberIds(index: number): string[] {
    const members = [
        index % 2 === 0 ? testLead : undefined,
        index % 3 === 0 ? tester : undefined,
        index % 4 === 0 ? readOnly : undefined,
        teamMembers[index % teamMembers.length],
        teamMembers[(index + 7) % teamMembers.length],
    ];

    return [...new Set(members.filter((member) => member !== undefined).map((member) => member.id))];
}

// Mutable on purpose: the create/update handlers write to it so changes survive until reload.
export const projectMock: MockProject[] = projectNames.map((name, index) => {
    const createdAt = new Date(BASE_DATE + index * 7 * DAY_MS).toISOString();

    return {
        id: index + 1,
        name,
        description: `Test project for the ${name}.`,
        version: `${1 + (index % 3)}.${index % 5}.0`,
        status: PROJECT_STATUSES[index % PROJECT_STATUSES.length],
        memberIds: seedMemberIds(index),
        createdAt,
        updatedAt: createdAt,
    };
});

export function toProjectMemberResponse(user: MockUser): ProjectMemberResponseDto {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        role: user.role,
    };
}

// Members ordered like the backend: first name, last name, email.
export function toProjectDetailsResponse(project: MockProject): ProjectDetailsResponseDto {
    const members = project.memberIds
        .map((userId) => userMock.find((user) => user.id === userId))
        .filter((user) => user !== undefined)
        // By full name, case-insensitive, like the backend.
        .sort((a, b) => compareMockUserNames(a, b) || a.id.localeCompare(b.id))
        .map(toProjectMemberResponse);

    return {
        id: project.id,
        name: project.name,
        description: project.description,
        version: project.version,
        status: project.status,
        members,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
}
