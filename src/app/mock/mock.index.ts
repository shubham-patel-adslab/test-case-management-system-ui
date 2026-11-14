import type { AnyHandler } from 'msw';

import { projectMockHandler } from '../../features/project/mock/project.mock.handler';

// Each feature adds its own `<feature>.mock.handler.ts` here as it's built.
export const handlers: AnyHandler[] = [
    ...projectMockHandler,
];
