// UPPER_SNAKE_CASE on the wire, as the backend stores them. INVITED = created, password not set yet.
export const USER_STATUSES = ['INVITED', 'ACTIVE', 'INACTIVE'] as const;

// What an admin may set through PATCH …/status; a user becomes INVITED only on creation (or by being
// reactivated before ever setting a password).
export const USER_SETTABLE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export const USER_NAME_MAX_LENGTH = 100;
// The longest address SMTP allows (RFC 5321) — same limit as the backend.
export const USER_EMAIL_MAX_LENGTH = 254;

// New users start as testers (PRD: the default role).
export const DEFAULT_ROLE_CODE = 'TESTER';
