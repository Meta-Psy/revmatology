/** Локаль `Intl` по коду языка интерфейса. */
const localeOf = (lang) => (lang === 'ru' ? 'ru-RU' : lang === 'uz' ? 'uz-UZ' : 'en-US');

/** Одна дата: «25 сентября 2026 г.» */
export const formatDate = (dateStr, lang) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Диапазон дат. В пределах одного месяца схлопывается до «25-26 сентября 2026 г.»,
 * иначе разворачивается в две полные даты. Без даты окончания — одна дата.
 */
export const formatDateRange = (startStr, endStr, lang) => {
  if (!startStr) return '';
  const locale = localeOf(lang);
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;
  if (end && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  }
  if (end) {
    return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return start.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};
