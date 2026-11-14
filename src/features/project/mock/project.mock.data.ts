import type { ProjectDetailsResponseDto, ProjectMemberResponseDto } from '../project.response.dto';
import { PROJECT_STATUSES } from '../project.constant';

// Stand-in team members until the user feature ships its own mock users.
const memberMock: ProjectMemberResponseDto[] = [
    { id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@example.com' },
    { id: 2, name: 'Neha Kapoor', email: 'neha.kapoor@example.com' },
    { id: 3, name: 'Vikram Rao', email: 'vikram.rao@example.com' },
    { id: 4, name: 'Sara Thomas', email: 'sara.thomas@example.com' },
];

const projectNames = [
    'Customer Portal', 'Payments Gateway', 'Mobile Banking App', 'Inventory Service', 'HR Onboarding',
    'Analytics Dashboard', 'Notification Service', 'Search Platform', 'Order Management', 'Loyalty Program',
    'Partner API', 'Admin Console', 'Billing Engine', 'Shipping Tracker', 'Identity Service',
    'Reporting Suite', 'Chat Support Widget', 'Content CMS', 'Fraud Detection', 'Data Export Tool',
    'Booking System', 'Feedback Survey', 'Pricing Engine', 'Audit Log Service', 'Marketing Site',
];

const BASE_DATE = Date.UTC(2026, 0, 5);
const DAY_MS = 24 * 60 * 60 * 1000;

// Mutable on purpose: the create/update handlers write to it so changes survive until reload.
export const projectDetailsMock: ProjectDetailsResponseDto[] = projectNames.map((name, index) => {
    const createdAt = new Date(BASE_DATE + index * 7 * DAY_MS).toISOString();

    return {
        id: index + 1,
        name,
        description: `Test project for the ${name}.`,
        version: `${1 + (index % 3)}.${index % 5}.0`,
        status: PROJECT_STATUSES[index % PROJECT_STATUSES.length],
        members: memberMock.slice(0, index % (memberMock.length + 1)),
        createdAt,
        updatedAt: createdAt,
    };
});
