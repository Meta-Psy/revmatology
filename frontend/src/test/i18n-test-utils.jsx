import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ru from '../i18n/locales/ru.json';
import uz from '../i18n/locales/uz.json';
import en from '../i18n/locales/en.json';

const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
  en: { translation: en },
};

export function createTestI18n(lng = 'ru') {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'uz', 'en'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}

export function renderWithProviders(ui, { route = '/', lng = 'ru' } = {}) {
  const i18nInstance = createTestI18n(lng);
  return {
    ...render(
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    ),
    i18n: i18nInstance,
  };
}
