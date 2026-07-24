/**
 * Locale helpers
 */
export const formatLocale = (date: Date, locale: string = 'en-US') => {
  // TODO: Implement
  return date.toLocaleDateString(locale);
};
