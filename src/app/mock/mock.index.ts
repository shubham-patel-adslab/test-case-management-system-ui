import type { AnyHandler } from 'msw';

import { authMockHandler } from '../../features/auth/mock/auth.mock.handler';
import { projectMockHandler } from '../../features/project/mock/project.mock.handler';
import { userMockHandler } from '../../features/user/mock/user.mock.handler';

// Each feature adds its own `<feature>.mock.handler.ts` here as it's built.
export const handlers: AnyHandler[] = [
    ...authMockHandler,
    ...projectMockHandler,
    ...userMockHandler,
];
