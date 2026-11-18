import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common from '../shared/i18n/common.en.json';
import project from '../features/project/i18n/project.en.json';
import auth from '../features/auth/i18n/auth.en.json';
import user from '../features/user/i18n/user.en.json';
import testCase from '../features/test-case/i18n/test-case.en.json';
import testSuite from '../features/test-suite/i18n/test-suite.en.json';
import testExecution from '../features/test-execution/i18n/test-execution.en.json';
import suiteRun from '../features/suite-run/i18n/suite-run.en.json';
import defect from '../features/defect/i18n/defect.en.json';
import attachment from '../features/attachment/i18n/attachment.en.json';
import analytics from '../features/analytics/i18n/analytics.en.json';
import metrics from '../features/metrics/i18n/metrics.en.json';

void i18n
    .use(initReactI18next)
    .init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
            en: { common, project, auth, user, testCase, testSuite, testExecution, suiteRun, defect, attachment, analytics, metrics },
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
