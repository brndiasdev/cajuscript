export const locales = ['br', 'en'] as const;
export type Locale = ( typeof locales )[number]
export const defaultLocale: Locale = 'br';
