export function formatDisplayDate(value, language = 'en') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const locale = language === 'ja' ? 'ja-JP' : 'en-US';
  const options = language === 'ja'
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(date);
}
