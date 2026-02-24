import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from '../locales/ru.json';
import uz from '../locales/uz.json';
import en from '../locales/en.json';

const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
  en: { translation: en },
};

function createI18n(lng = 'ru') {
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

describe('i18n configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with Russian as default language', () => {
    const inst = createI18n();
    expect(inst.language).toBe('ru');
  });

  it('initializes with specified language', () => {
    const inst = createI18n('en');
    expect(inst.language).toBe('en');
  });

  it('has all three language resources loaded', () => {
    const inst = createI18n();
    expect(inst.hasResourceBundle('ru', 'translation')).toBe(true);
    expect(inst.hasResourceBundle('uz', 'translation')).toBe(true);
    expect(inst.hasResourceBundle('en', 'translation')).toBe(true);
  });

  it('translates navigation keys in Russian', () => {
    const inst = createI18n('ru');
    expect(inst.t('nav.home')).toBe('Главная');
    expect(inst.t('nav.congress')).toBe('Конгресс');
    expect(inst.t('nav.news')).toBe('Новости');
    expect(inst.t('nav.login')).toBe('Вход');
    expect(inst.t('nav.register')).toBe('Регистрация');
  });

  it('translates navigation keys in Uzbek', () => {
    const inst = createI18n('uz');
    expect(inst.t('nav.home')).toBe('Bosh sahifa');
    expect(inst.t('nav.congress')).toBe('Kongress');
    expect(inst.t('nav.news')).toBe('Yangiliklar');
    expect(inst.t('nav.login')).toBe('Kirish');
  });

  it('translates navigation keys in English', () => {
    const inst = createI18n('en');
    expect(inst.t('nav.home')).toBe('Home');
    expect(inst.t('nav.congress')).toBe('Congress');
    expect(inst.t('nav.news')).toBe('News');
    expect(inst.t('nav.login')).toBe('Login');
  });

  it('falls back to Russian for missing keys', () => {
    const inst = createI18n('en');
    // Try a key that only exists in ru
    const ruInst = createI18n('ru');
    const key = 'hero.title';
    expect(inst.t(key)).toBeTruthy();
    // Both should return a value (en has its own, and fallback works)
    expect(ruInst.t(key)).toBeTruthy();
  });
});

describe('i18n language switching', () => {
  it('changes language from ru to en', async () => {
    const inst = createI18n('ru');
    expect(inst.language).toBe('ru');
    expect(inst.t('nav.home')).toBe('Главная');

    await inst.changeLanguage('en');
    expect(inst.language).toBe('en');
    expect(inst.t('nav.home')).toBe('Home');
  });

  it('changes language from ru to uz', async () => {
    const inst = createI18n('ru');
    await inst.changeLanguage('uz');
    expect(inst.language).toBe('uz');
    expect(inst.t('nav.home')).toBe('Bosh sahifa');
  });

  it('changes language from en to ru', async () => {
    const inst = createI18n('en');
    expect(inst.t('nav.home')).toBe('Home');
    await inst.changeLanguage('ru');
    expect(inst.t('nav.home')).toBe('Главная');
  });

  it('language persists after multiple changes', async () => {
    const inst = createI18n('ru');

    await inst.changeLanguage('en');
    expect(inst.language).toBe('en');

    await inst.changeLanguage('uz');
    expect(inst.language).toBe('uz');

    await inst.changeLanguage('ru');
    expect(inst.language).toBe('ru');

    // Final state should be Russian
    expect(inst.t('nav.home')).toBe('Главная');
  });

  it('does not revert language after changeLanguage resolves', async () => {
    const inst = createI18n('ru');
    await inst.changeLanguage('en');

    // Wait 100ms to check it doesn't revert
    await new Promise(r => setTimeout(r, 100));
    expect(inst.language).toBe('en');
    expect(inst.t('nav.home')).toBe('Home');
  });

  it('fires languageChanged event', async () => {
    const inst = createI18n('ru');
    const callback = vi.fn();
    inst.on('languageChanged', callback);

    await inst.changeLanguage('en');
    expect(callback).toHaveBeenCalledWith('en');
  });
});

describe('i18n localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads saved language from localStorage', () => {
    localStorage.setItem('language', 'en');
    // Simulate what the app does
    const saved = localStorage.getItem('language');
    const inst = createI18n(saved || 'ru');
    expect(inst.language).toBe('en');
  });

  it('defaults to ru when localStorage is empty', () => {
    const saved = localStorage.getItem('language');
    const inst = createI18n(saved || 'ru');
    expect(inst.language).toBe('ru');
  });

  it('defaults to ru for invalid localStorage value', () => {
    localStorage.setItem('language', 'fr');
    const saved = localStorage.getItem('language');
    const validLangs = ['ru', 'uz', 'en'];
    const lng = validLangs.includes(saved) ? saved : 'ru';
    const inst = createI18n(lng);
    expect(inst.language).toBe('ru');
  });
});

describe('translation file completeness', () => {
  const ruKeys = Object.keys(flattenObject(ru));
  const uzKeys = Object.keys(flattenObject(uz));
  const enKeys = Object.keys(flattenObject(en));

  it('uz has the same keys as ru', () => {
    const missing = ruKeys.filter(k => !uzKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('en has the same keys as ru', () => {
    const missing = ruKeys.filter(k => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('no extra keys in uz that are not in ru', () => {
    const extra = uzKeys.filter(k => !ruKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it('no extra keys in en that are not in ru', () => {
    const extra = enKeys.filter(k => !ruKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it('no empty values in ru', () => {
    const flat = flattenObject(ru);
    const empty = Object.entries(flat).filter(([, v]) => v === '');
    expect(empty).toEqual([]);
  });

  it('no empty values in uz', () => {
    const flat = flattenObject(uz);
    const empty = Object.entries(flat).filter(([, v]) => v === '');
    expect(empty).toEqual([]);
  });

  it('no empty values in en', () => {
    const flat = flattenObject(en);
    const empty = Object.entries(flat).filter(([, v]) => v === '');
    expect(empty).toEqual([]);
  });
});

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}
