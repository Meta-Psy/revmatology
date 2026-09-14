/**
 * Резолвер многоязычных полей контента.
 *
 * Каждое пользовательское поле хранится в трёх колонках: `<field>_ru`,
 * `<field>_uz`, `<field>_en`. Русский обязателен, UZ/EN опциональны —
 * поэтому при пустом переводе всегда откатываемся на RU и никогда не бросаем.
 */
export const getField = (item, field, lang) =>
  item?.[`${field}_${lang}`] || item?.[`${field}_ru`] || '';

/**
 * Каррированный вариант для страниц, где язык один на весь рендер:
 * `const L = makeGetField(i18n.language); L(speaker, 'topic')`.
 */
export const makeGetField = (lang) => (item, field) => getField(item, field, lang);
