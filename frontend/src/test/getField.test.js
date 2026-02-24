import { describe, it, expect } from 'vitest';

// The getField pattern used across all pages
function getField(item, field, lang) {
  return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
}

// The L() pattern used in Congress page
function L(item, field, lang) {
  return item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';
}

const mockNews = {
  id: 1,
  title_ru: 'Заголовок новости',
  title_uz: 'Yangilik sarlavhasi',
  title_en: 'News headline',
  content_ru: '<p>Содержание</p>',
  content_uz: '<p>Mazmun</p>',
  content_en: '<p>Content</p>',
};

const mockPartialItem = {
  id: 2,
  title_ru: 'Только русский',
  title_uz: '',
  title_en: '',
};

const mockNullItem = {
  id: 3,
  title_ru: 'Русский заголовок',
  title_uz: null,
  title_en: undefined,
};

describe('getField helper', () => {
  it('returns Russian text when lang is ru', () => {
    expect(getField(mockNews, 'title', 'ru')).toBe('Заголовок новости');
  });

  it('returns Uzbek text when lang is uz', () => {
    expect(getField(mockNews, 'title', 'uz')).toBe('Yangilik sarlavhasi');
  });

  it('returns English text when lang is en', () => {
    expect(getField(mockNews, 'title', 'en')).toBe('News headline');
  });

  it('falls back to Russian when target language field is empty', () => {
    expect(getField(mockPartialItem, 'title', 'uz')).toBe('Только русский');
    expect(getField(mockPartialItem, 'title', 'en')).toBe('Только русский');
  });

  it('falls back to Russian when target language field is null/undefined', () => {
    expect(getField(mockNullItem, 'title', 'uz')).toBe('Русский заголовок');
    expect(getField(mockNullItem, 'title', 'en')).toBe('Русский заголовок');
  });

  it('returns empty string when item is null', () => {
    expect(getField(null, 'title', 'ru')).toBe('');
  });

  it('returns empty string when item is undefined', () => {
    expect(getField(undefined, 'title', 'ru')).toBe('');
  });

  it('returns empty string when field does not exist in any language', () => {
    expect(getField(mockNews, 'nonexistent', 'ru')).toBe('');
  });

  it('works with content HTML fields', () => {
    expect(getField(mockNews, 'content', 'en')).toBe('<p>Content</p>');
    expect(getField(mockNews, 'content', 'uz')).toBe('<p>Mazmun</p>');
  });

  it('language change reflects immediately in output', () => {
    let lang = 'ru';
    expect(getField(mockNews, 'title', lang)).toBe('Заголовок новости');

    lang = 'en';
    expect(getField(mockNews, 'title', lang)).toBe('News headline');

    lang = 'uz';
    expect(getField(mockNews, 'title', lang)).toBe('Yangilik sarlavhasi');

    lang = 'ru';
    expect(getField(mockNews, 'title', lang)).toBe('Заголовок новости');
  });
});

describe('L helper (Congress pattern)', () => {
  const mockCongress = {
    title_ru: 'III Конгресс',
    title_uz: 'III Kongress',
    title_en: 'III Congress',
    about_ru: 'О конгрессе',
    about_uz: "Kongress haqida",
    about_en: 'About congress',
  };

  it('returns correct field for each language', () => {
    expect(L(mockCongress, 'title', 'ru')).toBe('III Конгресс');
    expect(L(mockCongress, 'title', 'uz')).toBe('III Kongress');
    expect(L(mockCongress, 'title', 'en')).toBe('III Congress');
  });

  it('falls back to Russian', () => {
    const partial = { title_ru: 'Только RU' };
    expect(L(partial, 'title', 'en')).toBe('Только RU');
  });
});
