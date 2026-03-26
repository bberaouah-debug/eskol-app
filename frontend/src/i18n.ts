import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar todos los ficheros de traducción
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esUsers from './locales/es/users.json';
import esInventario from './locales/es/inventario.json';

import caCommon from './locales/ca/common.json';
import caAuth from './locales/ca/auth.json';
import caDashboard from './locales/ca/dashboard.json';
import caUsers from './locales/ca/users.json';
import caInventario from './locales/ca/inventario.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        auth: esAuth,
        dashboard: esDashboard,
        users: esUsers,
        inventario: esInventario,
      },
      ca: {
        common: caCommon,
        auth: caAuth,
        dashboard: caDashboard,
        users: caUsers,
        inventario: caInventario,
      },
    },
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
