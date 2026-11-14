import { setupWorker } from 'msw/browser';

import { handlers } from './mock.index';

export const worker = setupWorker(...handlers);
