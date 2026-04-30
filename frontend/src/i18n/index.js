import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import uz from './locales/uz.json';
import en from './locales/en.json';

const SUPPORTED_LANGS = ['ru', 'uz', 'en'];

const getSavedLang = () => {
  try {
    const saved = localStorage.getItem('language');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {}
  return 'ru';
};

const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
  en: { translation: en },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: getSavedLang(),
    fallbackLng: 'ru',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  try {
    localStorage.setItem('language', lng);
  } catch {}
});

export default i18n;
