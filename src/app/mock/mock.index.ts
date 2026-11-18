import type { AnyHandler } from 'msw';

import { analyticsMockHandler } from '../../features/analytics/mock/analytics.mock.handler';
import { attachmentMockHandler } from '../../features/attachment/mock/attachment.mock.handler';
import { authMockHandler } from '../../features/auth/mock/auth.mock.handler';
import { defectMockHandler } from '../../features/defect/mock/defect.mock.handler';
import { projectMockHandler } from '../../features/project/mock/project.mock.handler';
import { suiteRunMockHandler } from '../../features/suite-run/mock/suite-run.mock.handler';
import { testCaseMockHandler } from '../../features/test-case/mock/test-case.mock.handler';
import { testExecutionMockHandler } from '../../features/test-execution/mock/test-execution.mock.handler';
import { testSuiteMockHandler } from '../../features/test-suite/mock/test-suite.mock.handler';
import { userMockHandler } from '../../features/user/mock/user.mock.handler';

// Each feature adds its own `<feature>.mock.handler.ts` here as it's built.
export const handlers: AnyHandler[] = [
    ...authMockHandler,
    ...projectMockHandler,
    ...userMockHandler,
    ...testCaseMockHandler,
    ...testSuiteMockHandler,
    ...testExecutionMockHandler,
    ...suiteRunMockHandler,
    ...defectMockHandler,
    ...attachmentMockHandler,
    ...analyticsMockHandler,
];
