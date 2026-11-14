import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common from '../shared/i18n/common.en.json';
import project from '../features/project/i18n/project.en.json';

void i18n
    .use(initReactI18next)
    .init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
            en: { common, project },
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
